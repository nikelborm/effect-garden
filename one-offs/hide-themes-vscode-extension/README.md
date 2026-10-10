# Theme Hider

Hide unwanted themes from the theme picker.

## Problem

When you install a theme pack extension, it dumps all its themes into
`Preferences: Color Theme` (`Ctrl+K Ctrl+T`). You usually want one theme
from the pack, not ten.

## Limitation (VS Code API)

VS Code does not provide an API for extensions to remove entries from the
built-in `Preferences: Color Theme` picker. So this extension cannot
filter that built-in list directly.

Instead it provides a **filtered replacement picker**:

- `Theme Hider: Pick Theme (Filtered)` — same list as the built-in picker,
  minus your hidden themes, with live preview. Arrows preview, Enter keeps,
  Esc reverts.
- `Theme Hider: Hide a Theme…` — arrows preview, theme reverts on exit.
- `Theme Hider: Unhide a Theme…` — arrows preview, theme reverts on exit.
- `Theme Hider: Manage Hidden Themes…` (multi-select checkboxes, arrows preview, theme reverts on exit)

The filtered picker is bound to `Ctrl+K Ctrl+T` (`Cmd+K Cmd+T` on Mac)
to replace the default keybinding. You can change or remove that
keybinding in `Preferences: Open Keyboard Shortcuts`.

Hidden themes are stored in the `themeHider.hiddenThemes` setting
(global scope) as theme labels — the same string VS Code stores in
`workbench.colorTheme`.

## Develop

```sh
bun install
bun run build
```

Press `F5` in VS Code to launch an Extension Development Host, then run
`Theme Hider: Pick Theme (Filtered)`.

## Package

```sh
bun run package
```

## Install locally

```sh
bun run install:extension
```
