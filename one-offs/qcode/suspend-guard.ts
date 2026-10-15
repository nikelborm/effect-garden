// Keeps a fullscreen app alive in a `kitty --single-instance` window when it
// tries to suspend itself with Ctrl+Z.
//
// kitty spawns qcode with `setsid`, so qcode is a session leader and the
// process group it shares with its children is *orphaned*: the parent of every
// member is either inside the group or outside the session. The kernel silently
// drops SIGTSTP/SIGTTIN/SIGTTOU for an orphaned group, because nothing in that
// session could ever resume a stopped member.
//
// That is invisible until an app implements Ctrl+Z the way opencode does:
// restore the terminal (leave the alternate screen, re-enable canonical mode
// and echo), ask to be stopped, and wait for SIGCONT before drawing again. The
// stop request is dropped on the floor, so the app parks — process alive, UI
// gone, terminal handed back. The window goes blank with nothing to type into,
// and `ps`/`top` show nothing stopped either, because nothing was ever stopped.
//
// Handing the group real job control is impossible from here (`setpgid` has to
// happen before the child calls `execve`), so qcode plays the part of the
// missing shell: the moment the app gives the terminal back, send SIGCONT to
// the group that owned it. A process that is not parked ignores SIGCONT, so a
// false positive costs nothing, while a real one turns a dead window into a
// ~50 ms flicker.

import { dlopen, FFIType } from 'bun:ffi'

import * as Effect from 'effect/Effect'
import * as Ref from 'effect/Ref'
import * as Schedule from 'effect/Schedule'

/**
 * How often the terminal is inspected while a launcher's child runs. A parked
 * app stays parked until something sends SIGCONT, so this only bounds how long
 * the user stares at a blank screen; each inspection is two libc calls.
 */
const POLL_INTERVAL = '50 millis'

// `struct termios` (uapi/asm-generic/termbits.h — identical layout in glibc and
// musl) is four `tcflag_t` (u32) fields — c_iflag, c_oflag, c_cflag, c_lflag —
// followed by c_line, c_cc[] and the two speed fields. Only c_lflag is needed.
const C_LFLAG_OFFSET = 12
// sizeof(struct termios) is 60 on Linux; round up for headroom.
const TERMIOS_SIZE = 64
// Every bit c_lflag may have (termbits.h spells these in octal): ISIG, ICANON,
// XCASE, ECHO, ECHOE, ECHOK, ECHONL, NOFLSH, TOSTOP, ECHOCTL, ECHOPRT, ECHOKE,
// FLUSHO, PENDIN, IEXTEN. Bit 0x2000 is unused, hence 0xDFFF. Any other bit
// means the offset above is wrong for this platform — and note that every real
// terminal does set IEXTEN (0x8000), so a mask without it would reject cooked
// mode and see a parked app where there is none.
const KNOWN_LFLAG_BITS = 0xdfff
const ICANON = 0b10

type Libc = {
  readonly tcgetattr: (fd: number, termios: Uint8Array) => number
  readonly tcgetpgrp: (fd: number) => number
}

// Reused by every poll: libc writes the terminal flags into this buffer. Handed
// to libc as-is — wrapping it in `ptr()` yields a call that returns 0 but never
// fills the buffer.
const termiosBuffer = new Uint8Array(TERMIOS_SIZE)
const termiosFlags = new DataView(termiosBuffer.buffer)

let cachedLibc: Libc | null | undefined

const getLibc = (): Libc | null => {
  if (cachedLibc !== undefined) return cachedLibc

  cachedLibc = null

  if (process.platform !== 'linux') return cachedLibc

  try {
    const { symbols } = dlopen('libc.so.6', {
      tcgetattr: { args: [FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
      tcgetpgrp: { args: [FFIType.i32], returns: FFIType.i32 },
    })
    cachedLibc = symbols as unknown as Libc
  } catch {
    // No libc to talk to. The launcher still works; a parked app simply stays
    // parked, exactly as it did before this file existed.
  }

  return cachedLibc
}

export type TerminalState = {
  /**
   * `true` when whatever owns the terminal has switched it to raw mode, i.e. a
   * fullscreen app is drawing and reading keys itself.
   */
  readonly isRaw: boolean | null
  /**
   * The process group that owns the terminal: the group the tty driver
   * delivers stop/continue signals to, and therefore the group a parked app
   * sits in.
   */
  readonly foregroundProcessGroup: number | null
}

// One instance is reused across polls (20 short-lived objects a second would be
// harmless, but there is no reason to make the GC care) — read the fields
// before the next call.
const terminalState: {
  isRaw: boolean | null
  foregroundProcessGroup: number | null
} = { isRaw: null, foregroundProcessGroup: null }

/**
 * Both fields are `null` when the terminal cannot be inspected: not a tty, no
 * libc, or a `struct termios` layout we do not know.
 */
export const readTerminalState = (fd: number): TerminalState => {
  terminalState.isRaw = null
  terminalState.foregroundProcessGroup = null

  const libc = getLibc()
  if (libc === null) return terminalState

  if (libc.tcgetattr(fd, termiosBuffer) !== 0) return terminalState

  const lflag = termiosFlags.getUint32(C_LFLAG_OFFSET, true)

  if ((lflag & ~KNOWN_LFLAG_BITS) !== 0) {
    // Reading the wrong offset. Signalling a process group on garbage is worse
    // than never signalling, so give up on this platform for good.
    cachedLibc = null
    return terminalState
  }

  const pgrp = libc.tcgetpgrp(fd)

  terminalState.isRaw = (lflag & ICANON) === 0
  terminalState.foregroundProcessGroup = pgrp > 0 ? pgrp : null

  return terminalState
}

/**
 * Signals the process group `pid` leads, falling back to `pid` itself: a child
 * spawned without `detached` (as every launcher here does) belongs to *our*
 * group, so there is no group named after it.
 *
 * `ChildProcessHandle.kill` is deliberately not used: it is a terminate helper
 * that signals and then awaits the actual exit, which for a resume never comes.
 */
export const signalProcessGroup = (pid: number, signal: NodeJS.Signals) =>
  Effect.sync(() => {
    try {
      process.kill(-pid, signal)
    } catch {
      try {
        process.kill(pid, signal)
      } catch {
        // Both gone: the app exited between the poll and this signal.
      }
    }
  })

/**
 * Signals that the app is back in business. A parked app gave the terminal back
 * (cooked mode) after having had it (raw mode); that ordering is the whole
 * signal here, because nothing else in a window without a shell can tell a
 * parked app from a finished one.
 */
const waitForParkedApp = (
  fd: number,
  sawRawMode: Ref.Ref<boolean>,
  childPid: number,
) =>
  Effect.gen(function* () {
    const { isRaw, foregroundProcessGroup } = readTerminalState(fd)

    if (isRaw === null) return

    if (isRaw) {
      yield* Ref.set(sawRawMode, true)
      return
    }

    if (!(yield* Ref.get(sawRawMode))) return

    yield* Ref.set(sawRawMode, false)

    // Whoever owns the terminal is whoever parked in it — usually the child
    // itself, but the group covers a TUI the child spawned.
    yield* signalProcessGroup(foregroundProcessGroup ?? childPid, 'SIGCONT')
  })

/**
 * Runs until interrupted, acting as the shell this window does not have. Never
 * fails, so racing it against a child's exit code cannot change the result of
 * the launcher that uses it.
 *
 * @param childPid the process the launcher spawned, used when the terminal
 *   reports no foreground process group
 * @param fd the terminal the app runs on — `0` by default, since launchers
 *   spawn their children with inherited stdio
 */
export const resumeParkedTui = Effect.fn('qcode.resumeParkedTui')(
  function* (childPid: number, fd = 0) {
    const sawRawMode = yield* Ref.make(false)

    yield* Effect.repeat(
      waitForParkedApp(fd, sawRawMode, childPid),
      Schedule.spaced(POLL_INTERVAL),
    )
  },
  Effect.catchCause(() => Effect.never),
)
