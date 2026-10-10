// biome-ignore lint/correctness/noUndeclaredDependencies: vscode is provided by the VS Code extension host, not an npm dependency
import * as vscode from 'vscode'

// Timers exist in the extension host (node), but the tsconfig has neither
// DOM nor node globals, and @types/node ships no timer globals either.
declare function setTimeout(handler: () => void, timeout: number): unknown
declare function clearTimeout(id: unknown): void

interface ThemeInfo {
  label: string
  // What `workbench.colorTheme` wants: the contributed `id`, or the label.
  settingsId: string
  extensionId: string
  uiTheme?: string | undefined
}

const CONFIG_SECTION = 'themeHider'
const HIDDEN_KEY = 'hiddenThemes'
const COLOR_THEME_KEY = 'colorTheme'
const PREVIEW_DEBOUNCE_KEY = 'previewDebounceMs'
const PREVIEW_TRAIL_KEY = 'previewTrailMs'

function getHiddenThemes(): string[] {
  const config = vscode.workspace.getConfiguration(CONFIG_SECTION)
  return config.get<string[]>(HIDDEN_KEY, [])
}

async function setHiddenThemes(hidden: string[]): Promise<void> {
  const config = vscode.workspace.getConfiguration(CONFIG_SECTION)
  await config.update(HIDDEN_KEY, hidden, vscode.ConfigurationTarget.Global)
}

// While `window.autoDetectColorScheme` is on, VS Code applies the preferred
// dark/light theme on every `workbench.colorTheme` change and ignores the
// written value, so arrow preview needs detection paused while a picker
// that previews is open. The flag is restored when the picker closes.
async function pauseColorSchemeDetection(): Promise<boolean> {
  const config = vscode.workspace.getConfiguration('window')
  const detecting = config.get<boolean>('autoDetectColorScheme', false)
  if (detecting)
    await config.update(
      'autoDetectColorScheme',
      false,
      vscode.ConfigurationTarget.Global,
    )
  return detecting
}

async function resumeColorSchemeDetection(
  wasDetecting: boolean,
): Promise<void> {
  if (wasDetecting)
    await vscode.workspace
      .getConfiguration('window')
      .update('autoDetectColorScheme', true, vscode.ConfigurationTarget.Global)
}

function getPreviewDebounceMs(): number {
  return vscode.workspace
    .getConfiguration(CONFIG_SECTION)
    .get<number>(PREVIEW_DEBOUNCE_KEY, 300)
}

function getPreviewTrailMs(): number {
  return vscode.workspace
    .getConfiguration(CONFIG_SECTION)
    .get<number>(PREVIEW_TRAIL_KEY, 200)
}

// Instant apply on the first highlight, then suppress repeats until keys
// go quiet: held arrows only apply the final theme, so a held key never
// queues a slideshow of themes. The quiet time for re-arming the instant
// apply is configurable for slower key repeat on some OSs/machines.
function createPreview(config: vscode.WorkspaceConfiguration): {
  preview: (label: string | undefined) => void
  cancelPreview: () => void
} {
  let timer: ReturnType<typeof setTimeout> | undefined
  let applied: string | undefined
  let lastEventAt = 0
  const apply = (label: string) => {
    applied = label
    void config.update(
      COLOR_THEME_KEY,
      label,
      vscode.ConfigurationTarget.Global,
    )
  }
  return {
    preview(label) {
      if (!label) return
      const now = Date.now()
      const rearmed = now - lastEventAt >= getPreviewDebounceMs()
      lastEventAt = now
      if (timer) clearTimeout(timer)
      else if (rearmed) apply(label)
      timer = setTimeout(() => {
        timer = undefined
        if (label === applied) return
        apply(label)
      }, getPreviewTrailMs())
    },
    cancelPreview() {
      if (timer) {
        clearTimeout(timer)
        timer = undefined
      }
    },
  }
}

function getAllThemes(): ThemeInfo[] {
  const seen = new Map<string, ThemeInfo>()

  for (const ext of vscode.extensions.all) {
    const contributes = ext.packageJSON?.contributes?.themes as
      | Array<{ id?: string; label?: string; uiTheme?: string }>
      | undefined
    if (!Array.isArray(contributes)) continue
    for (const theme of contributes) {
      if (!theme?.label) continue
      // First contributor wins for duplicate labels. Picker shows label,
      // but workbench.colorTheme wants the settings id (`id` or label).
      if (!seen.has(theme.label))
        seen.set(theme.label, {
          label: theme.label,
          settingsId: theme.id ?? theme.label,
          extensionId: ext.id,
          uiTheme: theme.uiTheme,
        })
    }
  }

  return [...seen.values()].sort((a, b) => a.label.localeCompare(b.label))
}

function toQuickPickItem(
  theme: ThemeInfo,
): vscode.QuickPickItem & { themeId: string } {
  return {
    label: theme.label,
    description: theme.extensionId,
    themeId: theme.settingsId,
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
  const wasDetecting = await pauseColorSchemeDetection()
  const { preview, cancelPreview } = createPreview(config)

  const quickPick = vscode.window.createQuickPick<
    vscode.QuickPickItem & { themeId: string }
  >()
  const items = visible.map(toQuickPickItem)
  quickPick.items = items
  quickPick.placeholder = 'Pick a theme (hidden themes are filtered out)'
  quickPick.canSelectMany = false
  if (originalTheme) {
    const current = items.find(
      item => item.themeId === originalTheme || item.label === originalTheme,
    )
    if (current) quickPick.activeItems = [current]
  }

  // Live preview while navigating, revert on cancel.
  let accepted = false
  quickPick.onDidChangeActive(active => preview(active[0]?.themeId))
  quickPick.onDidAccept(async () => {
    accepted = true
    const selected = quickPick.selectedItems[0] ?? quickPick.activeItems[0]
    if (selected)
      await config.update(
        COLOR_THEME_KEY,
        selected.themeId,
        vscode.ConfigurationTarget.Global,
      )
    quickPick.hide()
  })
  quickPick.onDidHide(async () => {
    cancelPreview()
    if (!accepted)
      await config.update(
        COLOR_THEME_KEY,
        originalTheme,
        vscode.ConfigurationTarget.Global,
      )
    await resumeColorSchemeDetection(wasDetecting)
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
  const wasDetecting = await pauseColorSchemeDetection()
  const { preview, cancelPreview } = createPreview(config)

  const quickPick = vscode.window.createQuickPick<
    vscode.QuickPickItem & { themeId: string }
  >()
  const items = visible.map(toQuickPickItem)
  quickPick.items = items
  quickPick.placeholder = 'Select a theme to hide (arrows preview)'
  quickPick.canSelectMany = false
  if (originalTheme) {
    const current = items.find(
      item => item.themeId === originalTheme || item.label === originalTheme,
    )
    if (current) quickPick.activeItems = [current]
  }

  // Preview is temporary, hiding a theme never switches to it.
  quickPick.onDidChangeActive(active => preview(active[0]?.themeId))
  quickPick.onDidAccept(async () => {
    const selected = quickPick.selectedItems[0] ?? quickPick.activeItems[0]
    if (!selected) {
      quickPick.hide()
      return
    }
    hidden.add(selected.label)
    await setHiddenThemes([...hidden].sort())
    vscode.window.showInformationMessage(
      `Theme Hider: hid "${selected.label}".`,
    )
    quickPick.hide()
  })
  quickPick.onDidHide(async () => {
    cancelPreview()
    await config.update(
      COLOR_THEME_KEY,
      originalTheme,
      vscode.ConfigurationTarget.Global,
    )
    await resumeColorSchemeDetection(wasDetecting)
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
  const wasDetecting = await pauseColorSchemeDetection()
  const { preview, cancelPreview } = createPreview(config)
  const installed = new Map(getAllThemes().map(t => [t.label, t]))

  const quickPick = vscode.window.createQuickPick<
    vscode.QuickPickItem & { themeId: string }
  >()
  const items = hidden.map(label => {
    const theme = installed.get(label)
    if (theme) return toQuickPickItem(theme)
    return { label, description: '(not installed)', themeId: label }
  })
  quickPick.items = items
  quickPick.placeholder = 'Select a theme to unhide (arrows preview)'
  quickPick.canSelectMany = false
  if (originalTheme) {
    const current = items.find(
      item => item.themeId === originalTheme || item.label === originalTheme,
    )
    if (current) quickPick.activeItems = [current]
  }

  // Preview is temporary, unhiding never switches to the theme.
  quickPick.onDidChangeActive(active => {
    const current = active[0]
    if (current && installed.has(current.label)) preview(current.themeId)
  })
  quickPick.onDidAccept(async () => {
    const selected = quickPick.selectedItems[0] ?? quickPick.activeItems[0]
    if (!selected) {
      quickPick.hide()
      return
    }
    await setHiddenThemes(hidden.filter(t => t !== selected.label))
    vscode.window.showInformationMessage(
      `Theme Hider: unhid "${selected.label}".`,
    )
    quickPick.hide()
  })
  quickPick.onDidHide(async () => {
    cancelPreview()
    await config.update(
      COLOR_THEME_KEY,
      originalTheme,
      vscode.ConfigurationTarget.Global,
    )
    await resumeColorSchemeDetection(wasDetecting)
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
  const wasDetecting = await pauseColorSchemeDetection()
  const { preview, cancelPreview } = createPreview(config)

  const quickPick = vscode.window.createQuickPick<
    vscode.QuickPickItem & { themeId: string }
  >()
  // Checkboxes: Space toggles without moving the highlight, arrows move
  // the highlight without touching the checkboxes. Both preview below.
  quickPick.canSelectMany = true
  const items = all.map(toQuickPickItem)
  quickPick.items = items
  quickPick.placeholder = 'Checked themes are hidden (arrows preview)'
  // `picked` is only honored by showQuickPick, so seed the checkboxes here.
  quickPick.selectedItems = items.filter(item => hidden.has(item.label))
  if (originalTheme) {
    const current = items.find(
      item => item.themeId === originalTheme || item.label === originalTheme,
    )
    if (current) quickPick.activeItems = [current]
  }

  // Preview is temporary, managing never switches the theme.
  // Arrows move the highlight without touching the checkboxes.
  quickPick.onDidChangeActive(active => {
    const current = active[0]?.themeId
    preview(current)
  })
  // Space toggles a checkbox without moving the highlight,
  // so preview the toggled theme here too.
  let lastChecked = new Set(quickPick.selectedItems.map(item => item.themeId))
  quickPick.onDidChangeSelection(selection => {
    const labels = selection.map(item => item.themeId)
    const toggled =
      labels.find(label => !lastChecked.has(label)) ??
      [...lastChecked].find(label => !labels.includes(label))
    lastChecked = new Set(labels)
    const target = toggled ?? quickPick.activeItems[0]?.themeId
    preview(target)
  })
  quickPick.onDidAccept(async () => {
    const nextHidden = quickPick.selectedItems.map(item => item.label).sort()
    await setHiddenThemes(nextHidden)
    quickPick.hide()
  })
  quickPick.onDidHide(async () => {
    cancelPreview()
    await config.update(
      COLOR_THEME_KEY,
      originalTheme,
      vscode.ConfigurationTarget.Global,
    )
    await resumeColorSchemeDetection(wasDetecting)
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
