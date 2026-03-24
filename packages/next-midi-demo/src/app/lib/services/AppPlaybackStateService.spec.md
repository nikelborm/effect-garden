# AppPlaybackStateService — State Machine Spec

## Concepts

- **Slow strum**: a one-shot audio clip. No pattern selected; only chord +
  strength matter. Plays once and stops automatically.
- **Loop**: a looping audio clip. Requires a pattern + chord + strength. Repeats
  indefinitely.
- **Tick**: 1 second. A track is 8 ticks (8 seconds). Loop-to-loop crossfades
  happen on tick boundaries.
- **Transition**: a brief (1 ms) crossfade. The outgoing clip fades out, the
  incoming one fades in, at the same tick boundary.
- **`transitionQueue`**: ordered list of playbacks — index 0 is the
  oldest/current, last is the newest/target.
- **"fits into buffer"**: there is at least 30 ms before the nearest upcoming
  tick boundary, i.e. we can still schedule at that boundary without a race.
- **Cleanup fiber**: a daemon fiber that fires after a scheduled transition
  completes, advances the state, and disposes the old playback node.

---

## States

| State | What is happening |
|---|---|
| `NotPlaying` | Silence. Nothing is playing. |
| `PlayingSlowStrum` | A one-shot clip is playing at full volume. A daemon timer is running; when it fires, the state moves to `NotPlaying`. |
| `ScheduledSlowStrumToLoopTransition` | A one-shot clip is still playing. A loop has been pre-scheduled to begin the moment the one-shot ends. A cleanup fiber will fire at that time and advance the state. |
| `PlayingLoop` | A looping clip is playing at full volume indefinitely. |
| `ScheduledLoopToLoopTransition` | A loop is fading out toward the next tick boundary. A new loop is pre-loaded and will fade in exactly at that tick. A cleanup fiber fires at that tick to advance the state. |
| `ScheduledLoopToSilenceTransition` | A loop is fading out toward the next tick boundary. No successor is coming — it will go silent. A cleanup fiber fires at that tick. |
| `InProgressLoopToLoopTransitionWithScheduledChangeToYetLoop` | Two crossfades are in flight: old→middle is happening now (too late to cancel), and middle→target is queued for the next tick. Three playbacks coexist. |
| `InProgressLoopToLoopTransitionWithScheduledTransitionToSilence` | A crossfade old→new is in progress (too late to cancel), but now the new one is also scheduled to fade to silence after it fades in. |

---

## Events and Triggers

There are three sources of transitions:

1. **`switchPlayPauseFromCurrentlySelected`** — user presses the play/stop button.
2. **`reschedulePlayback`** — the selected asset changes (chord, pattern, or strength), fired as a stream.
3. **Cleanup fibers** — daemon fibers that fire when a scheduled fade completes; they call `getNewCleanedUpState`.

---

## Transitions: Play/Stop Button

| From | To | Action |
|---|---|---|
| `NotPlaying` | `PlayingSlowStrum` | (no pattern selected) Load asset from OPFS, decode, start one-shot immediately at full volume. Spawn a timer fiber to stop it after its duration. |
| `NotPlaying` | `PlayingLoop` | (pattern selected) Load asset, decode, start looping immediately at full volume. |
| Any playing state | `NotPlaying` | Fade out all playbacks in the transition queue exponentially over 1 ms, then disconnect them. |

---

## Transitions: Asset Changed (`reschedulePlayback`)

### From `NotPlaying`

No change — stay in `NotPlaying`.

### From `PlayingSlowStrum`

| Condition | To | Action |
|---|---|---|
| Same asset as before | `PlayingSlowStrum` | No-op. |
| Different asset, still no pattern | `PlayingSlowStrum` | Immediately stop and disconnect current one-shot. Load new asset, start new one-shot immediately. Reset playback timer. |
| Pattern now selected | `ScheduledSlowStrumToLoopTransition` | Keep current one-shot playing. Pre-load new loop and schedule it to start exactly when the one-shot ends (silenced until then). |

### From `ScheduledSlowStrumToLoopTransition`

| Condition | To | Action |
|---|---|---|
| Same queued loop asset | same state | No-op. |
| Pattern deselected | `PlayingSlowStrum` | Cancel and disconnect both the one-shot and the pre-scheduled loop. Load new asset, start new one-shot immediately. |
| Different pattern/asset selected | `PlayingLoop` | Cancel and disconnect both. Load new loop, start it immediately at full volume. |

### From `PlayingLoop`

| Condition | To | Action |
|---|---|---|
| Same asset | same state | No-op. |
| Pattern deselected | `ScheduledLoopToSilenceTransition` | Schedule current loop to fade out ending at the next tick boundary. Spawn cleanup fiber. |
| Different loop asset | `ScheduledLoopToLoopTransition` | Schedule current loop to fade out at next tick. Pre-load new loop and schedule it to fade in at the same tick. Spawn cleanup fiber. |

### From `ScheduledLoopToLoopTransition`

| Condition | To | Action |
|---|---|---|
| Same target as already queued | same state | No-op. |
| Asset reverted to *current* (index 0) AND fits in buffer | `PlayingLoop` | Cancel scheduled fade on current, restore it to full volume. Cancel cleanup fiber. Discard the queued target. |
| Pattern deselected AND fits in buffer | `ScheduledLoopToSilenceTransition` | Cancel and discard the queued target. Current's fade-to-silence schedule is already in place. |
| Pattern deselected AND does NOT fit in buffer (crossfade already starting) | `InProgressLoopToLoopTransitionWithScheduledTransitionToSilence` | Keep the in-progress crossfade. Also schedule the target (index 1) to fade out after it fades in. Spawn new cleanup fiber on target. |
| New loop asset AND fits in buffer | `ScheduledLoopToLoopTransition` | Cancel old target. Reschedule current's fade for the same tick. Load new target and schedule its fade-in. Update cleanup fiber. |
| New loop asset AND does NOT fit in buffer (crossfade already starting) | `InProgressLoopToLoopTransitionWithScheduledChangeToYetLoop` | The old target (index 1) is now mid-crossfade; schedule its fade-out. Load new asset (index 2). Spawn cleanup fiber on old target. |

### From `ScheduledLoopToSilenceTransition`

| Condition | To | Action |
|---|---|---|
| Still no pattern selected | same state | No-op. |
| Pattern selected AND fits in buffer | `ScheduledLoopToLoopTransition` | Cancel current's scheduled fade-to-silence, restore it to full volume. Cancel cleanup fiber. Reschedule current's new fade-out plus new loop's fade-in at the next tick. |
| Pattern selected AND does NOT fit in buffer (fade already started) | `ScheduledLoopToLoopTransition` | The current is already fading; let it finish. Schedule the new loop to begin exactly when the current ends. |

### From `InProgressLoopToLoopTransitionWithScheduledChangeToYetLoop` and `InProgressLoopToLoopTransitionWithScheduledTransitionToSilence`

No further transitions from asset-change events — `reschedulePlayback` returns `oldState` unchanged for these states.

---

## Transitions: Cleanup Fibers (`getNewCleanedUpState`)

These fire automatically when a tick boundary passes and the scheduled audio transition has completed.

| From | To | Action |
|---|---|---|
| `ScheduledLoopToLoopTransition` | `PlayingLoop` | Disconnect old playback (index 0). Target (index 1) is now the sole current loop. |
| `InProgressLoopToLoopTransitionWithScheduledChangeToYetLoop` | `ScheduledLoopToLoopTransition` | Disconnect oldest (index 0). Middle (index 1) becomes current (fading out). Target (index 2) stays queued. |
| `ScheduledSlowStrumToLoopTransition` | `PlayingLoop` | Disconnect the one-shot. Loop (index 1) is now current; `playbackStartedAtSecond` advances by the one-shot's duration. |
| `ScheduledLoopToSilenceTransition` | `NotPlaying` | Disconnect fading loop. |
| `InProgressLoopToLoopTransitionWithScheduledTransitionToSilence` | `ScheduledLoopToSilenceTransition` | Disconnect oldest (index 0). Middle (index 1) is now fading to silence on its own schedule. |

---

## Auto-stop for Slow Strum

When the state transitions into `PlayingSlowStrum`, a daemon fiber is spawned with a delay equal to the remaining duration of the one-shot. When it fires:

- If the state is still `PlayingSlowStrum` and it holds the same playback node → fade out all playbacks and move to `NotPlaying`.
- Otherwise (state changed in the meantime) → no-op.

---

## Derived Streams (outputs)

- **`latestIsPlayingFlagStream`**: emits `true`/`false` whenever playback starts or stops.
- **`playStopButtonPressableFlagChangesStream`**: the play/stop button is pressable when either (a) something is currently playing (stop is always available), or (b) the currently selected asset has finished downloading.
- **`playbackPublicInfoChangesStream`**: emits the current state tag + the full asset transition queue (without internal playback nodes), for UI display.
