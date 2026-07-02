# next-midi-demo Memory Index

These memories live **inside the repo** (`apps/next-midi-demo/.claude/memory/`) so they sync across machines via git, instead of the per-machine `~/.claude` memory dir.

> **Convention — read this when working on next-midi-demo:** save EVERY new memory related to next-midi-demo as a file in THIS folder and add a one-line pointer below — never in the home `~/.claude/.../memory/` dir. Same format as elsewhere (frontmatter with `name`/`description`/`metadata.type`, body, `[[links]]`). The home `~/.claude` index keeps only a pointer back here.

## User
- [user_working_style](user_working_style.md) — Avoidant, low-resource; carry executive load, shrink scope, pair tightly, validate then move

## Project
- [project_next_midi_demo_scheduling](project_next_midi_demo_scheduling.md) — The scary playback-scheduling MVP: scope, raw-timing design principle, slow-strum deferral, trusted spec
- [midi_scheduling_findings_2026_06_25](midi_scheduling_findings_2026_06_25.md) — 2026-06-25 scheduler findings, split into user-verified facts vs my-inferred/provisional

## Feedback
- [feedback_project_memory_location](feedback_project_memory_location.md) — Save next-midi-demo memories here in the repo, not in home ~/.claude
- [feedback_accumulation_patterns](feedback_accumulation_patterns.md) — Use discriminated union state machine Maps, not parallel arrays; labeled loops; dieMessage for invariants
- [feedback_use_bun](feedback_use_bun.md) — Use bun, not npm, in the effect-garden repo
- [feedback_yolo_formatting](feedback_yolo_formatting.md) — After `bun run lint`, never check if failures are pre-existing (no git-stash diffing) — typecheck is the only gate
- [feedback_schema_type_accessor](feedback_schema_type_accessor.md) — Prefer `typeof S.Type` over `Schema.Schema.Type<typeof S>`
- [feedback_prefer_interface_over_type](feedback_prefer_interface_over_type.md) — Prefer `interface` (with extends) over `type =`; reserve `type` for unions/tuples/literals
