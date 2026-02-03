/**
 * _Modifiers_ are special keys which are used to generate special characters or
 * cause special actions when used in combination with other keys. Examples
 * include the `Shift` and `Control` keys, and lock keys such as `Caps Lock` and
 * `NumLock`.
 *
 * @module ModifierKeys
 *
 * @file
 * @generated
 */

/**
 * The `Alt` (Alternative) key.
 *
 * Chrome 67 and Firefox 63 now correctly interpret the right `Alt` key for
 * keyboard layouts which map that key to `AltGr`. See Firefox bug [Firefox bug
 * 900750](https://bugzil.la/900750) and [Chrome bug
 * 25503](https://crbug.com/25503) for further details.
 *
 * Windows virtual key code: `VK_MENU` (0x12) `VK_LMENU` (0xA4) `VK_RMENU`
 * (0xA5)
 *
 * Mac virtual key code: `kVK_Option` (0x3A) `kVK_RightOption` (0x3D)
 *
 * Linux virtual key code: `GDK_KEY_Alt_L` (0xFFE9) `GDK_KEY_Alt_R` (0xFFEA)
 * `Qt::Key_Alt` (0x01000023)
 *
 * Android virtual key code: `KEYCODE_ALT_LEFT` (57) `KEYCODE_ALT_RIGHT` (58)
 *
 * @generated
 */
export type Alt = 'Alt'

/**
 * The `Alt` (Alternative) key.
 *
 * Chrome 67 and Firefox 63 now correctly interpret the right `Alt` key for
 * keyboard layouts which map that key to `AltGr`. See Firefox bug [Firefox bug
 * 900750](https://bugzil.la/900750) and [Chrome bug
 * 25503](https://crbug.com/25503) for further details.
 *
 * Windows virtual key code: `VK_MENU` (0x12) `VK_LMENU` (0xA4) `VK_RMENU`
 * (0xA5)
 *
 * Mac virtual key code: `kVK_Option` (0x3A) `kVK_RightOption` (0x3D)
 *
 * Linux virtual key code: `GDK_KEY_Alt_L` (0xFFE9) `GDK_KEY_Alt_R` (0xFFEA)
 * `Qt::Key_Alt` (0x01000023)
 *
 * Android virtual key code: `KEYCODE_ALT_LEFT` (57) `KEYCODE_ALT_RIGHT` (58)
 *
 * @generated
 */
export const Alt: Alt = 'Alt'

/**
 * The `AltGr` or `AltGraph` (Alternate Graphics) key. Enables the ISO Level 3
 * shift modifier (where `Shift` is the level 2 modifier).
 *
 * Chrome 67 and Firefox 63 now correctly interpret the right `Alt` key for
 * keyboard layouts which map that key to `AltGr`. See Firefox bug [Firefox bug
 * 900750](https://bugzil.la/900750) and [Chrome bug
 * 25503](https://crbug.com/25503) for further details.
 *
 * Linux virtual key code: `GDK_KEY_Mode_switch` (0xFF7E)
 * `GDK_KEY_ISO_Level3_Shift` (0xFE03) `GDK_KEY_ISO_Level3_Latch` (0xFE04)
 * `GDK_KEY_ISO_Level3_Lock` (0xFE05) `GDK_KEY_ISO_Level5_Shift` (0xFE11)
 * `GDK_KEY_ISO_Level5_Latch` (0xFE12) `GDK_KEY_ISO_Level5_Lock` (0xFE13)
 * `Qt::Key_AltGr` (0x01001103 `Qt::Key_Mode_switch` (0x0100117E)
 *
 * @generated
 */
export type AltGraph = 'AltGraph'

/**
 * The `AltGr` or `AltGraph` (Alternate Graphics) key. Enables the ISO Level 3
 * shift modifier (where `Shift` is the level 2 modifier).
 *
 * Chrome 67 and Firefox 63 now correctly interpret the right `Alt` key for
 * keyboard layouts which map that key to `AltGr`. See Firefox bug [Firefox bug
 * 900750](https://bugzil.la/900750) and [Chrome bug
 * 25503](https://crbug.com/25503) for further details.
 *
 * Linux virtual key code: `GDK_KEY_Mode_switch` (0xFF7E)
 * `GDK_KEY_ISO_Level3_Shift` (0xFE03) `GDK_KEY_ISO_Level3_Latch` (0xFE04)
 * `GDK_KEY_ISO_Level3_Lock` (0xFE05) `GDK_KEY_ISO_Level5_Shift` (0xFE11)
 * `GDK_KEY_ISO_Level5_Latch` (0xFE12) `GDK_KEY_ISO_Level5_Lock` (0xFE13)
 * `Qt::Key_AltGr` (0x01001103 `Qt::Key_Mode_switch` (0x0100117E)
 *
 * @generated
 */
export const AltGraph: AltGraph = 'AltGraph'

/**
 * The `Caps Lock` key. Toggles the capital character lock on and off for
 * subsequent input.
 *
 * Windows virtual key code: `VK_CAPITAL` (0x14)
 *
 * Mac virtual key code: `kVK_CapsLock` (0x39)
 *
 * Linux virtual key code: `GDK_KEY_Caps_Lock` (0xFFE5) `Qt::Key_CapsLock`
 * (0x01000024)
 *
 * Android virtual key code: `KEYCODE_CAPS_LOCK` (115)
 *
 * @generated
 */
export type CapsLock = 'CapsLock'

/**
 * The `Caps Lock` key. Toggles the capital character lock on and off for
 * subsequent input.
 *
 * Windows virtual key code: `VK_CAPITAL` (0x14)
 *
 * Mac virtual key code: `kVK_CapsLock` (0x39)
 *
 * Linux virtual key code: `GDK_KEY_Caps_Lock` (0xFFE5) `Qt::Key_CapsLock`
 * (0x01000024)
 *
 * Android virtual key code: `KEYCODE_CAPS_LOCK` (115)
 *
 * @generated
 */
export const CapsLock: CapsLock = 'CapsLock'

/**
 * The `Control`, `Ctrl`, or `Ctl` key. Allows typing control characters.
 *
 * Windows virtual key code: `VK_CONTROL` (0x11) `VK_LCONTROL` (0xA2)
 * `VK_RCONTROL` (0xA3)
 *
 * Mac virtual key code: `kVK_Control` (0x3B) `kVK_RightControl` (0x3E)
 *
 * Linux virtual key code: `GDK_KEY_Control_L` (0xFFE3) `GDK_KEY_Control_R`
 * (0xFFE4) `Qt::Key_Control` (0x01000021)
 *
 * Android virtual key code: `KEYCODE_CTRL_LEFT` (113) `KEYCODE_CTRL_RIGHT`
 * (114)
 *
 * @generated
 */
export type Control = 'Control'

/**
 * The `Control`, `Ctrl`, or `Ctl` key. Allows typing control characters.
 *
 * Windows virtual key code: `VK_CONTROL` (0x11) `VK_LCONTROL` (0xA2)
 * `VK_RCONTROL` (0xA3)
 *
 * Mac virtual key code: `kVK_Control` (0x3B) `kVK_RightControl` (0x3E)
 *
 * Linux virtual key code: `GDK_KEY_Control_L` (0xFFE3) `GDK_KEY_Control_R`
 * (0xFFE4) `Qt::Key_Control` (0x01000021)
 *
 * Android virtual key code: `KEYCODE_CTRL_LEFT` (113) `KEYCODE_CTRL_RIGHT`
 * (114)
 *
 * @generated
 */
export const Control: Control = 'Control'

/**
 * The `Fn` (Function modifier) key. Used to allow generating function key (
 * `F1` – `F15`, for instance) characters on keyboards without a dedicated
 * function key area. Often handled in hardware so that events aren't generated
 * for this key.
 *
 * Mac virtual key code: `kVK_Function` (0x3F)
 *
 * Android virtual key code: `KEYCODE_FUNCTION` (119)
 *
 * @generated
 */
export type Fn = 'Fn'

/**
 * The `Fn` (Function modifier) key. Used to allow generating function key (
 * `F1` – `F15`, for instance) characters on keyboards without a dedicated
 * function key area. Often handled in hardware so that events aren't generated
 * for this key.
 *
 * Mac virtual key code: `kVK_Function` (0x3F)
 *
 * Android virtual key code: `KEYCODE_FUNCTION` (119)
 *
 * @generated
 */
export const Fn: Fn = 'Fn'

/**
 * The `FnLock` or `F-Lock` (Function Lock) key.Toggles the function key mode
 * described by `"Fn"` on and off. Often handled in hardware so that events
 * aren't generated for this key.
 *
 * @generated
 */
export type FnLock = 'FnLock'

/**
 * The `FnLock` or `F-Lock` (Function Lock) key.Toggles the function key mode
 * described by `"Fn"` on and off. Often handled in hardware so that events
 * aren't generated for this key.
 *
 * @generated
 */
export const FnLock: FnLock = 'FnLock'

/**
 * The `Hyper` key.
 *
 * Firefox generates the key value `"OS"` for the `Super` and `Hyper` keys,
 * instead of `"Super"` and `"Hyper"`.
 *
 * Linux virtual key code: `GDK_KEY_Hyper_L` (0xFFED) `GDK_KEY_Hyper_R` (0xFFEE)
 * `Qt::Key_Hyper_L` (0x01000056) `Qt::Key_Hyper_R` (0x01000057)
 *
 * @generated
 */
export type Hyper = 'Hyper'

/**
 * The `Hyper` key.
 *
 * Firefox generates the key value `"OS"` for the `Super` and `Hyper` keys,
 * instead of `"Super"` and `"Hyper"`.
 *
 * Linux virtual key code: `GDK_KEY_Hyper_L` (0xFFED) `GDK_KEY_Hyper_R` (0xFFEE)
 * `Qt::Key_Hyper_L` (0x01000056) `Qt::Key_Hyper_R` (0x01000057)
 *
 * @generated
 */
export const Hyper: Hyper = 'Hyper'

/**
 * The `Meta` key. Allows issuing special command inputs. This is the `Windows`
 * logo key, or the `Command` or `⌘` key on Mac keyboards.
 *
 * In Firefox, the `Windows` key is reported as `"OS"` instead of as `"Meta"`.
 * This will be changed in Firefox per [Firefox bug
 * 1232918](https://bugzil.la/1232918). Until that's fixed, these keys are
 * returned as `"OS"` by Firefox: `VK_LWIN` (0x5B) and `VK_RWIN` (0x5C) on
 * Windows, and `GDK_KEY_Super_L` (0xFFEB), `GDK_KEY_Super_R` (0xFFEC),
 * `GDK_KEY_Hyper_L` (0xFFED), and `GDK_KEY_Hyper_R` (0xFFEE) on Linux.
 *
 * Windows virtual key code: `VK_LWIN` (0x5B) `VK_RWIN` (0x5C)
 *
 * Mac virtual key code: `kVK_Command` (0x37) `kVK_RightCommand` (0x36)
 *
 * Linux virtual key code: `GDK_KEY_Meta_L` (0xFFE7) `GDK_KEY_Meta_R` (0xFFE8)
 * `Qt::Key_Meta` (0x01000022)
 *
 * Android virtual key code: `KEYCODE_META_LEFT` (117) `KEYCODE_META_RIGHT`
 * (118)
 *
 * @generated
 */
export type Meta = 'Meta'

/**
 * The `Meta` key. Allows issuing special command inputs. This is the `Windows`
 * logo key, or the `Command` or `⌘` key on Mac keyboards.
 *
 * In Firefox, the `Windows` key is reported as `"OS"` instead of as `"Meta"`.
 * This will be changed in Firefox per [Firefox bug
 * 1232918](https://bugzil.la/1232918). Until that's fixed, these keys are
 * returned as `"OS"` by Firefox: `VK_LWIN` (0x5B) and `VK_RWIN` (0x5C) on
 * Windows, and `GDK_KEY_Super_L` (0xFFEB), `GDK_KEY_Super_R` (0xFFEC),
 * `GDK_KEY_Hyper_L` (0xFFED), and `GDK_KEY_Hyper_R` (0xFFEE) on Linux.
 *
 * Windows virtual key code: `VK_LWIN` (0x5B) `VK_RWIN` (0x5C)
 *
 * Mac virtual key code: `kVK_Command` (0x37) `kVK_RightCommand` (0x36)
 *
 * Linux virtual key code: `GDK_KEY_Meta_L` (0xFFE7) `GDK_KEY_Meta_R` (0xFFE8)
 * `Qt::Key_Meta` (0x01000022)
 *
 * Android virtual key code: `KEYCODE_META_LEFT` (117) `KEYCODE_META_RIGHT`
 * (118)
 *
 * @generated
 */
export const Meta: Meta = 'Meta'

/**
 * The `NumLock` (Number Lock) key. Toggles the numeric keypad between number
 * entry some other mode (often directional arrows).
 *
 * Windows virtual key code: `VK_NUMLOCK` (0x90)
 *
 * Linux virtual key code: `GDK_KEY_Num_Lock` (0xFF7F) `Qt::Key_NumLock`
 * (0x01000025)
 *
 * Android virtual key code: `KEYCODE_NUM_LOCK` (143)
 *
 * @generated
 */
export type NumLock = 'NumLock'

/**
 * The `NumLock` (Number Lock) key. Toggles the numeric keypad between number
 * entry some other mode (often directional arrows).
 *
 * Windows virtual key code: `VK_NUMLOCK` (0x90)
 *
 * Linux virtual key code: `GDK_KEY_Num_Lock` (0xFF7F) `Qt::Key_NumLock`
 * (0x01000025)
 *
 * Android virtual key code: `KEYCODE_NUM_LOCK` (143)
 *
 * @generated
 */
export const NumLock: NumLock = 'NumLock'

/**
 * The `Scroll Lock` key. Toggles between scrolling and cursor movement modes.
 *
 * Firefox did not add support for the `Symbol` key until Firefox 37.
 *
 * Windows virtual key code: `VK_SCROLL` (0x91)
 *
 * Linux virtual key code: `GDK_KEY_Scroll_Lock` (0xFF14) `Qt::Key_ScrollLock`
 * (0x01000026)
 *
 * Android virtual key code: `KEYCODE_SCROLL_LOCK` (116)
 *
 * @generated
 */
export type ScrollLock = 'ScrollLock'

/**
 * The `Scroll Lock` key. Toggles between scrolling and cursor movement modes.
 *
 * Firefox did not add support for the `Symbol` key until Firefox 37.
 *
 * Windows virtual key code: `VK_SCROLL` (0x91)
 *
 * Linux virtual key code: `GDK_KEY_Scroll_Lock` (0xFF14) `Qt::Key_ScrollLock`
 * (0x01000026)
 *
 * Android virtual key code: `KEYCODE_SCROLL_LOCK` (116)
 *
 * @generated
 */
export const ScrollLock: ScrollLock = 'ScrollLock'

/**
 * The `Shift` key. Modifies keystrokes to allow typing upper (or other) case
 * letters, and to support typing punctuation and other special characters.
 *
 * Windows virtual key code: `VK_SHIFT` (0x10) `VK_LSHIFT` (0xA0) `VK_RSHIFT`
 * (0xA1)
 *
 * Mac virtual key code: `kVK_Shift` (0x38) `kVK_RightShift` (0x3C)
 *
 * Linux virtual key code: `GDK_KEY_Shift_L` (0xFFE1) `GDK_KEY_Shift_R` (0xFFE2)
 * `Qt::Key_Shift` (0x01000020)
 *
 * Android virtual key code: `KEYCODE_SHIFT_LEFT` (59) `KEYCODE_SHIFT_RIGHT`
 * (60)
 *
 * @generated
 */
export type Shift = 'Shift'

/**
 * The `Shift` key. Modifies keystrokes to allow typing upper (or other) case
 * letters, and to support typing punctuation and other special characters.
 *
 * Windows virtual key code: `VK_SHIFT` (0x10) `VK_LSHIFT` (0xA0) `VK_RSHIFT`
 * (0xA1)
 *
 * Mac virtual key code: `kVK_Shift` (0x38) `kVK_RightShift` (0x3C)
 *
 * Linux virtual key code: `GDK_KEY_Shift_L` (0xFFE1) `GDK_KEY_Shift_R` (0xFFE2)
 * `Qt::Key_Shift` (0x01000020)
 *
 * Android virtual key code: `KEYCODE_SHIFT_LEFT` (59) `KEYCODE_SHIFT_RIGHT`
 * (60)
 *
 * @generated
 */
export const Shift: Shift = 'Shift'

/**
 * The `Super` key.
 *
 * Firefox generates the key value `"OS"` for the `Super` and `Hyper` keys,
 * instead of `"Super"` and `"Hyper"`.
 *
 * Linux virtual key code: `GDK_KEY_Super_L` (0xFFEB) `GDK_KEY_Super_R` (0xFFEC)
 * `Qt::Key_Super_L` (0x01000053) `Qt::Key_Super_R` (0x01000054)
 *
 * @generated
 */
export type Super = 'Super'

/**
 * The `Super` key.
 *
 * Firefox generates the key value `"OS"` for the `Super` and `Hyper` keys,
 * instead of `"Super"` and `"Hyper"`.
 *
 * Linux virtual key code: `GDK_KEY_Super_L` (0xFFEB) `GDK_KEY_Super_R` (0xFFEC)
 * `Qt::Key_Super_L` (0x01000053) `Qt::Key_Super_R` (0x01000054)
 *
 * @generated
 */
export const Super: Super = 'Super'

/**
 * The `Symbol` modifier key (found on certain virtual keyboards).
 *
 * Firefox did not add support for the `Symbol` key until Firefox 37.
 *
 * Android virtual key code: `KEYCODE_SYM` (63)
 *
 * @generated
 */
export type SymbolKey = 'SymbolKey'

/**
 * The `Symbol` modifier key (found on certain virtual keyboards).
 *
 * Firefox did not add support for the `Symbol` key until Firefox 37.
 *
 * Android virtual key code: `KEYCODE_SYM` (63)
 *
 * @generated
 */
export const SymbolKey: SymbolKey = 'SymbolKey'

/**
 * The `Symbol Lock` key.
 *
 * @generated
 */
export type SymbolLock = 'SymbolLock'

/**
 * The `Symbol Lock` key.
 *
 * @generated
 */
export const SymbolLock: SymbolLock = 'SymbolLock'
