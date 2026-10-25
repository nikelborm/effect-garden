# qcode agent notes

Do not run this script (`index.ts`, `dist/minified/index.mjs` (output of
`bun run build`), or the `kitty ...` shortcut from the README).

It is an interactive terminal UI: it takes over stdin/stderr to show a
fullscreen `fzf` picker, then launches the selected project with the
configured `--opener` (`vscode`, `shell`, or `opencode` — see `--opener` in
`README.md` / `index.ts` / `local.ts`). Default (no-flags) mode has no
non-interactive fallback, so under an agent it will block waiting for input
that never comes (or hijack the terminal / spawn a nested shell).

Exception: `--help` and `--version` never touch `fzf` and exit promptly
(`--help`/`--version` exit 0, unknown flags exit 1), so
`timeout 20 bun index.ts --help < /dev/null` is a safe smoke test after
touching `index.ts`. Anything without those flags is still off-limits.

To verify changes, read `index.ts` / `local.ts` statically and run
non-interactive checks only (e.g. `bunx tsc --noEmit`, `bun run lint` from
this directory — from the repo root `bun run lint` checks the whole
monorepo). Do not execute the built bundle.
