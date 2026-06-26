---
name: feedback_project_memory_location
description: Save all next-midi-demo memories inside the repo's .claude/memory, not the home ~/.claude dir
metadata:
  type: feedback
---

Save EVERY memory related to next-midi-demo as a file in `apps/next-midi-demo/.claude/memory/` (this folder) and add a one-line pointer to its `MEMORY.md`. Do NOT put next-midi-demo memories in the home `~/.claude/projects/.../memory/` dir.

**Why:** The user works on this project from multiple computers. Keeping memories in the repo lets them sync via git and be reused by Claude instances on other machines. The home `~/.claude` memory dir is per-machine and doesn't travel.

**How to apply:** When recalling, read this folder's `MEMORY.md`. When saving anything next-midi-demo-related, write the file here and index it here. The home index keeps only a pointer back to this folder. Machine-local notes (e.g. absolute paths that differ per machine) stay in the home dir instead.
