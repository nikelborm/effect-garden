/**
 * @module IMEAndCompositionKeys
 *
 * @file
 *
 *   Keys used when using an Input Method Editor (IME) to input text which can't
 *   readily be entered by simple key presses, such as text in languages such as
 *   those which have more graphemes than there are character entry keys on the
 *   keyboard. Common examples include Chinese, Japanese, Korean, and Hindi.
 *
 *   Some keys are common across multiple languages, while others exist only on
 *   keyboards targeting specific languages. In addition, not all keyboards have
 *   all of these keys.
 * @generated
 */

/** @generated */
export * as CommonIMEKeys from './CommonIMEKeys.ts'
/**
 * Linux generates accented characters using special **dead keys**. _Dead keys_
 * are keys which are pressed in combination with character keys to generate
 * accented forms of those characters. You can identify which specific dead key
 * was used (if more than one exists) by examining the KeyboardEvent 's
 * associated compositionupdate event's data property.
 *
 * You can find a table of the dead keys and the characters they can be used
 * with to generate accented or otherwise special characters on Linux using
 * GTK.
 *
 * The value of data will be one of the following:
 *
 * @generated
 */
export * as DeadKeycodesForLinux from './DeadKeycodesForLinux.ts'
/**
 * These keys are only available on Japanese keyboards.
 *
 * @generated
 */
export * as JapaneseKeyboardsOnly from './JapaneseKeyboardsOnly.ts'
/**
 * These keys are only available on Korean keyboards. There are other keys
 * defined by various platforms for Korean keyboards, but these are the most
 * common and are the ones identified by the UI Events specification.
 *
 * @generated
 */
export * as KoreanKeyboardsOnly from './KoreanKeyboardsOnly.ts'
