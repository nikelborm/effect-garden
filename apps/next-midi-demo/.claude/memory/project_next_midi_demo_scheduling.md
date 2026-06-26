---
name: project_next_midi_demo_scheduling
description: "next-midi-demo playback-scheduling MVP — goal, scope, design principle, and the slow-strum fear"
metadata:
  node_type: memory
  type: project
  originSessionId: 1a917f98-450a-4fee-9d56-6708b2856d56
---

The release-blocking "scary part" of next-midi-demo is the playback scheduling state machine in `app/services/AppPlaybackStateService/` — a discriminated-union state machine where input signals (accord/pattern/strength presses) drive `advancePlayback/`.

**Mental model.** Patterns are 8s loops split into 1s ticks; switching happens on tick boundaries. A transition queue holds max 3 elements; a cleanuper (`cleanupState.ts` `getNewCleanedUpState`) collapses transition states down one level at boundaries. Each tick has a tail "bad zone" where scheduling a fade-out collides with itself — so you postpone to the next slot. Pre-refactor the app worked; the refactor regressed it by commenting out the during-transition advancers, so any 2nd input during a (sub-second) transition currently `dieMessage`s.

**MVP scope** (started 2026-06-25): handle all pattern↔pattern↔silence transitions + accord/strength variant changes while looping. Assume all assets downloaded (missing-asset crash is out of scope). Exclude the rare full-queue case (pattern→pattern→pattern).

**Slow strums = the deferred monster.** A slow strum has arbitrary duration and can be interrupted mid-play, which shifts ("regrids") the tick origin — the user hasn't solved this and it scares them. MY INFERENCE (not user-confirmed): the pure-loop MVP never regrids (one stable origin), so it'd be shippable without solving strums, with slow-strum interruption walled off behind loud not-yet-handled failures. See [[midi_scheduling_findings_2026_06_25]] for the full verified-vs-inferred split.

**Design principle the user insists on** (their own diagnosis): types in `types/` must store RAW timing values (seconds), never boolean CONCLUSIONS (e.g. the spec's invented `withAdditionalPostpone`). Zones/fade-windows/postpone are pure functions recomputed on demand — see `zones.ts` (`zoneAt`, `chosenSlot`). WebAudio nodes are opaque/untestable, so timing truth lives in our data; this is also the precondition for testing (pure fns over numbers). Tests deferred until the data is derivable.

**Registries removed (2026-06-25):** AccordRegistry/StrengthRegistry/PatternRegistry and CurrentlySelectedAssetState are DELETED — they were a parallel selection model that drifted from the scheduler. Selection truth now lives in the playback state: `Silence` and the to-silence transitions (`PatternSilenceTransition`, `PatternPatternSilenceTransition`) carry base `accord`+`strength`; every other state carries it via its asset(s). The constant lists are now plain tags `AllAccords`/`AllPatterns`/`AllStrengths` (Context.Tag + Layer.succeed). UI selection-highlight + download-percent in `ParamButtonService`, the play/stop pressable flag, and `AssetDownloadScheduler`'s selected-asset are STUBBED with dumb values — real inference-from-playback-state is deferred (TODO). `bun run typecheck` passes.

**Trusted spec:** only `advancePlayback/advancePlayingPattern.spec.txt`. `advancePatternPatternTransition.spec.txt` is an ABANDONED draft — sketch only, not authoritative. Git history is not a reliable source here. See [[user_working_style]] and [[feedback_accumulation_patterns]].
