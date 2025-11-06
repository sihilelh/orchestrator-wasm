# WASM Audio Generator Usage Guide

This document explains how to use the WASM audio generator functions in your JavaScript/TypeScript projects.

## Building the WASM Module

First, build the WASM module using wasm-pack:

```bash
wasm-pack build --target web
```

This will generate a `pkg` directory with the compiled WASM module and JavaScript bindings.

## JavaScript/TypeScript Usage

### Setup

```javascript
import init, {
  sine_oscillator,
  bezier_oscillator,
  sine_orchestrator,
  bezier_orchestrator
} from './pkg/orchestrator_wasm.js';

// Initialize the WASM module
await init();
```

### 1. Sine Oscillator

Generate a simple sine wave:

```javascript
try {
  // Generate a 440Hz sine wave (A4 note) for 2 seconds at 80% amplitude
  const wavBytes = sine_oscillator(
    440.0,      // frequency in Hz
    44100,      // sample rate
    2.0,        // duration in seconds
    0.8         // amplitude (0.0 - 1.0)
  );

  // Create an audio element
  const blob = new Blob([wavBytes], { type: 'audio/wav' });
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.play();

  // Clean up when done
  audio.onended = () => URL.revokeObjectURL(url);
} catch (error) {
  console.error('Error generating sine wave:', error);
}
```

### 2. Bezier Oscillator

Generate a wave with a custom bezier curve shape:

```javascript
try {
  // Generate a 220Hz wave with custom bezier shape
  const wavBytes = bezier_oscillator(
    220.0,                    // frequency in Hz
    44100,                    // sample rate
    [0.0, 0.5, -0.5, 0.0],   // 4 control points (y-values between -1.0 and 1.0)
    3.0,                      // duration in seconds
    1.0                       // amplitude
  );

  const blob = new Blob([wavBytes], { type: 'audio/wav' });
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.play();

  audio.onended = () => URL.revokeObjectURL(url);
} catch (error) {
  console.error('Error generating bezier wave:', error);
}
```

### 3. Sine Orchestrator

Play a sequence of musical notes with sine waves:

```javascript
try {
  // Define a sequence of notes
  const notes = [
    { id: 0, octave: 4, beats: 1.0, amplitude: 0.8 },  // C4 for 1 beat
    { id: 2, octave: 4, beats: 1.0, amplitude: 0.8 },  // D4 for 1 beat
    { id: 4, octave: 4, beats: 1.0, amplitude: 0.8 },  // E4 for 1 beat
    { id: 5, octave: 4, beats: 2.0, amplitude: 0.8 },  // F4 for 2 beats
  ];

  // Generate at 120 BPM
  const wavBytes = sine_orchestrator(120, notes);

  const blob = new Blob([wavBytes], { type: 'audio/wav' });
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.play();

  audio.onended = () => URL.revokeObjectURL(url);
} catch (error) {
  console.error('Error generating orchestration:', error);
}
```

### 4. Bezier Orchestrator

Play a sequence of musical notes with bezier curve waves:

```javascript
try {
  const controlPoints = [0.0, 0.7, -0.7, 0.0];  // Custom wave shape
  
  const notes = [
    { id: 0, octave: 3, beats: 0.5, amplitude: 0.9 },  // C3
    { id: 4, octave: 3, beats: 0.5, amplitude: 0.9 },  // E3
    { id: 7, octave: 3, beats: 0.5, amplitude: 0.9 },  // G3
    { id: 0, octave: 4, beats: 1.5, amplitude: 0.9 },  // C4
  ];

  const wavBytes = bezier_orchestrator(controlPoints, 140, notes);

  const blob = new Blob([wavBytes], { type: 'audio/wav' });
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.play();

  audio.onended = () => URL.revokeObjectURL(url);
} catch (error) {
  console.error('Error generating bezier orchestration:', error);
}
```

## Note Reference

Note IDs correspond to the chromatic scale:

| ID | Note | ID | Note |
|----|------|----|------|
| 0  | C    | 6  | F#/Gb|
| 1  | C#/Db| 7  | G    |
| 2  | D    | 8  | G#/Ab|
| 3  | D#/Eb| 9  | A    |
| 4  | E    | 10 | A#/Bb|
| 5  | F    | 11 | B    |

Octave 4 contains middle C (C4 = 261.63 Hz). A4 (id: 9, octave: 4) = 440 Hz.

## React Example

```tsx
import { useState } from 'react';
import init, { sine_oscillator } from './pkg/orchestrator_wasm.js';

function AudioPlayer() {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize WASM on mount
  useEffect(() => {
    init().then(() => setIsInitialized(true));
  }, []);

  const playNote = async (frequency: number) => {
    if (!isInitialized) return;

    try {
      // Clean up previous audio
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }

      const wavBytes = sine_oscillator(frequency, 44100, 1.0, 0.7);
      const blob = new Blob([wavBytes], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      
      setAudioUrl(url);
      
      const audio = new Audio(url);
      audio.play();
    } catch (error) {
      console.error('Error playing note:', error);
    }
  };

  return (
    <div>
      <button onClick={() => playNote(261.63)}>Play C4</button>
      <button onClick={() => playNote(293.66)}>Play D4</button>
      <button onClick={() => playNote(329.63)}>Play E4</button>
      <button onClick={() => playNote(349.23)}>Play F4</button>
    </div>
  );
}
```

## Error Handling

All functions return a `Result` type and will throw JavaScript errors if:

- Invalid parameters (negative frequency, amplitude > 1.0, etc.)
- Control points outside -1.0 to 1.0 range
- Wrong number of control points (must be exactly 4)
- Invalid note IDs (must be 0-11)
- Empty notes array
- BPM is 0

Always wrap calls in try-catch blocks for proper error handling.

## Performance Notes

- WAV files are generated in memory and can be large for long durations
- For real-time audio, consider generating shorter segments
- The sample rate of 44100 Hz is standard CD quality
- Each second of audio at 44100 Hz with 16-bit samples = ~88KB

## File Output Format

All functions return complete WAV files with:
- Format: PCM 16-bit
- Channels: Mono (1 channel)
- Sample Rate: 44100 Hz (or specified rate)
- Little-endian byte order

These files are ready to use in HTML5 `<audio>` elements or save to disk.

