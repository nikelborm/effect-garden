# next-midi-demo

Persistent project memory lives in `.claude/memory/` (in the repo, so it syncs
across machines via git). The index below is auto-loaded via the import; read
the individual memory files when relevant, and when saving a new next-midi-demo
memory, write it into `.claude/memory/` and add a line to its `MEMORY.md` (see
`feedback_project_memory_location`).

@.claude/memory/MEMORY.md

Use /home/evadev/projects/effect@4.0.0 as a reference folder for all the tests,
documentation etc about `effect` library and `@effect/...` family of packages.
It's a git clone of the exact monorepo (has `packages` folder). Always prefer it
instead of `node_modules`, because the cloned monorepo strictly has more info.
