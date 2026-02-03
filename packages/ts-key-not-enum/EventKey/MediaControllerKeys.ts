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
 *
 * @file
 * @generated
 */

/**
 * Changes the input mode on an external audio/video receiver (AVR) unit.
 *
 * These keys were `"Unidentified"` until Firefox 37.
 *
 * Android virtual key code: `KEYCODE_AVR_INPUT` (182)
 *
 * @generated
 */
export type AVRInput = 'AVRInput'

/**
 * Changes the input mode on an external audio/video receiver (AVR) unit.
 *
 * These keys were `"Unidentified"` until Firefox 37.
 *
 * Android virtual key code: `KEYCODE_AVR_INPUT` (182)
 *
 * @generated
 */
export const AVRInput: AVRInput = 'AVRInput'

/**
 * Toggles the power on an external AVR unit.
 *
 * These keys were `"Unidentified"` until Firefox 37.
 *
 * Android virtual key code: `KEYCODE_AVR_POWER` (181)
 *
 * @generated
 */
export type AVRPower = 'AVRPower'

/**
 * Toggles the power on an external AVR unit.
 *
 * These keys were `"Unidentified"` until Firefox 37.
 *
 * Android virtual key code: `KEYCODE_AVR_POWER` (181)
 *
 * @generated
 */
export const AVRPower: AVRPower = 'AVRPower'

/**
 * General-purpose media function key, color-coded red. This has index `0` among
 * the colored keys.
 *
 * These keys were `"Unidentified"` until Firefox 37.
 *
 * Windows virtual key code: `VK_COLORED_KEY_0`
 *
 * Android virtual key code: `KEYCODE_PROG_RED` (183)
 *
 * @generated
 */
export type ColorF0Red = 'ColorF0Red'

/**
 * General-purpose media function key, color-coded red. This has index `0` among
 * the colored keys.
 *
 * These keys were `"Unidentified"` until Firefox 37.
 *
 * Windows virtual key code: `VK_COLORED_KEY_0`
 *
 * Android virtual key code: `KEYCODE_PROG_RED` (183)
 *
 * @generated
 */
export const ColorF0Red: ColorF0Red = 'ColorF0Red'

/**
 * General-purpose media function key, color-coded green. This has index `1`
 * among the colored keys.
 *
 * These keys were `"Unidentified"` until Firefox 37.
 *
 * Windows virtual key code: `VK_COLORED_KEY_1`
 *
 * Android virtual key code: `KEYCODE_PROG_GREEN` (184)
 *
 * @generated
 */
export type ColorF1Green = 'ColorF1Green'

/**
 * General-purpose media function key, color-coded green. This has index `1`
 * among the colored keys.
 *
 * These keys were `"Unidentified"` until Firefox 37.
 *
 * Windows virtual key code: `VK_COLORED_KEY_1`
 *
 * Android virtual key code: `KEYCODE_PROG_GREEN` (184)
 *
 * @generated
 */
export const ColorF1Green: ColorF1Green = 'ColorF1Green'

/**
 * General-purpose media function key, color-coded yellow. This has index `2`
 * among the colored keys.
 *
 * These keys were `"Unidentified"` until Firefox 37.
 *
 * Windows virtual key code: `VK_COLORED_KEY_2`
 *
 * Android virtual key code: `KEYCODE_PROG_YELLOW` (185)
 *
 * @generated
 */
export type ColorF2Yellow = 'ColorF2Yellow'

/**
 * General-purpose media function key, color-coded yellow. This has index `2`
 * among the colored keys.
 *
 * These keys were `"Unidentified"` until Firefox 37.
 *
 * Windows virtual key code: `VK_COLORED_KEY_2`
 *
 * Android virtual key code: `KEYCODE_PROG_YELLOW` (185)
 *
 * @generated
 */
export const ColorF2Yellow: ColorF2Yellow = 'ColorF2Yellow'

/**
 * General-purpose media function key, color-coded blue. This has index `3`
 * among the colored keys.
 *
 * These keys were `"Unidentified"` until Firefox 37.
 *
 * Windows virtual key code: `VK_COLORED_KEY_3`
 *
 * Android virtual key code: `KEYCODE_PROG_BLUE` (186)
 *
 * @generated
 */
export type ColorF3Blue = 'ColorF3Blue'

/**
 * General-purpose media function key, color-coded blue. This has index `3`
 * among the colored keys.
 *
 * These keys were `"Unidentified"` until Firefox 37.
 *
 * Windows virtual key code: `VK_COLORED_KEY_3`
 *
 * Android virtual key code: `KEYCODE_PROG_BLUE` (186)
 *
 * @generated
 */
export const ColorF3Blue: ColorF3Blue = 'ColorF3Blue'

/**
 * General-purpose media function key, color-coded grey. This has index `4`
 * among the colored keys.
 *
 * Windows virtual key code: `VK_COLORED_KEY_4`
 *
 * Android virtual key code: `KEYCODE_PROG_GREY`
 *
 * @generated
 */
export type ColorF4Grey = 'ColorF4Grey'

/**
 * General-purpose media function key, color-coded grey. This has index `4`
 * among the colored keys.
 *
 * Windows virtual key code: `VK_COLORED_KEY_4`
 *
 * Android virtual key code: `KEYCODE_PROG_GREY`
 *
 * @generated
 */
export const ColorF4Grey: ColorF4Grey = 'ColorF4Grey'

/**
 * General-purpose media function key, color-coded brown. This has index `5`
 * among the colored keys.
 *
 * Windows virtual key code: `VK_COLORED_KEY_5`
 *
 * Android virtual key code: `KEYCODE_PROG_BROWN`
 *
 * @generated
 */
export type ColorF5Brown = 'ColorF5Brown'

/**
 * General-purpose media function key, color-coded brown. This has index `5`
 * among the colored keys.
 *
 * Windows virtual key code: `VK_COLORED_KEY_5`
 *
 * Android virtual key code: `KEYCODE_PROG_BROWN`
 *
 * @generated
 */
export const ColorF5Brown: ColorF5Brown = 'ColorF5Brown'

/**
 * Toggles closed captioning on and off.
 *
 * Windows virtual key code: `VK_CC`
 *
 * Android virtual key code: `KEYCODE_CAPTIONS` (175)
 *
 * @generated
 */
export type ClosedCaptionToggle = 'ClosedCaptionToggle'

/**
 * Toggles closed captioning on and off.
 *
 * Windows virtual key code: `VK_CC`
 *
 * Android virtual key code: `KEYCODE_CAPTIONS` (175)
 *
 * @generated
 */
export const ClosedCaptionToggle: ClosedCaptionToggle = 'ClosedCaptionToggle'

/**
 * Adjusts the brightness of the device by toggling between two brightness
 * levels _or_ by cycling among multiple brightness levels.
 *
 * Windows virtual key code: `VK_DIMMER`
 *
 * Linux virtual key code: `GDK_KEY_BrightnessAdjust` (0x1008FF3B)
 *
 * @generated
 */
export type Dimmer = 'Dimmer'

/**
 * Adjusts the brightness of the device by toggling between two brightness
 * levels _or_ by cycling among multiple brightness levels.
 *
 * Windows virtual key code: `VK_DIMMER`
 *
 * Linux virtual key code: `GDK_KEY_BrightnessAdjust` (0x1008FF3B)
 *
 * @generated
 */
export const Dimmer: Dimmer = 'Dimmer'

/**
 * Cycles among video sources.
 *
 * Windows virtual key code: `VK_DISPLAY_SWAP`
 *
 * @generated
 */
export type DisplaySwap = 'DisplaySwap'

/**
 * Cycles among video sources.
 *
 * Windows virtual key code: `VK_DISPLAY_SWAP`
 *
 * @generated
 */
export const DisplaySwap: DisplaySwap = 'DisplaySwap'

/**
 * Switches the input source to the Digital Video Recorder (DVR).
 *
 * Android virtual key code: `KEYCODE_DVR` (173)
 *
 * @generated
 */
export type DVR = 'DVR'

/**
 * Switches the input source to the Digital Video Recorder (DVR).
 *
 * Android virtual key code: `KEYCODE_DVR` (173)
 *
 * @generated
 */
export const DVR: DVR = 'DVR'

/**
 * The Exit button, which exits the current application or menu.
 *
 * Windows virtual key code: `VK_EXIT`
 *
 * Linux virtual key code: `Qt::Key_Exit` (0x0102000a)
 *
 * @generated
 */
export type Exit = 'Exit'

/**
 * The Exit button, which exits the current application or menu.
 *
 * Windows virtual key code: `VK_EXIT`
 *
 * Linux virtual key code: `Qt::Key_Exit` (0x0102000a)
 *
 * @generated
 */
export const Exit: Exit = 'Exit'

/**
 * Clears the program or content stored in the first favorites list slot.
 *
 * Windows virtual key code: `VK_CLEAR_FAVORITE_0`
 *
 * @generated
 */
export type FavoriteClear0 = 'FavoriteClear0'

/**
 * Clears the program or content stored in the first favorites list slot.
 *
 * Windows virtual key code: `VK_CLEAR_FAVORITE_0`
 *
 * @generated
 */
export const FavoriteClear0: FavoriteClear0 = 'FavoriteClear0'

/**
 * Clears the program or content stored in the second favorites list slot.
 *
 * Windows virtual key code: `VK_CLEAR_FAVORITE_1`
 *
 * @generated
 */
export type FavoriteClear1 = 'FavoriteClear1'

/**
 * Clears the program or content stored in the second favorites list slot.
 *
 * Windows virtual key code: `VK_CLEAR_FAVORITE_1`
 *
 * @generated
 */
export const FavoriteClear1: FavoriteClear1 = 'FavoriteClear1'

/**
 * Clears the program or content stored in the third favorites list slot.
 *
 * Windows virtual key code: `VK_CLEAR_FAVORITE_2`
 *
 * @generated
 */
export type FavoriteClear2 = 'FavoriteClear2'

/**
 * Clears the program or content stored in the third favorites list slot.
 *
 * Windows virtual key code: `VK_CLEAR_FAVORITE_2`
 *
 * @generated
 */
export const FavoriteClear2: FavoriteClear2 = 'FavoriteClear2'

/**
 * Clears the program or content stored in the fourth favorites list slot.
 *
 * Windows virtual key code: `VK_CLEAR_FAVORITE_3`
 *
 * @generated
 */
export type FavoriteClear3 = 'FavoriteClear3'

/**
 * Clears the program or content stored in the fourth favorites list slot.
 *
 * Windows virtual key code: `VK_CLEAR_FAVORITE_3`
 *
 * @generated
 */
export const FavoriteClear3: FavoriteClear3 = 'FavoriteClear3'

/**
 * Selects (recalls) the program or content stored in the first favorites list
 * slot.
 *
 * Windows virtual key code: `VK_RECALL_FAVORITE_0`
 *
 * @generated
 */
export type FavoriteRecall0 = 'FavoriteRecall0'

/**
 * Selects (recalls) the program or content stored in the first favorites list
 * slot.
 *
 * Windows virtual key code: `VK_RECALL_FAVORITE_0`
 *
 * @generated
 */
export const FavoriteRecall0: FavoriteRecall0 = 'FavoriteRecall0'

/**
 * Selects (recalls) the program or content stored in the second favorites list
 * slot.
 *
 * Windows virtual key code: `VK_RECALL_FAVORITE_1`
 *
 * @generated
 */
export type FavoriteRecall1 = 'FavoriteRecall1'

/**
 * Selects (recalls) the program or content stored in the second favorites list
 * slot.
 *
 * Windows virtual key code: `VK_RECALL_FAVORITE_1`
 *
 * @generated
 */
export const FavoriteRecall1: FavoriteRecall1 = 'FavoriteRecall1'

/**
 * Selects (recalls) the program or content stored in the third favorites list
 * slot.
 *
 * Windows virtual key code: `VK_RECALL_FAVORITE_2`
 *
 * @generated
 */
export type FavoriteRecall2 = 'FavoriteRecall2'

/**
 * Selects (recalls) the program or content stored in the third favorites list
 * slot.
 *
 * Windows virtual key code: `VK_RECALL_FAVORITE_2`
 *
 * @generated
 */
export const FavoriteRecall2: FavoriteRecall2 = 'FavoriteRecall2'

/**
 * Selects (recalls) the program or content stored in the fourth favorites list
 * slot.
 *
 * Windows virtual key code: `VK_RECALL_FAVORITE_3`
 *
 * @generated
 */
export type FavoriteRecall3 = 'FavoriteRecall3'

/**
 * Selects (recalls) the program or content stored in the fourth favorites list
 * slot.
 *
 * Windows virtual key code: `VK_RECALL_FAVORITE_3`
 *
 * @generated
 */
export const FavoriteRecall3: FavoriteRecall3 = 'FavoriteRecall3'

/**
 * Stores the current program or content into the first favorites list slot.
 *
 * Windows virtual key code: `VK_STORE_FAVORITE_0`
 *
 * @generated
 */
export type FavoriteStore0 = 'FavoriteStore0'

/**
 * Stores the current program or content into the first favorites list slot.
 *
 * Windows virtual key code: `VK_STORE_FAVORITE_0`
 *
 * @generated
 */
export const FavoriteStore0: FavoriteStore0 = 'FavoriteStore0'

/**
 * Stores the current program or content into the second favorites list slot.
 *
 * Windows virtual key code: `VK_STORE_FAVORITE_1`
 *
 * @generated
 */
export type FavoriteStore1 = 'FavoriteStore1'

/**
 * Stores the current program or content into the second favorites list slot.
 *
 * Windows virtual key code: `VK_STORE_FAVORITE_1`
 *
 * @generated
 */
export const FavoriteStore1: FavoriteStore1 = 'FavoriteStore1'

/**
 * Stores the current program or content into the third favorites list slot.
 *
 * Windows virtual key code: `VK_STORE_FAVORITE_2`
 *
 * @generated
 */
export type FavoriteStore2 = 'FavoriteStore2'

/**
 * Stores the current program or content into the third favorites list slot.
 *
 * Windows virtual key code: `VK_STORE_FAVORITE_2`
 *
 * @generated
 */
export const FavoriteStore2: FavoriteStore2 = 'FavoriteStore2'

/**
 * Stores the current program or content into the fourth favorites list slot.
 *
 * Windows virtual key code: `VK_STORE_FAVORITE_3`
 *
 * @generated
 */
export type FavoriteStore3 = 'FavoriteStore3'

/**
 * Stores the current program or content into the fourth favorites list slot.
 *
 * Windows virtual key code: `VK_STORE_FAVORITE_3`
 *
 * @generated
 */
export const FavoriteStore3: FavoriteStore3 = 'FavoriteStore3'

/**
 * Toggles the display of the program or content guide.
 *
 * Windows virtual key code: `VK_GUIDE`
 *
 * Linux virtual key code: `Qt::Key_Guide` (0x0100011A)
 *
 * Android virtual key code: `KEYCODE_GUIDE` (172)
 *
 * @generated
 */
export type Guide = 'Guide'

/**
 * Toggles the display of the program or content guide.
 *
 * Windows virtual key code: `VK_GUIDE`
 *
 * Linux virtual key code: `Qt::Key_Guide` (0x0100011A)
 *
 * Android virtual key code: `KEYCODE_GUIDE` (172)
 *
 * @generated
 */
export const Guide: Guide = 'Guide'

/**
 * If the guide is currently displayed, this button tells the guide to display
 * the next day's content.
 *
 * Windows virtual key code: `VK_NEXT_DAY`
 *
 * @generated
 */
export type GuideNextDay = 'GuideNextDay'

/**
 * If the guide is currently displayed, this button tells the guide to display
 * the next day's content.
 *
 * Windows virtual key code: `VK_NEXT_DAY`
 *
 * @generated
 */
export const GuideNextDay: GuideNextDay = 'GuideNextDay'

/**
 * If the guide is currently displayed, this button tells the guide to display
 * the previous day's content.
 *
 * Windows virtual key code: `VK_PREV_DAY`
 *
 * @generated
 */
export type GuidePreviousDay = 'GuidePreviousDay'

/**
 * If the guide is currently displayed, this button tells the guide to display
 * the previous day's content.
 *
 * Windows virtual key code: `VK_PREV_DAY`
 *
 * @generated
 */
export const GuidePreviousDay: GuidePreviousDay = 'GuidePreviousDay'

/**
 * Toggles the display of information about the currently selected content,
 * program, or media.
 *
 * Windows virtual key code: `VK_INFO`
 *
 * Linux virtual key code: `Qt::Key_Info` (0x0100011B)
 *
 * Android virtual key code: `KEYCODE_INFO` (165)
 *
 * @generated
 */
export type Info = 'Info'

/**
 * Toggles the display of information about the currently selected content,
 * program, or media.
 *
 * Windows virtual key code: `VK_INFO`
 *
 * Linux virtual key code: `Qt::Key_Info` (0x0100011B)
 *
 * Android virtual key code: `KEYCODE_INFO` (165)
 *
 * @generated
 */
export const Info: Info = 'Info'

/**
 * Tells the device to perform an instant replay (typically some form of jumping
 * back a short amount of time then playing it again, possibly but not usually
 * in slow motion).
 *
 * Windows virtual key code: `VK_INSTANT_REPLAY`
 *
 * @generated
 */
export type InstantReplay = 'InstantReplay'

/**
 * Tells the device to perform an instant replay (typically some form of jumping
 * back a short amount of time then playing it again, possibly but not usually
 * in slow motion).
 *
 * Windows virtual key code: `VK_INSTANT_REPLAY`
 *
 * @generated
 */
export const InstantReplay: InstantReplay = 'InstantReplay'

/**
 * Opens content linked to the current program, if available and possible.
 *
 * Windows virtual key code: `VK_LINK`
 *
 * @generated
 */
export type Link = 'Link'

/**
 * Opens content linked to the current program, if available and possible.
 *
 * Windows virtual key code: `VK_LINK`
 *
 * @generated
 */
export const Link: Link = 'Link'

/**
 * Lists the current program.
 *
 * Windows virtual key code: `VK_LIST`
 *
 * @generated
 */
export type ListProgram = 'ListProgram'

/**
 * Lists the current program.
 *
 * Windows virtual key code: `VK_LIST`
 *
 * @generated
 */
export const ListProgram: ListProgram = 'ListProgram'

/**
 * Toggles a display listing currently available live content or programs.
 *
 * Windows virtual key code: `VK_LIVE`
 *
 * @generated
 */
export type LiveContent = 'LiveContent'

/**
 * Toggles a display listing currently available live content or programs.
 *
 * Windows virtual key code: `VK_LIVE`
 *
 * @generated
 */
export const LiveContent: LiveContent = 'LiveContent'

/**
 * Locks or unlocks the currently selected content or program.
 *
 * Windows virtual key code: `VK_LOCK`
 *
 * @generated
 */
export type Lock = 'Lock'

/**
 * Locks or unlocks the currently selected content or program.
 *
 * Windows virtual key code: `VK_LOCK`
 *
 * @generated
 */
export const Lock: Lock = 'Lock'

/**
 * Presents a list of media applications, such as photo viewers, audio and video
 * players, and games.
 *
 * Don't confuse the media controller `VK_APPS` key with the Windows `VK_APPS`
 * key, which is also known as `VK_CONTEXT_MENU`. That key is encoded as
 * `"ContextMenu"`.
 *
 * Windows virtual key code: `VK_APPS`
 *
 * @generated
 */
export type MediaApps = 'MediaApps'

/**
 * Presents a list of media applications, such as photo viewers, audio and video
 * players, and games.
 *
 * Don't confuse the media controller `VK_APPS` key with the Windows `VK_APPS`
 * key, which is also known as `VK_CONTEXT_MENU`. That key is encoded as
 * `"ContextMenu"`.
 *
 * Windows virtual key code: `VK_APPS`
 *
 * @generated
 */
export const MediaApps: MediaApps = 'MediaApps'

/**
 * The Audio Track key.
 *
 * Linux virtual key code: GDK_KEY_AudioCycleTrack (0x1008FF9B)
 * `Qt::Key_AudioCycleTrack` (0x01000106)
 *
 * Android virtual key code: `KEYCODE_MEDIA_AUDIO_TRACK` (222)
 *
 * @generated
 */
export type MediaAudioTrack = 'MediaAudioTrack'

/**
 * The Audio Track key.
 *
 * Linux virtual key code: GDK_KEY_AudioCycleTrack (0x1008FF9B)
 * `Qt::Key_AudioCycleTrack` (0x01000106)
 *
 * Android virtual key code: `KEYCODE_MEDIA_AUDIO_TRACK` (222)
 *
 * @generated
 */
export const MediaAudioTrack: MediaAudioTrack = 'MediaAudioTrack'

/**
 * Jumps back to the last-viewed content, program, or other media.
 *
 * Windows virtual key code: `VK_LAST`
 *
 * Linux virtual key code: `Qt::Key_MediaLast` (0x0100FFFF)
 *
 * Android virtual key code: `KEYCODE_LAST_CHANNEL` (229)
 *
 * @generated
 */
export type MediaLast = 'MediaLast'

/**
 * Jumps back to the last-viewed content, program, or other media.
 *
 * Windows virtual key code: `VK_LAST`
 *
 * Linux virtual key code: `Qt::Key_MediaLast` (0x0100FFFF)
 *
 * Android virtual key code: `KEYCODE_LAST_CHANNEL` (229)
 *
 * @generated
 */
export const MediaLast: MediaLast = 'MediaLast'

/**
 * Skips backward to the previous content or program.
 *
 * Android virtual key code: `KEYCODE_MEDIA_SKIP_BACKWARD`
 *
 * @generated
 */
export type MediaSkipBackward = 'MediaSkipBackward'

/**
 * Skips backward to the previous content or program.
 *
 * Android virtual key code: `KEYCODE_MEDIA_SKIP_BACKWARD`
 *
 * @generated
 */
export const MediaSkipBackward: MediaSkipBackward = 'MediaSkipBackward'

/**
 * Skips forward to the next content or program.
 *
 * Windows virtual key code: `VK_SKIP`
 *
 * Android virtual key code: `KEYCODE_MEDIA_SKIP_FORWARD`
 *
 * @generated
 */
export type MediaSkipForward = 'MediaSkipForward'

/**
 * Skips forward to the next content or program.
 *
 * Windows virtual key code: `VK_SKIP`
 *
 * Android virtual key code: `KEYCODE_MEDIA_SKIP_FORWARD`
 *
 * @generated
 */
export const MediaSkipForward: MediaSkipForward = 'MediaSkipForward'

/**
 * Steps backward to the previous content or program.
 *
 * Android virtual key code: `KEYCODE_MEDIA_STEP_BACKWARD`
 *
 * @generated
 */
export type MediaStepBackward = 'MediaStepBackward'

/**
 * Steps backward to the previous content or program.
 *
 * Android virtual key code: `KEYCODE_MEDIA_STEP_BACKWARD`
 *
 * @generated
 */
export const MediaStepBackward: MediaStepBackward = 'MediaStepBackward'

/**
 * Steps forward to the next content or program.
 *
 * Android virtual key code: `KEYCODE_MEDIA_SKIP_FORWARD`
 *
 * @generated
 */
export type MediaStepForward = 'MediaStepForward'

/**
 * Steps forward to the next content or program.
 *
 * Android virtual key code: `KEYCODE_MEDIA_SKIP_FORWARD`
 *
 * @generated
 */
export const MediaStepForward: MediaStepForward = 'MediaStepForward'

/**
 * Top Menu button. Opens the media's main menu (e.g., for a DVD or Blu-Ray
 * disc).
 *
 * Linux virtual key code: `Qt::Key_TopMenu` (0x0100010A)
 *
 * Android virtual key code: `KEYCODE_MEDIA_TOP_MENU`
 *
 * @generated
 */
export type MediaTopMenu = 'MediaTopMenu'

/**
 * Top Menu button. Opens the media's main menu (e.g., for a DVD or Blu-Ray
 * disc).
 *
 * Linux virtual key code: `Qt::Key_TopMenu` (0x0100010A)
 *
 * Android virtual key code: `KEYCODE_MEDIA_TOP_MENU`
 *
 * @generated
 */
export const MediaTopMenu: MediaTopMenu = 'MediaTopMenu'

/**
 * Navigates into a submenu or option.
 *
 * Android virtual key code: `KEYCODE_NAVIGATE_IN`
 *
 * @generated
 */
export type NavigateIn = 'NavigateIn'

/**
 * Navigates into a submenu or option.
 *
 * Android virtual key code: `KEYCODE_NAVIGATE_IN`
 *
 * @generated
 */
export const NavigateIn: NavigateIn = 'NavigateIn'

/**
 * Navigates to the next item.
 *
 * Android virtual key code: `KEYCODE_NAVIGATE_NEXT`
 *
 * @generated
 */
export type NavigateNext = 'NavigateNext'

/**
 * Navigates to the next item.
 *
 * Android virtual key code: `KEYCODE_NAVIGATE_NEXT`
 *
 * @generated
 */
export const NavigateNext: NavigateNext = 'NavigateNext'

/**
 * Navigates out of the current screen or menu.
 *
 * Android virtual key code: `KEYCODE_NAVIGATE_OUT`
 *
 * @generated
 */
export type NavigateOut = 'NavigateOut'

/**
 * Navigates out of the current screen or menu.
 *
 * Android virtual key code: `KEYCODE_NAVIGATE_OUT`
 *
 * @generated
 */
export const NavigateOut: NavigateOut = 'NavigateOut'

/**
 * Navigates to the previous item.
 *
 * Android virtual key code: `KEYCODE_NAVIGATE_PREVIOUS`
 *
 * @generated
 */
export type NavigatePrevious = 'NavigatePrevious'

/**
 * Navigates to the previous item.
 *
 * Android virtual key code: `KEYCODE_NAVIGATE_PREVIOUS`
 *
 * @generated
 */
export const NavigatePrevious: NavigatePrevious = 'NavigatePrevious'

/**
 * Cycles to the next channel in the favorites list.
 *
 * Windows virtual key code: `VK_NEXT_FAVORITE_CHANNEL`
 *
 * @generated
 */
export type NextFavoriteChannel = 'NextFavoriteChannel'

/**
 * Cycles to the next channel in the favorites list.
 *
 * Windows virtual key code: `VK_NEXT_FAVORITE_CHANNEL`
 *
 * @generated
 */
export const NextFavoriteChannel: NextFavoriteChannel = 'NextFavoriteChannel'

/**
 * Cycles to the next saved user profile, if this feature is supported and
 * multiple profiles exist.
 *
 * Windows virtual key code: `VK_USER`
 *
 * @generated
 */
export type NextUserProfile = 'NextUserProfile'

/**
 * Cycles to the next saved user profile, if this feature is supported and
 * multiple profiles exist.
 *
 * Windows virtual key code: `VK_USER`
 *
 * @generated
 */
export const NextUserProfile: NextUserProfile = 'NextUserProfile'

/**
 * Opens the user interface for selecting on demand content or programs to
 * watch.
 *
 * Windows virtual key code: `VK_ON_DEMAND`
 *
 * @generated
 */
export type OnDemand = 'OnDemand'

/**
 * Opens the user interface for selecting on demand content or programs to
 * watch.
 *
 * Windows virtual key code: `VK_ON_DEMAND`
 *
 * @generated
 */
export const OnDemand: OnDemand = 'OnDemand'

/**
 * Starts the process of pairing the remote with a device to be controlled.
 *
 * Android virtual key code: `KEYCODE_PAIRING` (225)
 *
 * @generated
 */
export type Pairing = 'Pairing'

/**
 * Starts the process of pairing the remote with a device to be controlled.
 *
 * Android virtual key code: `KEYCODE_PAIRING` (225)
 *
 * @generated
 */
export const Pairing: Pairing = 'Pairing'

/**
 * A button to move the picture-in-picture view downward.
 *
 * Windows virtual key code: `VK_PINP_DOWN`
 *
 * @generated
 */
export type PinPDown = 'PinPDown'

/**
 * A button to move the picture-in-picture view downward.
 *
 * Windows virtual key code: `VK_PINP_DOWN`
 *
 * @generated
 */
export const PinPDown: PinPDown = 'PinPDown'

/**
 * A button to control moving the picture-in-picture view.
 *
 * Windows virtual key code: `VK_PINP_MOVE`
 *
 * @generated
 */
export type PinPMove = 'PinPMove'

/**
 * A button to control moving the picture-in-picture view.
 *
 * Windows virtual key code: `VK_PINP_MOVE`
 *
 * @generated
 */
export const PinPMove: PinPMove = 'PinPMove'

/**
 * Toggles display of the picture-in-picture view on and off.
 *
 * Windows virtual key code: `VK_PINP_TOGGLE`
 *
 * @generated
 */
export type PinPToggle = 'PinPToggle'

/**
 * Toggles display of the picture-in-picture view on and off.
 *
 * Windows virtual key code: `VK_PINP_TOGGLE`
 *
 * @generated
 */
export const PinPToggle: PinPToggle = 'PinPToggle'

/**
 * A button to move the picture-in-picture view upward.
 *
 * Windows virtual key code: `VK_PINP_UP`
 *
 * @generated
 */
export type PinPUp = 'PinPUp'

/**
 * A button to move the picture-in-picture view upward.
 *
 * Windows virtual key code: `VK_PINP_UP`
 *
 * @generated
 */
export const PinPUp: PinPUp = 'PinPUp'

/**
 * Decreases the media playback rate.
 *
 * Windows virtual key code: `VK_PLAY_SPEED_DOWN`
 *
 * @generated
 */
export type PlaySpeedDown = 'PlaySpeedDown'

/**
 * Decreases the media playback rate.
 *
 * Windows virtual key code: `VK_PLAY_SPEED_DOWN`
 *
 * @generated
 */
export const PlaySpeedDown: PlaySpeedDown = 'PlaySpeedDown'

/**
 * Returns the media playback rate to normal.
 *
 * Windows virtual key code: `VK_PLAY_SPEED_RESET`
 *
 * @generated
 */
export type PlaySpeedReset = 'PlaySpeedReset'

/**
 * Returns the media playback rate to normal.
 *
 * Windows virtual key code: `VK_PLAY_SPEED_RESET`
 *
 * @generated
 */
export const PlaySpeedReset: PlaySpeedReset = 'PlaySpeedReset'

/**
 * Increases the media playback rate.
 *
 * Windows virtual key code: `VK_PLAY_SPEED_UP`
 *
 * @generated
 */
export type PlaySpeedUp = 'PlaySpeedUp'

/**
 * Increases the media playback rate.
 *
 * Windows virtual key code: `VK_PLAY_SPEED_UP`
 *
 * @generated
 */
export const PlaySpeedUp: PlaySpeedUp = 'PlaySpeedUp'

/**
 * Toggles random media (also known as "shuffle mode") on and off.
 *
 * Windows virtual key code: `VK_RANDOM_TOGGLE`
 *
 * Linux virtual key code: `GDK_KEY_AudioRandomPlay` (0x1008FF99)
 *
 * @generated
 */
export type RandomToggle = 'RandomToggle'

/**
 * Toggles random media (also known as "shuffle mode") on and off.
 *
 * Windows virtual key code: `VK_RANDOM_TOGGLE`
 *
 * Linux virtual key code: `GDK_KEY_AudioRandomPlay` (0x1008FF99)
 *
 * @generated
 */
export const RandomToggle: RandomToggle = 'RandomToggle'

/**
 * A code sent when the remote control's battery is low. This doesn't actually
 * correspond to a physical key at all.
 *
 * Windows virtual key code: `VK_RC_LOW_BATTERY`
 *
 * @generated
 */
export type RcLowBattery = 'RcLowBattery'

/**
 * A code sent when the remote control's battery is low. This doesn't actually
 * correspond to a physical key at all.
 *
 * Windows virtual key code: `VK_RC_LOW_BATTERY`
 *
 * @generated
 */
export const RcLowBattery: RcLowBattery = 'RcLowBattery'

/**
 * Cycles among the available media recording speeds.
 *
 * Windows virtual key code: `VK_RECORD_SPEED_NEXT`
 *
 * @generated
 */
export type RecordSpeedNext = 'RecordSpeedNext'

/**
 * Cycles among the available media recording speeds.
 *
 * Windows virtual key code: `VK_RECORD_SPEED_NEXT`
 *
 * @generated
 */
export const RecordSpeedNext: RecordSpeedNext = 'RecordSpeedNext'

/**
 * Toggles radio frequency (RF) input bypass mode on and off. RF bypass mode
 * passes RF input directly to the RF output without any processing or
 * filtering.
 *
 * Windows virtual key code: `VK_RF_BYPASS`
 *
 * @generated
 */
export type RfBypass = 'RfBypass'

/**
 * Toggles radio frequency (RF) input bypass mode on and off. RF bypass mode
 * passes RF input directly to the RF output without any processing or
 * filtering.
 *
 * Windows virtual key code: `VK_RF_BYPASS`
 *
 * @generated
 */
export const RfBypass: RfBypass = 'RfBypass'

/**
 * Toggles the channel scan mode on and off. This is a mode which flips through
 * channels automatically until the user stops the scan.
 *
 * Windows virtual key code: `VK_SCAN_CHANNELS_TOGGLE`
 *
 * @generated
 */
export type ScanChannelsToggle = 'ScanChannelsToggle'

/**
 * Toggles the channel scan mode on and off. This is a mode which flips through
 * channels automatically until the user stops the scan.
 *
 * Windows virtual key code: `VK_SCAN_CHANNELS_TOGGLE`
 *
 * @generated
 */
export const ScanChannelsToggle: ScanChannelsToggle = 'ScanChannelsToggle'

/**
 * Cycles through the available screen display modes.
 *
 * Windows virtual key code: `VK_SCREEN_MODE_NEXT`
 *
 * @generated
 */
export type ScreenModeNext = 'ScreenModeNext'

/**
 * Cycles through the available screen display modes.
 *
 * Windows virtual key code: `VK_SCREEN_MODE_NEXT`
 *
 * @generated
 */
export const ScreenModeNext: ScreenModeNext = 'ScreenModeNext'

/**
 * Toggles display of the device's settings screen on and off.
 *
 * Windows virtual key code: `VK_SETTINGS`
 *
 * Linux virtual key code: `Qt::Key_Settings` (0x0100011C)
 *
 * Android virtual key code: `KEYCODE_SETTINGS`
 *
 * @generated
 */
export type Settings = 'Settings'

/**
 * Toggles display of the device's settings screen on and off.
 *
 * Windows virtual key code: `VK_SETTINGS`
 *
 * Linux virtual key code: `Qt::Key_Settings` (0x0100011C)
 *
 * Android virtual key code: `KEYCODE_SETTINGS`
 *
 * @generated
 */
export const Settings: Settings = 'Settings'

/**
 * Toggles split screen display mode on and off.
 *
 * Windows virtual key code: `VK_SPLIT_SCREEN_TOGGLE`
 *
 * Linux virtual key code: `GDK_KEY_SplitScreen` (0x1008FF7D)
 * `Qt::Key_SplitScreen` (0x010000ED)
 *
 * @generated
 */
export type SplitScreenToggle = 'SplitScreenToggle'

/**
 * Toggles split screen display mode on and off.
 *
 * Windows virtual key code: `VK_SPLIT_SCREEN_TOGGLE`
 *
 * Linux virtual key code: `GDK_KEY_SplitScreen` (0x1008FF7D)
 * `Qt::Key_SplitScreen` (0x010000ED)
 *
 * @generated
 */
export const SplitScreenToggle: SplitScreenToggle = 'SplitScreenToggle'

/**
 * Cycles among input modes on an external set-top box (STB).
 *
 * These keys were `"Unidentified"` until Firefox 37.
 *
 * Android virtual key code: `KEYCODE_STB_INPUT` (180)
 *
 * @generated
 */
export type STBInput = 'STBInput'

/**
 * Cycles among input modes on an external set-top box (STB).
 *
 * These keys were `"Unidentified"` until Firefox 37.
 *
 * Android virtual key code: `KEYCODE_STB_INPUT` (180)
 *
 * @generated
 */
export const STBInput: STBInput = 'STBInput'

/**
 * Toggles on and off an external STB.
 *
 * These keys were `"Unidentified"` until Firefox 37.
 *
 * Android virtual key code: `KEYCODE_STB_POWER` (179)
 *
 * @generated
 */
export type STBPower = 'STBPower'

/**
 * Toggles on and off an external STB.
 *
 * These keys were `"Unidentified"` until Firefox 37.
 *
 * Android virtual key code: `KEYCODE_STB_POWER` (179)
 *
 * @generated
 */
export const STBPower: STBPower = 'STBPower'

/**
 * Toggles the display of subtitles on and off if they're available.
 *
 * Windows virtual key code: `VK_SUBTITLE`
 *
 * Linux virtual key code: `GDK_KEY_Subtitle` (0x1008FF9A)
 *
 * Android virtual key code: `KEYCODE_CAPTIONS` (175)
 *
 * @generated
 */
export type Subtitle = 'Subtitle'

/**
 * Toggles the display of subtitles on and off if they're available.
 *
 * Windows virtual key code: `VK_SUBTITLE`
 *
 * Linux virtual key code: `GDK_KEY_Subtitle` (0x1008FF9A)
 *
 * Android virtual key code: `KEYCODE_CAPTIONS` (175)
 *
 * @generated
 */
export const Subtitle: Subtitle = 'Subtitle'

/**
 * Toggles display of [teletext](https://en.wikipedia.org/wiki/Teletext), if
 * available.
 *
 * Windows virtual key code: `VK_TELETEXT`
 *
 * Android virtual key code: `KEYCODE_TV_TELETEXT` (233)
 *
 * @generated
 */
export type Teletext = 'Teletext'

/**
 * Toggles display of [teletext](https://en.wikipedia.org/wiki/Teletext), if
 * available.
 *
 * Windows virtual key code: `VK_TELETEXT`
 *
 * Android virtual key code: `KEYCODE_TV_TELETEXT` (233)
 *
 * @generated
 */
export const Teletext: Teletext = 'Teletext'

/**
 * Cycles through the available video modes.
 *
 * These keys were `"Unidentified"` until Firefox 37.
 *
 * Windows virtual key code: `VK_VIDEO_MODE_NEXT`
 *
 * Linux virtual key code: `GDK_KEY_Next_VMode` (0x1008FE22)
 *
 * @generated
 */
export type VideoModeNext = 'VideoModeNext'

/**
 * Cycles through the available video modes.
 *
 * These keys were `"Unidentified"` until Firefox 37.
 *
 * Windows virtual key code: `VK_VIDEO_MODE_NEXT`
 *
 * Linux virtual key code: `GDK_KEY_Next_VMode` (0x1008FE22)
 *
 * @generated
 */
export const VideoModeNext: VideoModeNext = 'VideoModeNext'

/**
 * Causes the device to identify itself in some fashion, such as by flashing a
 * light, briefly changing the brightness of indicator lights, or emitting a
 * tone.
 *
 * Windows virtual key code: `VK_WINK`
 *
 * @generated
 */
export type Wink = 'Wink'

/**
 * Causes the device to identify itself in some fashion, such as by flashing a
 * light, briefly changing the brightness of indicator lights, or emitting a
 * tone.
 *
 * Windows virtual key code: `VK_WINK`
 *
 * @generated
 */
export const Wink: Wink = 'Wink'

/**
 * Toggles between fullscreen and scaled content display, or otherwise change
 * the magnification level.
 *
 * Firefox 36 and earlier identifies the zoom toggle button as `"Zoom"`. Firefox
 * 37 corrects this to `"ZoomToggle"`.
 *
 * Windows virtual key code: `VK_ZOOM` (0xFB)
 *
 * Linux virtual key code: `Qt::Key_Zoom` (0x01020006)
 *
 * Android virtual key code: `KEYCODE_TV_ZOOM_MODE` (255)
 *
 * @generated
 */
export type ZoomToggle = 'ZoomToggle'

/**
 * Toggles between fullscreen and scaled content display, or otherwise change
 * the magnification level.
 *
 * Firefox 36 and earlier identifies the zoom toggle button as `"Zoom"`. Firefox
 * 37 corrects this to `"ZoomToggle"`.
 *
 * Windows virtual key code: `VK_ZOOM` (0xFB)
 *
 * Linux virtual key code: `Qt::Key_Zoom` (0x01020006)
 *
 * Android virtual key code: `KEYCODE_TV_ZOOM_MODE` (255)
 *
 * @generated
 */
export const ZoomToggle: ZoomToggle = 'ZoomToggle'
