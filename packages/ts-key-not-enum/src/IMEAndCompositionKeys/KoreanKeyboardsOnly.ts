/**
 * @module KoreanKeyboardsOnly
 *
 * @file
 *
 *   These keys are only available on Korean keyboards. There are other keys
 *   defined by various platforms for Korean keyboards, but these are the most
 *   common and are the ones identified by the UI Events specification.
 * @generated
 */

/**
 * The `Hangul` (Korean character set) mode key, which toggles between Hangul
 * and English entry modes.
 *
 * `VK_HANGUL` and `VK_KANA` share the same numeric key value on Windows, as do
 * `VK_HANJA` and `VK_KANJI`.
 *
 * Windows virtual key code: `VK_HANGUL` (0x15)
 *
 * Linux virtual key code: `GDK_KEY_Hangul` (0xFF31) `Qt::Key_Hangul`
 * (0x01001131)
 *
 * @generated
 */
export type HangulMode = 'HangulMode'

/**
 * The `Hangul` (Korean character set) mode key, which toggles between Hangul
 * and English entry modes.
 *
 * `VK_HANGUL` and `VK_KANA` share the same numeric key value on Windows, as do
 * `VK_HANJA` and `VK_KANJI`.
 *
 * Windows virtual key code: `VK_HANGUL` (0x15)
 *
 * Linux virtual key code: `GDK_KEY_Hangul` (0xFF31) `Qt::Key_Hangul`
 * (0x01001131)
 *
 * @generated
 */
export const HangulMode: HangulMode = 'HangulMode'

/**
 * Selects the Hanja mode, for converting Hangul characters to the more specific
 * Hanja characters.
 *
 * `VK_HANGUL` and `VK_KANA` share the same numeric key value on Windows, as do
 * `VK_HANJA` and `VK_KANJI`.
 *
 * Windows virtual key code: `VK_HANJA` (0x19)
 *
 * Linux virtual key code: `GDK_KEY_Hangul_Hanja` (0xFF34)
 * `Qt::Key_Hangul_Hanja` (0x01001134)
 *
 * @generated
 */
export type HanjaMode = 'HanjaMode'

/**
 * Selects the Hanja mode, for converting Hangul characters to the more specific
 * Hanja characters.
 *
 * `VK_HANGUL` and `VK_KANA` share the same numeric key value on Windows, as do
 * `VK_HANJA` and `VK_KANJI`.
 *
 * Windows virtual key code: `VK_HANJA` (0x19)
 *
 * Linux virtual key code: `GDK_KEY_Hangul_Hanja` (0xFF34)
 * `Qt::Key_Hangul_Hanja` (0x01001134)
 *
 * @generated
 */
export const HanjaMode: HanjaMode = 'HanjaMode'

/**
 * Selects the Junja mode, in which Korean is represented using single-byte
 * Latin characters.
 *
 * Windows virtual key code: `VK_JUNJA` (0x17)
 *
 * Linux virtual key code: `GDK_KEY_Hangul_Jeonja` (0xFF38)
 * `Qt::Key_Hangul_Jeonja` (0x01001138)
 *
 * @generated
 */
export type JunjaMode = 'JunjaMode'

/**
 * Selects the Junja mode, in which Korean is represented using single-byte
 * Latin characters.
 *
 * Windows virtual key code: `VK_JUNJA` (0x17)
 *
 * Linux virtual key code: `GDK_KEY_Hangul_Jeonja` (0xFF38)
 * `Qt::Key_Hangul_Jeonja` (0x01001138)
 *
 * @generated
 */
export const JunjaMode: JunjaMode = 'JunjaMode'
