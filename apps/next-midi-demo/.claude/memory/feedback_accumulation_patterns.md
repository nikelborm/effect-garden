---
name: feedback-accumulation-patterns
description: How to accumulate state across loops and assert invariants in Effect-ts code
metadata:
  node_type: memory
  type: feedback
  originSessionId: 7448008e-6082-48d3-8db1-3da0bddcb014
---

When accumulating state across a loop to drive later actions, model it as a **discriminated union state machine in a Map** (`{ type: 'never' } | { type: 'once', ...data } | { type: 'multiple' }`), not as parallel accumulator arrays (`toAdd`, `toRemove`, etc.). This eliminates multiple build-then-process array pairs and makes state transitions explicit.

**Why:** Parallel arrays require two build loops and two process loops; the union Map requires one of each. The user rewrote a function that used this antipattern and considered the original "garbage."

**How to apply:**
- Use a single Map with a union type instead of `toAdd: X[]` + `toRemove: Y[]` + `toUpdate: Z[]`
- Store all data needed for the final action inline in the map entry at set time (no second lookup)
- Use labeled `continue`/`break` (`catalogLoop:`, `pkgLoop:`) for multi-level loop control instead of restructuring into helper functions or flag variables
- Assert invariants with `Effect.dieMessage` rather than silencing impossible cases with `?.` or `?? []` — if it truly can't happen, crash loudly rather than silently skipping
- Process inline in a single final loop rather than building an intermediate array just to iterate it once
