use wasm_bindgen::prelude::*;

mod orchestrator;
mod oscillator;
mod wav;

use crate::orchestrator::{BezierOrchestrator, Note, SineOrchestrator};
use crate::oscillator::{BezierOscillator, SinOscillator};

/// Initialize panic hook for better error messages in the browser console
#[wasm_bindgen(start)]
pub fn init() {
    console_error_panic_hook::set_once();
}

/// Validates control points for bezier oscillators
fn validate_control_points(control_points: &[f64]) -> Result<(), String> {
    if control_points.len() != 4 {
        return Err(format!(
            "Bezier oscillator requires exactly 4 control points, got {}",
            control_points.len()
        ));
    }
    for (i, point) in control_points.iter().enumerate() {
        if *point < -1.0 || *point > 1.0 {
            return Err(format!(
                "Control point {} ({}) must be between -1.0 and 1.0",
                i, point
            ));
        }
    }
    Ok(())
}

/// Validates common oscillator parameters
fn validate_oscillator_params(
    frequency: f64,
    sample_rate: u32,
    duration: f64,
    amplitude: f64,
) -> Result<(), String> {
    if frequency <= 0.0 {
        return Err(format!(
            "Frequency must be greater than 0, got {}",
            frequency
        ));
    }
    if sample_rate == 0 {
        return Err("Sample rate must be greater than 0".to_string());
    }
    if duration <= 0.0 {
        return Err(format!("Duration must be greater than 0, got {}", duration));
    }
    if amplitude < 0.0 || amplitude > 1.0 {
        return Err(format!(
            "Amplitude must be between 0.0 and 1.0, got {}",
            amplitude
        ));
    }
    Ok(())
}

/// Generates a sine wave as a complete WAV file byte array
///
/// # Arguments
/// * `frequency` - Frequency in Hz (must be > 0)
/// * `sample_rate` - Sample rate in Hz (typically 44100)
/// * `duration` - Duration in seconds (must be > 0)
/// * `amplitude` - Amplitude between 0.0 and 1.0
///
/// # Returns
/// A Uint8Array containing the complete WAV file that can be used in an HTML audio element
#[wasm_bindgen]
pub fn sine_oscillator(
    frequency: f64,
    sample_rate: u32,
    duration: f64,
    amplitude: f64,
) -> Result<Vec<u8>, JsValue> {
    validate_oscillator_params(frequency, sample_rate, duration, amplitude)
        .map_err(|e| JsValue::from_str(&e))?;

    let wave = SinOscillator {
        frequency,
        amplitude,
        sample_rate,
    };

    let total_samples = (duration * sample_rate as f64) as u32;
    let mut pcm_samples: Vec<i16> = Vec::with_capacity(total_samples as usize);

    for i in 0..total_samples {
        pcm_samples.push(wave.pcm_sample(i));
    }

    let wav_bytes = wav::to_bytes(&pcm_samples, sample_rate);
    Ok(wav_bytes)
}

/// Generates a bezier curve-based wave as a complete WAV file byte array
///
/// # Arguments
/// * `frequency` - Frequency in Hz (must be > 0)
/// * `sample_rate` - Sample rate in Hz (typically 44100)
/// * `control_points` - Array of exactly 4 y-values between -1.0 and 1.0 defining the bezier curve
/// * `duration` - Duration in seconds (must be > 0)
/// * `amplitude` - Amplitude between 0.0 and 1.0
///
/// # Returns
/// A Uint8Array containing the complete WAV file that can be used in an HTML audio element
#[wasm_bindgen]
pub fn bezier_oscillator(
    frequency: f64,
    sample_rate: u32,
    control_points: Vec<f64>,
    duration: f64,
    amplitude: f64,
) -> Result<Vec<u8>, JsValue> {
    validate_oscillator_params(frequency, sample_rate, duration, amplitude)
        .map_err(|e| JsValue::from_str(&e))?;
    validate_control_points(&control_points).map_err(|e| JsValue::from_str(&e))?;

    let wave = BezierOscillator::new(frequency, amplitude, sample_rate, control_points)
        .map_err(|e| JsValue::from_str(&e))?;

    let total_samples = (duration * sample_rate as f64) as u32;
    let mut pcm_samples: Vec<i16> = Vec::with_capacity(total_samples as usize);

    for i in 0..total_samples {
        pcm_samples.push(wave.pcm_sample(i));
    }

    let wav_bytes = wav::to_bytes(&pcm_samples, sample_rate);
    Ok(wav_bytes)
}

/// Generates a sequence of sine wave notes as a complete WAV file byte array
///
/// # Arguments
/// * `bpm` - Beats per minute (must be > 0)
/// * `notes` - JavaScript array of note objects with structure:
///   ```javascript
///   [{
///     id: 0-11,        // Note ID (0=C, 1=C#, 2=D, etc.)
///     octave: 0-8,     // Octave number
///     beats: 1.0,      // Duration in beats (must be > 0)
///     amplitude: 0.8   // Amplitude 0.0-1.0
///   }]
///   ```
/// * `sample_rate` - Sample rate in Hz (typically 44100)
///
/// # Returns
/// A Uint8Array containing the complete WAV file that can be used in an HTML audio element
#[wasm_bindgen]
pub fn sine_orchestrator(bpm: u8, notes: JsValue, sample_rate: u32) -> Result<Vec<u8>, JsValue> {
    if bpm == 0 {
        return Err(JsValue::from_str("BPM must be greater than 0"));
    }

    let notes: Vec<Note> = serde_wasm_bindgen::from_value(notes)
        .map_err(|e| JsValue::from_str(&format!("Failed to parse notes: {}", e)))?;

    if notes.is_empty() {
        return Err(JsValue::from_str("At least one note is required"));
    }

    let orchestrator = SineOrchestrator { bpm, notes };

    let pcm_samples = orchestrator
        .pcm_samples(sample_rate)
        .map_err(|e| JsValue::from_str(&e))?;

    let wav_bytes = wav::to_bytes(&pcm_samples, sample_rate);
    Ok(wav_bytes)
}

/// Generates a sequence of bezier curve-based notes as a complete WAV file byte array
///
/// # Arguments
/// * `control_points` - Array of exactly 4 y-values between -1.0 and 1.0 defining the bezier curve
/// * `bpm` - Beats per minute (must be > 0)
/// * `notes` - JavaScript array of note objects with structure:
///   ```javascript
///   [{
///     id: 0-11,        // Note ID (0=C, 1=C#, 2=D, etc.)
///     octave: 0-8,     // Octave number
///     beats: 1.0,      // Duration in beats (must be > 0)
///     amplitude: 0.8   // Amplitude 0.0-1.0
///   }]
///   ```
/// * `sample_rate` - Sample rate in Hz (typically 44100)
///
/// # Returns
/// A Uint8Array containing the complete WAV file that can be used in an HTML audio element
#[wasm_bindgen]
pub fn bezier_orchestrator(
    control_points: Vec<f64>,
    bpm: u8,
    notes: JsValue,
    sample_rate: u32,
) -> Result<Vec<u8>, JsValue> {
    if bpm == 0 {
        return Err(JsValue::from_str("BPM must be greater than 0"));
    }

    validate_control_points(&control_points).map_err(|e| JsValue::from_str(&e))?;

    let notes: Vec<Note> = serde_wasm_bindgen::from_value(notes)
        .map_err(|e| JsValue::from_str(&format!("Failed to parse notes: {}", e)))?;

    if notes.is_empty() {
        return Err(JsValue::from_str("At least one note is required"));
    }

    let orchestrator = BezierOrchestrator {
        bpm,
        notes,
        control_points,
    };

    let pcm_samples = orchestrator
        .pcm_samples(sample_rate)
        .map_err(|e| JsValue::from_str(&e))?;

    let wav_bytes = wav::to_bytes(&pcm_samples, sample_rate);
    Ok(wav_bytes)
}
