use crate::oscillator::{BezierOscillator, SinOscillator};
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize)]
pub struct Note {
    pub id: u8,
    pub octave: u8,
    pub beats: f64,
    pub amplitude: f64,
}

impl Note {
    pub fn frequency(&self) -> Result<f64, String> {
        if self.id > 11 {
            return Err(format!(
                "Invalid note id: {}. Note id must be between 0 and 11",
                self.id
            ));
        }
        let multiplier =
            (2_f64).powf(((self.id as f64 - 9.0) + 12.0 * (self.octave as f64 - 4.0)) / 12.0);
        let frequency = 440.0 * multiplier;
        Ok(frequency)
    }

    pub fn validate(&self) -> Result<(), String> {
        if self.id > 11 {
            return Err(format!(
                "Invalid note id: {}. Note id must be between 0 and 11",
                self.id
            ));
        }
        if self.amplitude < 0.0 || self.amplitude > 1.0 {
            return Err(format!(
                "Invalid amplitude: {}. Amplitude must be between 0.0 and 1.0",
                self.amplitude
            ));
        }
        if self.beats <= 0.0 {
            return Err(format!(
                "Invalid beats: {}. Beats must be greater than 0",
                self.beats
            ));
        }
        Ok(())
    }
}

pub struct SineOrchestrator {
    pub bpm: u8, //beats per min
    pub notes: Vec<Note>,
}

impl SineOrchestrator {
    pub fn pcm_samples(&self, sample_rate: u32) -> Result<Vec<i16>, String> {
        let mut samples: Vec<i16> = Vec::new();
        let seconds_per_beat = 60.0 / self.bpm as f64;

        for note in &self.notes {
            note.validate()?;
            let wave = SinOscillator {
                amplitude: note.amplitude,
                frequency: note.frequency()?,
                sample_rate: sample_rate,
            };
            let duration = note.beats * seconds_per_beat;
            let samples_per_note = (duration * sample_rate as f64) as u32;
            for i in 0..samples_per_note {
                samples.push(wave.pcm_sample(i));
            }
        }
        Ok(samples)
    }
}

pub struct BezierOrchestrator {
    pub bpm: u8, //beats per min
    pub notes: Vec<Note>,
    pub control_points: Vec<f64>,
}

impl BezierOrchestrator {
    pub fn pcm_samples(&self, sample_rate: u32) -> Result<Vec<i16>, String> {
        let mut samples: Vec<i16> = Vec::new();
        let seconds_per_beat = 60.0 / self.bpm as f64;

        for note in &self.notes {
            note.validate()?;
            let wave = BezierOscillator::new(
                note.frequency()?,
                note.amplitude,
                sample_rate,
                self.control_points.clone(),
            )?;
            let duration = note.beats * seconds_per_beat;
            let samples_per_note = (duration * sample_rate as f64) as u32;
            for i in 0..samples_per_note {
                samples.push(wave.pcm_sample(i));
            }
        }
        Ok(samples)
    }
}
