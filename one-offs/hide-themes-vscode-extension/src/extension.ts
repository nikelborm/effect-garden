// biome-ignore lint/correctness/noUndeclaredDependencies: vscode is provided by the VS Code extension host, not an npm dependency
import * as vscode from 'vscode'

interface ThemeInfo {
  label: string
  extensionId: string
  uiTheme?: string | undefined
}

const CONFIG_SECTION = 'themeHider'
const HIDDEN_KEY = 'hiddenThemes'
const COLOR_THEME_KEY = 'colorTheme'

function getHiddenThemes(): string[] {
  const config = vscode.workspace.getConfiguration(CONFIG_SECTION)
  return config.get<string[]>(HIDDEN_KEY, [])
}

async function setHiddenThemes(hidden: string[]): Promise<void> {
  const config = vscode.workspace.getConfiguration(CONFIG_SECTION)
  await config.update(HIDDEN_KEY, hidden, vscode.ConfigurationTarget.Global)
}

function getAllThemes(): ThemeInfo[] {
  const seen = new Map<string, ThemeInfo>()

  for (const ext of vscode.extensions.all) {
    const contributes = ext.packageJSON?.contributes?.themes as
      | Array<{ label?: string; uiTheme?: string }>
      | undefined
    if (!Array.isArray(contributes)) continue
    for (const theme of contributes) {
      if (!theme?.label) continue
      // First contributor wins for duplicate labels. Picker shows label,
      // and workbench.colorTheme is keyed by label, so label is the id.
      if (!seen.has(theme.label))
        seen.set(theme.label, {
          label: theme.label,
          extensionId: ext.id,
          uiTheme: theme.uiTheme,
        })
    }
  }

  return [...seen.values()].sort((a, b) => a.label.localeCompare(b.label))
}

function toQuickPickItem(
  theme: ThemeInfo,
): vscode.QuickPickItem & { themeLabel: string } {
  return {
    label: theme.label,
    description: theme.extensionId,
    themeLabel: theme.label,
  }
}

async function pickThemeFiltered(): Promise<void> {
  const hidden = new Set(getHiddenThemes())
  const all = getAllThemes()
  const visible = all.filter(t => !hidden.has(t.label))

  if (visible.length === 0) {
    vscode.window.showWarningMessage(
      'Theme Hider: all themes are hidden. Unhide one to pick a theme.',
    )
    return
  }

  const config = vscode.workspace.getConfiguration('workbench')
  const originalTheme = config.get<string>(COLOR_THEME_KEY)

  const quickPick = vscode.window.createQuickPick<
    vscode.QuickPickItem & { themeLabel: string }
  >()
  const items = visible.map(toQuickPickItem)
  quickPick.items = items
  quickPick.placeholder = 'Pick a theme (hidden themes are filtered out)'
  quickPick.canSelectMany = false
  if (originalTheme) {
    const current = items.find(item => item.themeLabel === originalTheme)
    if (current) quickPick.activeItems = [current]
  }

  // Live preview while navigating, revert on cancel.
  let accepted = false
  quickPick.onDidChangeActive(active => {
    const current = active[0]?.themeLabel
    if (current)
      void config.update(
        COLOR_THEME_KEY,
        current,
        vscode.ConfigurationTarget.Global,
      )
  })
  quickPick.onDidAccept(async () => {
    accepted = true
    const selected = quickPick.selectedItems[0] ?? quickPick.activeItems[0]
    if (selected)
      await config.update(
        COLOR_THEME_KEY,
        selected.themeLabel,
        vscode.ConfigurationTarget.Global,
      )
    quickPick.hide()
  })
  quickPick.onDidHide(async () => {
    if (!accepted)
      await config.update(
        COLOR_THEME_KEY,
        originalTheme,
        vscode.ConfigurationTarget.Global,
      )
    quickPick.dispose()
  })

  quickPick.show()
}

async function hideTheme(): Promise<void> {
  const hidden = new Set(getHiddenThemes())
  const visible = getAllThemes().filter(t => !hidden.has(t.label))
  if (visible.length === 0) {
    vscode.window.showInformationMessage('Theme Hider: no themes to hide.')
    return
  }

  const config = vscode.workspace.getConfiguration('workbench')
  const originalTheme = config.get<string>(COLOR_THEME_KEY)

  const quickPick = vscode.window.createQuickPick<
    vscode.QuickPickItem & { themeLabel: string }
  >()
  const items = visible.map(toQuickPickItem)
  quickPick.items = items
  quickPick.placeholder = 'Select a theme to hide (arrows preview)'
  quickPick.canSelectMany = false
  if (originalTheme) {
    const current = items.find(item => item.themeLabel === originalTheme)
    if (current) quickPick.activeItems = [current]
  }

  // Preview is temporary, hiding a theme never switches to it.
  quickPick.onDidChangeActive(active => {
    const current = active[0]?.themeLabel
    if (current)
      void config.update(
        COLOR_THEME_KEY,
        current,
        vscode.ConfigurationTarget.Global,
      )
  })
  quickPick.onDidAccept(async () => {
    const selected = quickPick.selectedItems[0] ?? quickPick.activeItems[0]
    if (!selected) {
      quickPick.hide()
      return
    }
    hidden.add(selected.themeLabel)
    await setHiddenThemes([...hidden].sort())
    vscode.window.showInformationMessage(
      `Theme Hider: hid "${selected.themeLabel}".`,
    )
    quickPick.hide()
  })
  quickPick.onDidHide(async () => {
    await config.update(
      COLOR_THEME_KEY,
      originalTheme,
      vscode.ConfigurationTarget.Global,
    )
    quickPick.dispose()
  })

  quickPick.show()
}

async function unhideTheme(): Promise<void> {
  const hidden = getHiddenThemes()
  if (hidden.length === 0) {
    vscode.window.showInformationMessage('Theme Hider: no themes are hidden.')
    return
  }

  const config = vscode.workspace.getConfiguration('workbench')
  const originalTheme = config.get<string>(COLOR_THEME_KEY)
  const installed = new Map(getAllThemes().map(t => [t.label, t]))

  const quickPick = vscode.window.createQuickPick<
    vscode.QuickPickItem & { themeLabel: string }
  >()
  const items = hidden.map(label => {
    const theme = installed.get(label)
    if (theme) return toQuickPickItem(theme)
    return { label, description: '(not installed)', themeLabel: label }
  })
  quickPick.items = items
  quickPick.placeholder = 'Select a theme to unhide (arrows preview)'
  quickPick.canSelectMany = false
  if (originalTheme) {
    const current = items.find(item => item.themeLabel === originalTheme)
    if (current) quickPick.activeItems = [current]
  }

  // Preview is temporary, unhiding never switches to the theme.
  quickPick.onDidChangeActive(active => {
    const current = active[0]?.themeLabel
    if (current && installed.has(current))
      void config.update(
        COLOR_THEME_KEY,
        current,
        vscode.ConfigurationTarget.Global,
      )
  })
  quickPick.onDidAccept(async () => {
    const selected = quickPick.selectedItems[0] ?? quickPick.activeItems[0]
    if (!selected) {
      quickPick.hide()
      return
    }
    await setHiddenThemes(hidden.filter(t => t !== selected.themeLabel))
    vscode.window.showInformationMessage(
      `Theme Hider: unhid "${selected.themeLabel}".`,
    )
    quickPick.hide()
  })
  quickPick.onDidHide(async () => {
    await config.update(
      COLOR_THEME_KEY,
      originalTheme,
      vscode.ConfigurationTarget.Global,
    )
    quickPick.dispose()
  })

  quickPick.show()
}

async function manageHiddenThemes(): Promise<void> {
  const hidden = new Set(getHiddenThemes())
  const all = getAllThemes()
  if (all.length === 0) {
    vscode.window.showInformationMessage('Theme Hider: no themes found.')
    return
  }

  const config = vscode.workspace.getConfiguration('workbench')
  const originalTheme = config.get<string>(COLOR_THEME_KEY)

  const quickPick = vscode.window.createQuickPick<
    vscode.QuickPickItem & { themeLabel: string }
  >()
  const items = all.map(theme => ({
    ...toQuickPickItem(theme),
    picked: hidden.has(theme.label),
  }))
  quickPick.items = items
  quickPick.placeholder = 'Checked themes are hidden (arrows preview)'
  quickPick.canSelectMany = true
  if (originalTheme) {
    const current = items.find(item => item.themeLabel === originalTheme)
    if (current) quickPick.activeItems = [current]
  }

  // Preview is temporary, managing never switches the theme.
  quickPick.onDidChangeActive(active => {
    const current = (
      active[0] as (typeof items)[number] | undefined
    )?.themeLabel
    if (current)
      void config.update(
        COLOR_THEME_KEY,
        current,
        vscode.ConfigurationTarget.Global,
      )
  })
  quickPick.onDidAccept(async () => {
    const nextHidden = quickPick.selectedItems
      .map(item => item.themeLabel)
      .sort()
    await setHiddenThemes(nextHidden)
    quickPick.hide()
  })
  quickPick.onDidHide(async () => {
    await config.update(
      COLOR_THEME_KEY,
      originalTheme,
      vscode.ConfigurationTarget.Global,
    )
    quickPick.dispose()
  })

  quickPick.show()
}

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('themeHider.pickTheme', pickThemeFiltered),
    vscode.commands.registerCommand('themeHider.hideTheme', hideTheme),
    vscode.commands.registerCommand('themeHider.unhideTheme', unhideTheme),
    vscode.commands.registerCommand(
      'themeHider.manageHiddenThemes',
      manageHiddenThemes,
    ),
  )
}

export function deactivate() {}
