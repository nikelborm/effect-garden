/**
 * @module CommonIMEKeys
 *
 * @file
 * @generated
 */

/**
 * The `All Candidates` key, which starts multi-candidate mode, in which
 * multiple candidates are displayed for the ongoing input.
 *
 * Linux virtual key code: `GDK_KEY_MultipleCandidate` (0xFF3D
 * `Qt::Key_MultipleCandidate` (0x0100113D)
 *
 * @generated
 */
export type AllCandidates = 'AllCandidates'

/**
 * The `All Candidates` key, which starts multi-candidate mode, in which
 * multiple candidates are displayed for the ongoing input.
 *
 * Linux virtual key code: `GDK_KEY_MultipleCandidate` (0xFF3D
 * `Qt::Key_MultipleCandidate` (0x0100113D)
 *
 * @generated
 */
export const AllCandidates: AllCandidates = 'AllCandidates'

/**
 * The `Alphanumeric` key.
 *
 * Windows virtual key code: `VK_OEM_ATTN` (0xF0)
 *
 * Linux virtual key code: `GDK_KEY_Eisu_Shift` (0xFF2F) `GDK_KEY_Eisu_toggle`
 * (0xFF30) `Qt::Key_Eisu_Shift` (0x0100112f) `Qt::Key_Eisu_toggle`
 * (0x01001130)
 *
 * @generated
 */
export type Alphanumeric = 'Alphanumeric'

/**
 * The `Alphanumeric` key.
 *
 * Windows virtual key code: `VK_OEM_ATTN` (0xF0)
 *
 * Linux virtual key code: `GDK_KEY_Eisu_Shift` (0xFF2F) `GDK_KEY_Eisu_toggle`
 * (0xFF30) `Qt::Key_Eisu_Shift` (0x0100112f) `Qt::Key_Eisu_toggle`
 * (0x01001130)
 *
 * @generated
 */
export const Alphanumeric: Alphanumeric = 'Alphanumeric'

/**
 * The `Code Input` key, which enables code input mode, which lets the user
 * enter characters by typing their code points (their Unicode character
 * numbers, typically).
 *
 * Linux virtual key code: `GDK_KEY_Codeinput` (0xFF37) `Qt::Key_Codeinput`
 * (0x01001137)
 *
 * @generated
 */
export type CodeInput = 'CodeInput'

/**
 * The `Code Input` key, which enables code input mode, which lets the user
 * enter characters by typing their code points (their Unicode character
 * numbers, typically).
 *
 * Linux virtual key code: `GDK_KEY_Codeinput` (0xFF37) `Qt::Key_Codeinput`
 * (0x01001137)
 *
 * @generated
 */
export const CodeInput: CodeInput = 'CodeInput'

/**
 * The `Compose` key.
 *
 * On the _X Window System_, the `Compose` key is called the `Multi` key.
 *
 * Linux virtual key code: `GDK_KEY_Multi_key` (0xFF20) `Qt::Key_Multi_key`
 * (0x01001120)
 *
 * @generated
 */
export type Compose = 'Compose'

/**
 * The `Compose` key.
 *
 * On the _X Window System_, the `Compose` key is called the `Multi` key.
 *
 * Linux virtual key code: `GDK_KEY_Multi_key` (0xFF20) `Qt::Key_Multi_key`
 * (0x01001120)
 *
 * @generated
 */
export const Compose: Compose = 'Compose'

/**
 * The `Convert` key, which instructs the IME to convert the current input
 * method sequence into the resulting character.
 *
 * Prior to Firefox 37, these keys were `"Unidentified"`.
 *
 * Windows virtual key code: `VK_CONVERT` (0x1C)
 *
 * Linux virtual key code: `GDK_KEY_Henkan` (0xFF23) `Qt::Key_Henkan`
 * (0x01001123)
 *
 * Android virtual key code: `KEYCODE_HENKAN` (214)
 *
 * @generated
 */
export type Convert = 'Convert'

/**
 * The `Convert` key, which instructs the IME to convert the current input
 * method sequence into the resulting character.
 *
 * Prior to Firefox 37, these keys were `"Unidentified"`.
 *
 * Windows virtual key code: `VK_CONVERT` (0x1C)
 *
 * Linux virtual key code: `GDK_KEY_Henkan` (0xFF23) `Qt::Key_Henkan`
 * (0x01001123)
 *
 * Android virtual key code: `KEYCODE_HENKAN` (214)
 *
 * @generated
 */
export const Convert: Convert = 'Convert'

/**
 * A dead "combining" key; that is, a key which is used in tandem with other
 * keys to generate accented and other modified characters. If pressed by
 * itself, it doesn't generate a character. If you wish to identify which
 * specific dead key was pressed (in cases where more than one exists), you can
 * do so by examining the KeyboardEvent 's associated compositionupdate event's
 * data property.
 *
 * Linux virtual key code: See [Dead keycodes for
 * Linux](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values#dead_keycodes_for_linux)
 * below.
 *
 * @generated
 */
export type Dead = 'Dead'

/**
 * A dead "combining" key; that is, a key which is used in tandem with other
 * keys to generate accented and other modified characters. If pressed by
 * itself, it doesn't generate a character. If you wish to identify which
 * specific dead key was pressed (in cases where more than one exists), you can
 * do so by examining the KeyboardEvent 's associated compositionupdate event's
 * data property.
 *
 * Linux virtual key code: See [Dead keycodes for
 * Linux](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values#dead_keycodes_for_linux)
 * below.
 *
 * @generated
 */
export const Dead: Dead = 'Dead'

/**
 * The `Final` (Final Mode) key is used on some Asian keyboards to enter final
 * mode when using IMEs.
 *
 * Windows virtual key code: `VK_FINAL` (0x18)
 *
 * @generated
 */
export type FinalMode = 'FinalMode'

/**
 * The `Final` (Final Mode) key is used on some Asian keyboards to enter final
 * mode when using IMEs.
 *
 * Windows virtual key code: `VK_FINAL` (0x18)
 *
 * @generated
 */
export const FinalMode: FinalMode = 'FinalMode'

/**
 * Switches to the first character group on an [ISO/IEC 9995
 * keyboard](https://en.wikipedia.org/wiki/ISO/IEC_9995). Each key may have
 * multiple groups of characters, each in its own column. Pressing this key
 * instructs the device to interpret key presses as coming from the first column
 * on subsequent keystrokes.
 *
 * Linux virtual key code: `GDK_KEY_ISO_First_Group` (0xFE0C)
 *
 * @generated
 */
export type GroupFirst = 'GroupFirst'

/**
 * Switches to the first character group on an [ISO/IEC 9995
 * keyboard](https://en.wikipedia.org/wiki/ISO/IEC_9995). Each key may have
 * multiple groups of characters, each in its own column. Pressing this key
 * instructs the device to interpret key presses as coming from the first column
 * on subsequent keystrokes.
 *
 * Linux virtual key code: `GDK_KEY_ISO_First_Group` (0xFE0C)
 *
 * @generated
 */
export const GroupFirst: GroupFirst = 'GroupFirst'

/**
 * Switches to the last character group on an [ISO/IEC 9995
 * keyboard](https://en.wikipedia.org/wiki/ISO/IEC_9995).
 *
 * Linux virtual key code: `GDK_KEY_ISO_Last_Group` (0xFE0E)
 *
 * @generated
 */
export type GroupLast = 'GroupLast'

/**
 * Switches to the last character group on an [ISO/IEC 9995
 * keyboard](https://en.wikipedia.org/wiki/ISO/IEC_9995).
 *
 * Linux virtual key code: `GDK_KEY_ISO_Last_Group` (0xFE0E)
 *
 * @generated
 */
export const GroupLast: GroupLast = 'GroupLast'

/**
 * Switches to the next character group on an [ISO/IEC 9995
 * keyboard](https://en.wikipedia.org/wiki/ISO/IEC_9995).
 *
 * Prior to Firefox 37, these keys were `"Unidentified"`.
 *
 * Linux virtual key code: `GDK_KEY_ISO_Next_Group` (0xFE08)
 *
 * Android virtual key code: `KEYCODE_LANGUAGE_SWITCH` (204)
 *
 * @generated
 */
export type GroupNext = 'GroupNext'

/**
 * Switches to the next character group on an [ISO/IEC 9995
 * keyboard](https://en.wikipedia.org/wiki/ISO/IEC_9995).
 *
 * Prior to Firefox 37, these keys were `"Unidentified"`.
 *
 * Linux virtual key code: `GDK_KEY_ISO_Next_Group` (0xFE08)
 *
 * Android virtual key code: `KEYCODE_LANGUAGE_SWITCH` (204)
 *
 * @generated
 */
export const GroupNext: GroupNext = 'GroupNext'

/**
 * Switches to the previous character group on an [ISO/IEC 9995
 * keyboard](https://en.wikipedia.org/wiki/ISO/IEC_9995).
 *
 * Linux virtual key code: `GDK_KEY_ISO_Prev_Group` (0xFE0A)
 *
 * @generated
 */
export type GroupPrevious = 'GroupPrevious'

/**
 * Switches to the previous character group on an [ISO/IEC 9995
 * keyboard](https://en.wikipedia.org/wiki/ISO/IEC_9995).
 *
 * Linux virtual key code: `GDK_KEY_ISO_Prev_Group` (0xFE0A)
 *
 * @generated
 */
export const GroupPrevious: GroupPrevious = 'GroupPrevious'

/**
 * The Mode Change key. Toggles or cycles among input modes of IMEs.
 *
 * Firefox generates the key value `"AltGraph"` instead of `"ModeChange"`.
 *
 * Windows virtual key code: `VK_MODECHANGE` (0x1F)
 *
 * Linux virtual key code: `GDK_KEY_Mode_switch` (0xFF7E)
 * `GDK_KEY_script_switch` (0xFF7E) `Qt::Key_Mode_switch` (0x0100117E)
 *
 * Android virtual key code: `KEYCODE_SWITCH_CHARSET` (95)
 *
 * @generated
 */
export type ModeChange = 'ModeChange'

/**
 * The Mode Change key. Toggles or cycles among input modes of IMEs.
 *
 * Firefox generates the key value `"AltGraph"` instead of `"ModeChange"`.
 *
 * Windows virtual key code: `VK_MODECHANGE` (0x1F)
 *
 * Linux virtual key code: `GDK_KEY_Mode_switch` (0xFF7E)
 * `GDK_KEY_script_switch` (0xFF7E) `Qt::Key_Mode_switch` (0x0100117E)
 *
 * Android virtual key code: `KEYCODE_SWITCH_CHARSET` (95)
 *
 * @generated
 */
export const ModeChange: ModeChange = 'ModeChange'

/**
 * The Next Candidate function key. Selects the next possible match for the
 * ongoing input.
 *
 * @generated
 */
export type NextCandidate = 'NextCandidate'

/**
 * The Next Candidate function key. Selects the next possible match for the
 * ongoing input.
 *
 * @generated
 */
export const NextCandidate: NextCandidate = 'NextCandidate'

/**
 * The `NonConvert` ("Don't convert") key. This accepts the current input method
 * sequence without running conversion when using an IME.
 *
 * The `NonConvert` key is reported as `"Nonconvert"` instead of the correct
 * `"NonConvert"` by Firefox versions 36 and earlier.
 *
 * Windows virtual key code: `VK_NONCONVERT` (0x1D)
 *
 * Linux virtual key code: `GDK_KEY_Muhenkan` (0xFF22) `Qt::Key_Muhenkan`
 * (0x01001122)
 *
 * Android virtual key code: `KEYCODE_MUHENKAN` (213)
 *
 * @generated
 */
export type NonConvert = 'NonConvert'

/**
 * The `NonConvert` ("Don't convert") key. This accepts the current input method
 * sequence without running conversion when using an IME.
 *
 * The `NonConvert` key is reported as `"Nonconvert"` instead of the correct
 * `"NonConvert"` by Firefox versions 36 and earlier.
 *
 * Windows virtual key code: `VK_NONCONVERT` (0x1D)
 *
 * Linux virtual key code: `GDK_KEY_Muhenkan` (0xFF22) `Qt::Key_Muhenkan`
 * (0x01001122)
 *
 * Android virtual key code: `KEYCODE_MUHENKAN` (213)
 *
 * @generated
 */
export const NonConvert: NonConvert = 'NonConvert'

/**
 * The Previous Candidate key. Selects the previous possible match for the
 * ongoing input.
 *
 * Linux virtual key code: `GDK_KEY_PreviousCandidate` (0xFF3E)
 * `Qt::Key_PreviousCandidate` (0x0100113E)
 *
 * @generated
 */
export type PreviousCandidate = 'PreviousCandidate'

/**
 * The Previous Candidate key. Selects the previous possible match for the
 * ongoing input.
 *
 * Linux virtual key code: `GDK_KEY_PreviousCandidate` (0xFF3E)
 * `Qt::Key_PreviousCandidate` (0x0100113E)
 *
 * @generated
 */
export const PreviousCandidate: PreviousCandidate = 'PreviousCandidate'

/**
 * The `Process` key. Instructs the IME to process the conversion.
 *
 * The `Process` key currently returns `"Unidentified"` in Firefox. Google
 * Chrome returns the value of the key as if IME were not in use.
 *
 * Windows virtual key code: `VK_PROCESSKEY` (0xE5)
 *
 * @generated
 */
export type Process = 'Process'

/**
 * The `Process` key. Instructs the IME to process the conversion.
 *
 * The `Process` key currently returns `"Unidentified"` in Firefox. Google
 * Chrome returns the value of the key as if IME were not in use.
 *
 * Windows virtual key code: `VK_PROCESSKEY` (0xE5)
 *
 * @generated
 */
export const Process: Process = 'Process'

/**
 * The Single Candidate key. Enables single candidate mode (as opposed to
 * multi-candidate mode); in this mode, only one candidate is displayed at a
 * time.
 *
 * Prior to Firefox 37, these keys were `"Unidentified"`.
 *
 * Linux virtual key code: `GDK_KEY_SingleCandidate` (0xFF3C)
 * `Qt::Key_SingleCandidate` (0x0100113C)
 *
 * @generated
 */
export type SingleCandidate = 'SingleCandidate'

/**
 * The Single Candidate key. Enables single candidate mode (as opposed to
 * multi-candidate mode); in this mode, only one candidate is displayed at a
 * time.
 *
 * Prior to Firefox 37, these keys were `"Unidentified"`.
 *
 * Linux virtual key code: `GDK_KEY_SingleCandidate` (0xFF3C)
 * `Qt::Key_SingleCandidate` (0x0100113C)
 *
 * @generated
 */
export const SingleCandidate: SingleCandidate = 'SingleCandidate'
