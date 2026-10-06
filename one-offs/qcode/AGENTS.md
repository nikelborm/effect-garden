# qcode agent notes

Do not run this script (`bun index.ts`, `bun run build` output in
`dist/minified/index.mjs`, or the `kitty ...` shortcut from the README).

It is an interactive terminal UI: it takes over stdin/stderr to show a
fullscreen `fzf` picker, then either launches VS Code or execs an interactive
`$SHELL` rooted at the selected project (see `--opener` in `README.md` /
`index.ts`). There is no non-interactive mode, so under an agent it will block
waiting for input that never comes (or hijack the terminal / spawn a nested
shell).

To verify changes, read `index.ts` / `local.ts` statically and run
non-interactive checks only (e.g. `tsc --noEmit`, `bun lint`). Do not execute
the built bundle.
