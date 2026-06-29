---
name: feedback_schema_type_accessor
description: Prefer S.Type over Schema.Schema.Type<typeof S> for deriving a schema's Type
metadata:
  node_type: memory
  type: feedback
---

When deriving the inferred Type (or Encoded) of an Effect `Schema`, prefer the accessor form `typeof SomeSchema.Type` over the verbose `Schema.Schema.Type<typeof SomeSchema>`. Same for `.Encoded`. Good example: `typeof LoopRolloverHandoverQueue.Type`.

This applies both in type aliases/interfaces (e.g. `export type SilenceBoundQueue = typeof SilenceBoundQueue.Type`, `interface PureSilenceState extends SilenceBoundPlayback { readonly transitionQueue: typeof PureSilenceQueue.Type }`) and anywhere else a schema's Type is needed.

**Why:** It's shorter, reads better, and matches the existing style in this codebase — the user converted my `Schema.Schema.Type<typeof X>` usages to `typeof X.Type` by hand. The user also prefers `interface … extends Class { readonly field: … }` over `Class & { … }` intersections for narrowing a class's field.

**How to apply:** Reach for `typeof Schema.Type` first. Only fall back to `Schema.Schema.Type<...>` if the accessor form genuinely doesn't work in that position. See [[feedback_accumulation_patterns]].
