---
name: feedback_yolo_formatting
description: After bun run lint, never check/verify whether the reported failures are pre-existing — just run it and move on
metadata:
  node_type: memory
  type: feedback
---

Don't be precious about linting/formatting, and specifically: never spend effort determining whether lint failures are pre-existing vs caused by your change (no `git stash` + re-run to diff baselines, no grepping output for your own filenames, no reasoning about individual lint rules).

**Why:** The user was annoyed at tokens/attention spent deliberating over lint when it's irrelevant to the actual task. This has been called out more than once — the recurring concrete mistake is trying to *prove* whether a lint failure predates your change (e.g. `git stash && bun run lint && git stash pop`). That triage is itself the waste of attention, regardless of the answer.

**How to apply:** In next-midi-demo run `bun run lint` (`oxlint --fix --quiet && biome check --write --unsafe`, scoped to this project — it no longer `cd`s to the monorepo root). It may exit non-zero from pre-existing errors/warnings — that's expected, not about your change, and NOT something to investigate. `bun run typecheck` passing is the ONLY gate for your change; if it's green, you're done with linting, period.

**Do NOT read the lint output.** Fire-and-forget it — pipe it to /dev/null or otherwise discard it (e.g. `bun run lint >/dev/null 2>&1`). It applies fixes in place; your own change is validated by `bun run typecheck`, not by reading lint.
