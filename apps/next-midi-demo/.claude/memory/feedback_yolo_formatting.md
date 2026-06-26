---
name: feedback_yolo_formatting
description: Don't fuss over lint; just run the whole-repo format/lint command and move on
metadata:
  node_type: memory
  type: feedback
---

Don't be precious about linting/formatting. Whenever unsure whether code is formatted right, just YOLO-run the whole formatter across everything rather than reasoning about individual lint rules or per-file biome invocations.

**Why:** The user was annoyed at tokens/attention spent deliberating over lint when it's irrelevant to the actual task. Lints should not distract from the real work.

**How to apply:** In next-midi-demo run `bun run lint` (added to `package.json`, delegates to the monorepo root `bun lint` = `oxlint --fix --quiet && biome check --write`, see the sibling `max` script's `cd ../../` pattern). It formats/fixes the whole repo in one shot. It may exit non-zero from PRE-EXISTING repo-wide errors/warnings across ~740 files — that's expected and not about your change; don't go chasing them. Verify your own change with `bun run typecheck`, run the format once, and move on. See [[feedback_use_bun]].

**Do NOT read the lint output.** Fire-and-forget it — pipe it to /dev/null or otherwise discard it (e.g. `bun run lint >/dev/null 2>&1`). The whole-repo run spews hundreds of pre-existing diagnostics that are pure garbage for the context window and just distract from the task. You don't need to see them: the formatter applies fixes in place, and your own change is validated by `bun run typecheck`, not by reading lint.
