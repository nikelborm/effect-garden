import type { DisposePlayback } from './DisposePlayback.ts'
import type { GetAudioNow } from './GetAudioNow.ts'
import type { RestoreFullVolume } from './RestoreFullVolume.ts'
import type { ScheduleFadeOut } from './ScheduleFadeOut.ts'
import type { ScheduleIncomingPattern } from './ScheduleIncomingPattern.ts'
import type { StartFreshPlayback } from './StartFreshPlayback.ts'

export type AllWebAudioSideEffects =
  | DisposePlayback
  | GetAudioNow
  | RestoreFullVolume
  | ScheduleFadeOut
  | ScheduleIncomingPattern
  | StartFreshPlayback
