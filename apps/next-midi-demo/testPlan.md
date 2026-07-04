let's work on the
app/services/AppPlaybackStateService/advancePlayback/advanceSilence.spec.ts

I want to pin all the potential inputs and all potential outcomes of this
function. But I want to do it in a way that would ensure not only successes are
captured, but all failures (recoverable errors), and defects (effect's die) as
well pinned too. The easiest way to that is by capturing exit with Effect.exit
and working through it. It exposes Cause object which could be inline
snapshotted

I want to test comprehensive matrix of inputs. As inputs I want to pass at least
2 of each type of signals:
1. 2 strengths. One would be different from the one stored in the base, the other will be equal
2. 2 accords. same rule
3. 2 patterns. same rule

so 6 potential inputs for the second param

There should be one root `describe` (describing according to that file) one specific advancer `advanceSilence`.

one root describe should have all the tests without any deep nesting, but all in
the same level. The semantic level of the matrix should be declated in the test
name. The convention for the test name (single character names (all patterns,
all strengths and some accords) should be padded on the right with an additional
space):
- `in: signal=A.C ; old={}` (accords: 'C ', 'Dm', 'Em', 'F ', 'G ', 'Am', 'D ', 'E ')
- `in: signal=A.Em; old={}`
- `in: signal=S.s ; old={}` (strengths: 's ', 'm ', 'v ')
- `in: signal=P.1 ; old={}` (patterns: '1 ', '2 ', '3 ', '4 ', '5 ', '6 ', '7 ', '8 ')

I want to also have some helpers present
