use std::ffi::{CStr, CString};
use std::num::NonZeroUsize;
use std::os::raw::{c_char, c_int, c_uint, c_ushort};
use std::panic;
use std::thread;

use bliss_audio::cue::BlissCue;
use bliss_audio::decoder::ffmpeg::FFmpegDecoder as Decoder;
use bliss_audio::decoder::Decoder as DecoderTrait;
use bliss_audio::playlist::{cosine_distance, euclidean_distance};
use bliss_audio::{
    AnalysisOptions, BlissError, BlissResult, FeaturesVersion, Song, NUMBER_FEATURES,
};
use ndarray::arr1;

macro_rules! try_path_str {
    ($ptr:expr) => {
        match unsafe_path_str($ptr) {
            Ok(s) => s,
            Err(ptr) => return ptr,
        }
    };
}

/// Returns the number of features in the latest bliss analysis vector.
#[no_mangle]
pub extern "C" fn bliss_number_features() -> c_int {
    NUMBER_FEATURES as c_int
}

/// Analyze a single audio file at `path` using the latest feature version.
///
/// On success, writes `features_len` f32 values into `features_out` and returns
/// a heap-allocated JSON metadata string (no `features` field in the JSON).
/// On failure, `features_out` is not written; the JSON contains the error.
/// Free the returned string with `bliss_free_string`.
#[no_mangle]
pub extern "C" fn bliss_analyze_song(
    path: *const c_char,
    features_out: *mut f32,
    features_len: c_int,
) -> *mut c_char {
    let path_str = try_path_str!(path);
    make_cstr(
        song_result_into(
            &path_str,
            catch_analysis_panic(|| Decoder::song_from_path(&path_str)),
            features_out,
            features_len as usize,
        )
        .to_string(),
    )
}

/// Analyze a single audio file with explicit `features_version` (1 or 2) and
/// `number_cores` (0 = auto-detect).
///
/// Same buffer semantics as `bliss_analyze_song`.
/// Free the returned string with `bliss_free_string`.
#[no_mangle]
pub extern "C" fn bliss_analyze_song_with_options(
    path: *const c_char,
    features_version_raw: c_ushort,
    number_cores_raw: c_uint,
    features_out: *mut f32,
    features_len: c_int,
) -> *mut c_char {
    let path_str = try_path_str!(path);
    let options = match make_analysis_options(features_version_raw, number_cores_raw) {
        Ok(o) => o,
        Err(e) => return make_cstr(bliss_error_to_song_json(&path_str, &e).to_string()),
    };
    make_cstr(
        song_result_into(
            &path_str,
            catch_analysis_panic(|| Decoder::song_from_path_with_options(&path_str, options)),
            features_out,
            features_len as usize,
        )
        .to_string(),
    )
}

/// Analyze all tracks in a CUE sheet at `cue_path` using the latest features version.
///
/// Successful track `i` (0-indexed) writes its features into
/// `features_out[i * features_stride .. i * features_stride + features_stride]`.
/// At most `max_tracks` slots are written; failed tracks do not write.
///
/// Returns a heap-allocated JSON string (no `features` fields in the song objects).
/// Free the returned string with `bliss_free_string`.
#[no_mangle]
pub extern "C" fn bliss_analyze_cue(
    cue_path: *const c_char,
    features_out: *mut f32,
    features_stride: c_int,
    max_tracks: c_int,
) -> *mut c_char {
    let path_str = try_path_str!(cue_path);
    let result = panic::catch_unwind(|| BlissCue::<Decoder>::songs_from_path(&path_str));
    make_cstr(
        cue_result_into(
            &path_str,
            result,
            features_out,
            features_stride as usize,
            max_tracks as usize,
        )
        .to_string(),
    )
}

/// Analyze all tracks in a CUE sheet with explicit `features_version` and `number_cores`.
///
/// Same buffer semantics as `bliss_analyze_cue`.
/// Free the returned string with `bliss_free_string`.
#[no_mangle]
pub extern "C" fn bliss_analyze_cue_with_options(
    cue_path: *const c_char,
    features_version_raw: c_ushort,
    number_cores_raw: c_uint,
    features_out: *mut f32,
    features_stride: c_int,
    max_tracks: c_int,
) -> *mut c_char {
    let path_str = try_path_str!(cue_path);
    let options = match make_analysis_options(features_version_raw, number_cores_raw) {
        Ok(o) => o,
        Err(e) => return make_cstr(bliss_error_to_cue_json(&e).to_string()),
    };
    let result = panic::catch_unwind(|| {
        BlissCue::<Decoder>::songs_from_path_with_options(&path_str, &options)
    });
    make_cstr(
        cue_result_into(
            &path_str,
            result,
            features_out,
            features_stride as usize,
            max_tracks as usize,
        )
        .to_string(),
    )
}

/// Free a string previously returned by any `bliss_*` function.
#[no_mangle]
pub extern "C" fn bliss_free_string(ptr: *mut c_char) {
    if !ptr.is_null() {
        unsafe { drop(CString::from_raw(ptr)) }
    }
}

/// Euclidean distance between two f32 feature arrays of length `len`.
#[no_mangle]
pub extern "C" fn bliss_euclidean_distance(a: *const f32, b: *const f32, len: c_int) -> f32 {
    let (a_slice, b_slice) = unsafe { f32_pair_slices(a, b, len) };
    euclidean_distance(&arr1(a_slice), &arr1(b_slice))
}

/// Cosine distance between two f32 feature arrays of length `len`.
#[no_mangle]
pub extern "C" fn bliss_cosine_distance(a: *const f32, b: *const f32, len: c_int) -> f32 {
    let (a_slice, b_slice) = unsafe { f32_pair_slices(a, b, len) };
    cosine_distance(&arr1(a_slice), &arr1(b_slice))
}

// ── Private helpers ────────────────────────────────────────────────────────────

fn unsafe_path_str(ptr: *const c_char) -> Result<String, *mut c_char> {
    match unsafe { CStr::from_ptr(ptr).to_str() } {
        Ok(s) => Ok(s.to_owned()),
        Err(_) => Err(make_cstr(
            song_error_value(
                "<invalid utf-8 path>",
                "invalid UTF-8 in path",
                "DecodingError",
            )
            .to_string(),
        )),
    }
}

fn catch_analysis_panic<T, F>(f: F) -> BlissResult<T>
where
    F: FnOnce() -> BlissResult<T> + panic::UnwindSafe,
{
    match panic::catch_unwind(f) {
        Ok(r) => r,
        Err(_) => Err(BlissError::AnalysisError("panic during analysis".into())),
    }
}

unsafe fn f32_pair_slices<'a>(a: *const f32, b: *const f32, len: c_int) -> (&'a [f32], &'a [f32]) {
    (
        std::slice::from_raw_parts(a, len as usize),
        std::slice::from_raw_parts(b, len as usize),
    )
}

fn bliss_error_parts(e: &BlissError) -> (&str, &str) {
    match e {
        BlissError::DecodingError(m) => (m.as_str(), "DecodingError"),
        BlissError::AnalysisError(m) => (m.as_str(), "AnalysisError"),
        BlissError::ProviderError(m) => (m.as_str(), "ProviderError"),
    }
}

fn bliss_error_to_song_json(path: &str, e: &BlissError) -> serde_json::Value {
    let (msg, tag) = bliss_error_parts(e);
    song_error_value(path, msg, tag)
}

fn bliss_error_to_cue_json(e: &BlissError) -> serde_json::Value {
    let (msg, tag) = bliss_error_parts(e);
    cue_error_value(msg, tag)
}

fn make_analysis_options(
    features_version_raw: c_ushort,
    number_cores_raw: c_uint,
) -> BlissResult<AnalysisOptions> {
    let features_version = FeaturesVersion::try_from(features_version_raw)?;
    let number_cores = if number_cores_raw == 0 {
        thread::available_parallelism().unwrap_or(NonZeroUsize::new(1).unwrap())
    } else {
        NonZeroUsize::new(number_cores_raw as usize).unwrap_or(NonZeroUsize::new(1).unwrap())
    };
    Ok(AnalysisOptions {
        features_version,
        number_cores,
    })
}

/// Copy a song's feature vector directly into `out`, writing at most `len` values.
fn write_song_features(song: &Song, out: *mut f32, len: usize) {
    let vec = song.analysis.as_vec();
    let n = vec.len().min(len);
    unsafe { std::ptr::copy_nonoverlapping(vec.as_ptr(), out, n) }
}

#[derive(serde::Serialize)]
struct CueInfoJson {
    cue_path: String,
    audio_file_path: String,
}

#[derive(serde::Serialize)]
struct SongMetaJson {
    path: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    artist: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    title: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    album: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    album_artist: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    track_number: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    disc_number: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    genre: Option<String>,
    duration_secs: f64,
    features_version: u16,
    #[serde(skip_serializing_if = "Option::is_none")]
    cue_info: Option<CueInfoJson>,
}

/// JSON metadata for a successfully-analyzed song — no `features` field.
fn song_meta_value(song: &Song) -> serde_json::Value {
    serde_json::to_value(SongMetaJson {
        path: song.path.to_string_lossy().into_owned(),
        artist: song.artist.clone(),
        title: song.title.clone(),
        album: song.album.clone(),
        album_artist: song.album_artist.clone(),
        track_number: song.track_number,
        disc_number: song.disc_number,
        genre: song.genre.clone(),
        duration_secs: song.duration.as_secs_f64(),
        features_version: u16::from(song.features_version),
        cue_info: song.cue_info.as_ref().map(|ci| CueInfoJson {
            cue_path: ci.cue_path.to_string_lossy().into_owned(),
            audio_file_path: ci.audio_file_path.to_string_lossy().into_owned(),
        }),
    })
    .unwrap()
}

fn song_error_value(path: &str, message: &str, tag: &str) -> serde_json::Value {
    serde_json::json!({
        "path": path,
        "error": message,
        "error_tag": tag,
    })
}

/// On success: writes features into `features_out`, returns metadata JSON.
/// On error: leaves `features_out` untouched, returns error JSON.
fn song_result_into(
    path: &str,
    result: BlissResult<Song>,
    features_out: *mut f32,
    features_len: usize,
) -> serde_json::Value {
    match result {
        Ok(song) => {
            write_song_features(&song, features_out, features_len);
            song_meta_value(&song)
        }
        Err(e) => bliss_error_to_song_json(path, &e),
    }
}

fn cue_error_value(message: &str, tag: &str) -> serde_json::Value {
    serde_json::json!({
        "error": message,
        "error_tag": tag,
    })
}

fn cue_result_into(
    cue_path: &str,
    result: Result<BlissResult<Vec<BlissResult<Song>>>, Box<dyn std::any::Any + Send>>,
    features_out: *mut f32,
    features_stride: usize,
    max_tracks: usize,
) -> serde_json::Value {
    let outer = match result {
        Ok(r) => r,
        Err(_) => return cue_error_value("panic during CUE analysis", "AnalysisError"),
    };
    match outer {
        Err(e) => bliss_error_to_cue_json(&e),
        Ok(song_results) => {
            let songs: Vec<serde_json::Value> = song_results
                .into_iter()
                .enumerate()
                .map(|(idx, r)| match r {
                    Ok(song) => {
                        if idx < max_tracks {
                            let slot = unsafe { features_out.add(idx * features_stride) };
                            write_song_features(&song, slot, features_stride);
                        }
                        song_meta_value(&song)
                    }
                    Err(e) => {
                        let path = format!("{}/CUE_TRACK{:03}", cue_path, idx + 1);
                        bliss_error_to_song_json(&path, &e)
                    }
                })
                .collect();
            serde_json::json!({
                "songs": songs,
            })
        }
    }
}

fn make_cstr(s: String) -> *mut c_char {
    CString::new(s)
        .unwrap_or_else(|_| CString::new("{}").unwrap())
        .into_raw()
}
