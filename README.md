# 🎵 Orchestrator WASM - WebAssembly WAV Audio Synthesizer

A web-based WAV audio synthesizer built with Rust and WebAssembly that generates playable audio files from JSON music notation. This is the **WebAssembly version** of the [original Orchestrator CLI tool](https://github.com/sihilelh/orchestrator-rust), featuring **interactive Bezier curve waveform generation** and a modern web interface.

## 🎯 What This Does

```
JSON Input → Parse Notes → Calculate Frequencies → Generate Waveforms (Sine/Bezier) → PCM Encoding → WAV File
```

Takes musical notes described in JSON, calculates their frequencies using A440 equal temperament tuning, generates waveforms (sine waves or custom Bezier curves), converts them to PCM (Pulse Code Modulation) format, and writes everything to a proper WAV file with RIFF headers—all running in your browser via WebAssembly.

## ✨ Key Features

- **🎨 Bezier Curve Waveforms**: Design custom waveforms using interactive cubic Bezier curves—a unique feature not available in the CLI version
- **🌐 WebAssembly Performance**: Rust core compiled to WebAssembly for native-speed audio synthesis in the browser
- **🎹 Interactive Piano Roll**: Visual MIDI-style editor for composing melodies
- **📊 Real-time Visualization**: See your waveform patterns before generating audio
- **💾 JSON Compatibility**: Export and import JSON files compatible with the original CLI tool
- **🎵 Instant Playback**: Generate and play WAV files directly in your browser

## 🚀 Quick Start

### Prerequisites

- **Rust** (2024 edition or later) with `wasm32-unknown-unknown` target
- **Node.js** (v18 or later) and **pnpm**
- **wasm-pack** for building WebAssembly modules

### Installation

```bash
# Install wasm-pack (if not already installed)
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

# Install Rust WASM target
rustup target add wasm32-unknown-unknown

# Install pnpm (if not already installed)
npm install -g pnpm

# Install dependencies
pnpm install
```

### Build & Run

```bash
# Build the WebAssembly module
wasm-pack build --target web --out-dir pkg

# Start the development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

The web app will be available at `http://localhost:5173` (or the port Vite assigns).

## 📝 JSON Input Format

The JSON format is compatible with the original CLI tool, with additional support for Bezier control points:

```json
{
  "bpm": 130,
  "control_points": [0.5, -0.3, 0.2, -0.5],
  "notes": [
    { "id": 0, "beats": 1.0, "octave": 4, "amplitude": 0.8 },
    { "id": 2, "beats": 1.0, "octave": 4, "amplitude": 0.8 }
  ],
  "_x": [25.0, 75.0]
}
```

### Note ID Reference

Each note has a unique ID (0-11) representing the 12 semitones in an octave:

```
0  = C
1  = C♯ / D♭
2  = D
3  = D♯ / E♭
4  = E
5  = F
6  = F♯ / G♭
7  = G
8  = G♯ / A♭
9  = A
10 = A♯ / B♭
11 = B
```

### Parameters

- **`bpm`** (beats per minute): Tempo of the music
- **`id`**: Note ID from 0-11 (see table above)
- **`beats`**: Duration of the note in beats
- **`octave`**: Which octave (typically 0-8, where 4 is middle octave)
- **`amplitude`**: Volume (0.0 to 1.0, where 1.0 is maximum)
- **`control_points`**: Four y-values between -1.0 and 1.0 defining the Bezier curve (WebAssembly version only)
- **`_x`**: X-coordinates for control points (WebAssembly version only)

## 🎨 Bezier Curve Waveforms

This WebAssembly version introduces **custom waveform generation** using cubic Bezier curves. Unlike the CLI tool which only supports sine waves, you can now design complex waveforms by manipulating four control points:

- **Start Point & End Point**: Define the beginning and end of your waveform cycle
- **Control Points**: Two points that shape the curve between start and end

The Bezier curve defines one complete cycle that repeats at the frequency of each note, allowing you to create rich, complex timbres beyond simple sine waves.

### How It Works

The Bezier oscillator uses the cubic Bezier formula:

```
B(t) = (1-t)³P₀ + 3(1-t)²tP₁ + 3(1-t)t²P₂ + t³P₃
```

Where:

- `P₀` = start point (y-value)
- `P₁` = first control point (y-value)
- `P₂` = second control point (y-value)
- `P₃` = end point (y-value)
- `t` = phase (0.0 to 1.0) calculated from sample index and frequency

## 🧠 Key Concepts & Implementation

### 1. Frequency Calculation (Equal Temperament Tuning)

Western music uses the **A440** standard, where the note A4 (middle A) vibrates at exactly 440 Hz. All other notes are calculated using the **equal temperament** formula:

```
f = 440 × 2^((n - 9) / 12)
```

Where:

- `f` = frequency in Hz
- `n` = semitone offset from C4
- `440` = A4 frequency (standard tuning)
- `9` = A is the 9th semitone in the octave (counting from C=0)
- `12` = semitones per octave

**Example**: To find C4 (middle C):

- C is ID 0, which is 9 semitones below A4
- `n = 0 - 9 = -9`
- `f = 440 × 2^(-9/12) = 440 × 0.5946 ≈ 261.63 Hz`

For different octaves, we add `12 × (octave - 4)` to the semitone count:

```rust
let n = (note_id - 9) + 12 × (octave - 4)
let frequency = 440.0 * 2.0_f64.powf(n / 12.0)
```

### 2. Waveform Generation

#### Sine Wave Generation

Sound is vibrations, and pure musical tones can be represented as **sine waves**. A sine wave oscillates smoothly between -1 and +1.

The formula to generate a sample at any point in time:

```
sample(t) = amplitude × sin(2π × frequency × t)
```

Where:

- `t` = time in seconds = sample_index / sample_rate
- `2π` = one complete cycle (360 degrees in radians)
- `frequency` = how many cycles per second (Hz)
- `amplitude` = volume (0.0 to 1.0)

**In code**:

```rust
let t = sample_index as f64 / sample_rate as f64;
let sample = amplitude * (2.0 * PI * frequency * t).sin();
```

#### Bezier Curve Generation

The Bezier oscillator calculates the phase of the wave and maps it to a Bezier curve value:

```rust
let phase: f64 = ((sample_index as f64 * frequency) / sample_rate as f64).fract();
let bezier_value = calculate_bezier_value(phase);
let sample = bezier_value * amplitude;
```

### 3. PCM (Pulse Code Modulation)

Computers can't store continuous waveforms (-1.0 to +1.0), so we **digitize** them into discrete integer values. This is called **PCM encoding**.

**16-bit PCM** uses signed integers from **-32,767 to +32,767**:

| Waveform (float) | PCM (16-bit int) |
| ---------------- | ---------------- |
| 1.0              | +32,767          |
| 0.5              | +16,383          |
| 0.0              | 0                |
| -0.5             | -16,384          |
| -1.0             | -32,767          |

**Conversion formula**:

```rust
let float_sample = waveform_sample.clamp(-1.0, 1.0);
let pcm_value = (float_sample * 32767.0) as i16;
```

We **clamp** values to prevent distortion and overflow.

### 4. WAV File Format (RIFF/WAV)

A WAV file is a container format following the **RIFF** (Resource Interchange File Format) structure. It consists of **chunks** of data:

**Key calculations**:

- `byte_rate` = sample_rate × channels × (bits_per_sample / 8)
- `block_align` = channels × (bits_per_sample / 8)
- `data_size` = number_of_samples × (bits_per_sample / 8)
- `file_size` = 36 + data_size

All multi-byte integers are stored in **little-endian** format (least significant byte first).

## 🏗️ Project Architecture

### Directory Structure

```
orchestrator-wasm/
├── src/              # Rust source code
│   ├── lib.rs        # WebAssembly bindings
│   ├── orchestrator.rs  # Note frequency calculation & composition
│   ├── oscillator.rs    # Sine & Bezier waveform generators
│   └── wav.rs          # WAV file format encoding
├── web/              # React + TypeScript frontend
│   ├── src/
│   │   ├── pages/    # Route pages (Home, About, Playground, HowToUse)
│   │   ├── components/  # UI components
│   │   └── stores/    # Zustand state management
│   └── package.json
├── pkg/              # Generated WebAssembly package
└── Cargo.toml        # Rust dependencies
```

### Processing Pipeline

1. **JSON Input**: User provides composition via UI or JSON import
2. **Frequency Calculation**: Each note's frequency calculated using A440 equal temperament
3. **Waveform Generation**: Sine waves or Bezier curves generated per note
4. **PCM Encoding**: Floating-point samples converted to 16-bit integers
5. **WAV Encoding**: PCM samples written to RIFF/WAV format
6. **Browser Playback**: WAV file played via HTML5 audio element

### Module Breakdown

**`lib.rs`**: WebAssembly bindings

- Exposes `sine_oscillator()`, `bezier_oscillator()`, `sine_orchestrator()`, `bezier_orchestrator()`
- Validates input parameters
- Converts Rust errors to JavaScript values

**`orchestrator.rs`**: Music representation

- `Note` struct: Holds note data (id, octave, beats, amplitude)
- `Note::frequency()`: Implements equal temperament calculation
- `SineOrchestrator` & `BezierOrchestrator`: Convert entire composition to PCM

**`oscillator.rs`**: Digital signal processing

- `SinOscillator`: Generates sine wave samples
- `BezierOscillator`: Generates Bezier curve samples
- `.pcm_sample()`: Converts to 16-bit PCM with clamping

**`wav.rs`**: File format encoding

- Writes RIFF header (12 bytes)
- Writes fmt chunk (24 bytes)
- Writes data chunk header (8 bytes)
- Writes all PCM samples as little-endian bytes

**`web/src/`**: React frontend

- Interactive wave editor with Bezier curve manipulation
- Piano roll MIDI editor
- Real-time waveform visualization
- Audio player with download capability
- JSON export/import functionality

## 🔄 Differences from CLI Tool

| Feature             | CLI Tool          | WebAssembly Version        |
| ------------------- | ----------------- | -------------------------- |
| **Waveforms**       | Sine waves only   | Sine waves + Bezier curves |
| **Interface**       | Command-line      | Interactive web UI         |
| **Composition**     | JSON file editing | Visual piano roll editor   |
| **Waveform Design** | Not available     | Interactive Bezier editor  |
| **Visualization**   | Not available     | Real-time waveform preview |
| **Platform**        | Desktop (any OS)  | Browser (cross-platform)   |
| **Performance**     | Native Rust       | WebAssembly (near-native)  |

## 📚 Learn More

**Original CLI Tool**: [orchestrator-rust](https://github.com/sihilelh/orchestrator-rust)

**WAV Format**:

- [WAV Specification](http://soundfile.sapp.org/doc/WaveFormat/)
- [RIFF Format](https://en.wikipedia.org/wiki/Resource_Interchange_File_Format)

**Digital Audio**:

- [PCM Encoding](https://en.wikipedia.org/wiki/Pulse-code_modulation)
- [Sample Rate & Bit Depth](https://www.izotope.com/en/learn/digital-audio-basics-sample-rate-and-bit-depth.html)

**Music Theory**:

- [Equal Temperament](https://en.wikipedia.org/wiki/Equal_temperament)
- [Musical Note Frequencies](https://pages.mtu.edu/~suits/notefreqs.html)

**WebAssembly**:

- [wasm-bindgen](https://rustwasm.github.io/wasm-bindgen/)
- [WebAssembly Documentation](https://webassembly.org/)

## 🎓 What I Learned

- How to compile Rust to WebAssembly using `wasm-bindgen`
- Bridging Rust and JavaScript with type-safe bindings
- Interactive Bezier curve mathematics and waveform design
- Real-time audio generation in the browser
- React state management with Zustand
- Building modern web UIs with React, TypeScript, and Tailwind CSS
- All the fundamentals from the CLI tool (WAV format, PCM encoding, equal temperament)

## 🛠️ Possible Improvements

Want to contribute or experiment? Here are some ideas:

- Add support for more waveforms (square, sawtooth, triangle)
- Implement ADSR envelope (Attack, Decay, Sustain, Release)
- Support for chords (multiple simultaneous notes)
- Add effects (reverb, delay, filters)
- Stereo output support
- Real-time audio streaming (Web Audio API)
- MIDI file import/export
- Preset waveform library
- Undo/redo functionality
- Collaborative editing

## 📄 License

This is a learning project - feel free to use, modify, and learn from it!

---

**Made with 🦀 Rust + WebAssembly as an evolution of the original Orchestrator CLI tool**

**Original CLI Tool**: [orchestrator-rust](https://github.com/sihilelh/orchestrator-rust)
