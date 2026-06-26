---
name: feedback_use_bun
description: "Use bun, not npm, for commands in the effect-garden repo"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 1a917f98-450a-4fee-9d56-6708b2856d56
---

In the effect-garden monorepo, use `bun` commands instead of `npm`.

**Why:** The user explicitly asked for it; the repo is bun/workspace-based (catalog deps, `bun max` script).

**How to apply:** Prefer `bun run <script>` / `bun install` etc. Typecheck is `bun run typecheck` (tsgo). See [[project_next_midi_demo_scheduling]].
