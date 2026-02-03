/**
 * The tables below list the standard values for the
 * [`KeyboardEvent.key`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key)
 * property, with an explanation of what the key is typically used for.
 * Corresponding virtual keycodes for common platforms are included where
 * available.
 *
 * @module EventDotKey
 *
 * @file
 * @generated
 */

/**
 * Some keyboards offer special keys for launching or switching to certain
 * common applications. Key values for those are listed here.
 *
 * @module ApplicationSelectorKeys
 * @generated
 */
export * as ApplicationSelectorKeys from './ApplicationSelectorKeys.ts'
/**
 * These media keys are used specifically for controlling audio.
 *
 * @module AudioControlKeys
 * @generated
 */
export * as AudioControlKeys from './AudioControlKeys.ts'
/**
 * Some keyboards include special keys for controlling Web browsers. Those keys
 * follow.
 *
 * @module BrowserControlKeys
 * @generated
 */
export * as BrowserControlKeys from './BrowserControlKeys.ts'
/**
 * @module DeviceKeys
 * @generated
 */
export * as DeviceKeys from './DeviceKeys.ts'
/**
 * These keys control documents. In the specification, they're included in other
 * sets of keys (such as the media keys), but they are more sensibly considered
 * to be their own category.
 *
 * @module DocumentKeys
 * @generated
 */
export * as DocumentKeys from './DocumentKeys.ts'
/**
 * @module EditingKeys
 * @generated
 */
export * as EditingKeys from './EditingKeys.ts'
/**
 * While various platforms support different numbers of the general-purpose
 * function keys, such as `F1` – `F12` (or `F1` – `F10`, or `F1` – `F15`, etc.),
 * the first few are specifically defined as follows.
 *
 * If more function keys are available, their names continue the pattern here by
 * continuing to increment the numeric portion of each key's name, so that, for
 * example, `"F24"` is a valid key value.
 *
 * @module FunctionKeys
 * @generated
 */
export * as FunctionKeys from './FunctionKeys.ts'
/**
 * Keys used when using an Input Method Editor (IME) to input text which can't
 * readily be entered by simple key presses, such as text in languages such as
 * those which have more graphemes than there are character entry keys on the
 * keyboard. Common examples include Chinese, Japanese, Korean, and Hindi.
 *
 * Some keys are common across multiple languages, while others exist only on
 * keyboards targeting specific languages. In addition, not all keyboards have
 * all of these keys.
 *
 * @module IMEAndCompositionKeys
 * @generated
 */
export * as IMEAndCompositionKeys from './IMEAndCompositionKeys/index.ts'
/**
 * Because modern remote controls for media devices often include buttons beyond
 * the basic controls covered elsewhere in this document, key values are defined
 * for a broad array of these additional buttons.
 *
 * The values below are derived in part from a number of consumer electronics
 * technical specifications:
 *
 * - [DTV Application Software
 *   Environment](https://www.atsc.org/atsc-documents/a100-dtv-application-software-environment-level-1-dase-1/)
 *   (part of the [ATSC](https://en.wikipedia.org/wiki/ATSC) specification)
 * - [Open Cable Application
 *   Platform](https://en.wikipedia.org/wiki/OpenCable_Application_Platform)
 * - [ANSI/CEA-2014-B](https://shop.cta.tech/products/cta-2014): Web-based
 *   Protocol and Framework for Remote User Interface on UPnP™ Networks and the
 *   Internet.
 * - [Android KeyEvent key code
 *   values](https://developer.android.com/reference/android/view/KeyEvent.html)
 *
 * > [!NOTE]
 *
 * > Remote controls typically include keys whose values are already defined
 * > elsewhere, such as under [Multimedia
 * > keys](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values#multimedia_keys)
 * > or [Audio control
 * > keys](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values#audio_control_keys).
 * > Those keys' values will match what's documented in those tables.
 *
 * @module MediaControllerKeys
 * @generated
 */
export * as MediaControllerKeys from './MediaControllerKeys.ts'
/**
 * _Modifiers_ are special keys which are used to generate special characters or
 * cause special actions when used in combination with other keys. Examples
 * include the `Shift` and `Control` keys, and lock keys such as `Caps Lock` and
 * `NumLock`.
 *
 * @module ModifierKeys
 * @generated
 */
export * as ModifierKeys from './ModifierKeys.ts'
/**
 * The multimedia keys are extra buttons or keys for controlling media devices,
 * found on some keyboards.
 *
 * @module MultimediaKeys
 * @generated
 */
export * as MultimediaKeys from './MultimediaKeys.ts'
/**
 * @module NavigationKeys
 * @generated
 */
export * as NavigationKeys from './NavigationKeys.ts'
/**
 * These keys are found on the keyboard's numeric keypad. However, not all are
 * present on every keyboard. Although typical numeric keypads have numeric keys
 * from `0` to `9` (encoded as `"0"` through `"9"`), some multimedia keyboards
 * include additional number keys for higher numbers.
 *
 * > [!NOTE]
 *
 * > The `10` key, if present, generates events with the `key` value of `"0"`.
 *
 * @module NumericKeypadKeys
 * @generated
 */
export * as NumericKeypadKeys from './NumericKeypadKeys.ts'
/**
 * These keys represent buttons which commonly exist on modern smartphones.
 *
 * @module PhoneKeys
 * @generated
 */
export * as PhoneKeys from './PhoneKeys.ts'
/**
 * Values of `key` which have special meanings other than identifying a specific
 * key or character.
 *
 * @module SpecialValues
 * @generated
 */
export * as SpecialValues from './SpecialValues.ts'
/**
 * These special multimedia keys are used to control speech recognition
 * features.
 *
 * @module SpeechRecognitionKeys
 * @generated
 */
export * as SpeechRecognitionKeys from './SpeechRecognitionKeys.ts'
/**
 * These key values represent buttons or keys present on television devices, or
 * computers or phones which have TV support.
 *
 * @module TVControlKeys
 * @generated
 */
export * as TVControlKeys from './TVControlKeys.ts'
/**
 * @module UIKeys
 * @generated
 */
export * as UIKeys from './UIKeys.ts'
/**
 * @module WhitespaceKeys
 * @generated
 */
export * as WhitespaceKeys from './WhitespaceKeys.ts'
