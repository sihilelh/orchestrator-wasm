# CLI to WASM Migration Summary

This document summarizes the changes made to convert the orchestrator from a CLI tool to a WASM library.

## Files Modified

### 1. `Cargo.toml`
**Changes:**
- Added `serde-wasm-bindgen = "0.6"` for JavaScript ↔ Rust data conversion
- Added `console_error_panic_hook = "0.1"` for better error messages in browser console
- Removed `serde_json` (no longer needed for WASM)

### 2. `src/wav.rs`
**Changes:**
- Added new `to_bytes()` function that returns `Vec<u8>` containing complete WAV file
- Kept original `write()` function for potential future use
- Same WAV format: 16-bit PCM, mono, little-endian

### 3. `src/orchestrator.rs`
**Changes:**
- Made `Note` struct fields public: `id`, `octave`, `beats`, `amplitude`
- Added `Serialize` derive to `Note` for JavaScript interop
- Made `SineOrchestrator` and `BezierOrchestrator` structs public
- Made all struct fields public
- **Enhanced Error Handling:**
  - Changed `Note::frequency()` to return `Result<f64, String>`
  - Added `Note::validate()` method for parameter validation
  - Changed `SineOrchestrator::pcm_samples()` to return `Result<Vec<i16>, String>`
  - Changed `BezierOrchestrator::pcm_samples()` to return `Result<Vec<i16>, String>`
  - Changed `Orchestrator::pcm_samples()` to return `Result<Vec<i16>, String>`
  - Replaced all `panic!()` calls with proper error returns

### 4. `src/oscillator.rs`
**Changes:**
- **Enhanced Error Handling:**
  - Changed `BezierOscillator::new()` to return `Result<Self, String>`
  - Added validation for frequency (must be > 0)
  - Added validation for amplitude (must be 0.0-1.0)
  - Added validation for sample_rate (must be > 0)
  - Replaced all `panic!()` calls with descriptive error messages

### 5. `src/lib.rs` (NEW)
**Created WASM entry point with 4 exported functions:**

1. **`sine_oscillator(frequency, sample_rate, duration, amplitude)`**
   - Generates a single sine wave
   - Returns `Result<Vec<u8>, JsValue>` with complete WAV file

2. **`bezier_oscillator(frequency, sample_rate, control_points, duration, amplitude)`**
   - Generates a single bezier curve wave
   - Requires exactly 4 control points between -1.0 and 1.0
   - Returns `Result<Vec<u8>, JsValue>` with complete WAV file

3. **`sine_orchestrator(bpm, notes)`**
   - Generates sequence of sine wave notes
   - Accepts JavaScript array of note objects via `JsValue`
   - Returns `Result<Vec<u8>, JsValue>` with complete WAV file

4. **`bezier_orchestrator(control_points, bpm, notes)`**
   - Generates sequence of bezier curve notes
   - Accepts JavaScript array of note objects via `JsValue`
   - Returns `Result<Vec<u8>, JsValue>` with complete WAV file

**Additional features:**
- `init()` function that sets up panic hook for better debugging
- Comprehensive parameter validation with descriptive error messages
- Helper functions for validation
- Detailed documentation comments for each function

## Files Removed

### 1. `src/main.rs`
- CLI entry point - no longer needed for WASM library

### 2. `src/cli.rs`
- CLI argument parsing and file I/O - not applicable to WASM

## Error Handling Improvements

All functions now properly validate inputs and return descriptive errors instead of panicking:

### Oscillator Validation
- Frequency must be > 0
- Amplitude must be between 0.0 and 1.0
- Sample rate must be > 0
- Duration must be > 0
- Control points must be exactly 4 values between -1.0 and 1.0

### Note Validation
- Note ID must be between 0 and 11
- Amplitude must be between 0.0 and 1.0
- Beats must be > 0

### Orchestrator Validation
- BPM must be > 0
- At least one note is required
- All notes must pass validation

## Building the WASM Module

```bash
# Install wasm-pack if not already installed
cargo install wasm-pack

# Build for web
wasm-pack build --target web

# Build for Node.js
wasm-pack build --target nodejs

# Build for bundlers (webpack, rollup, etc.)
wasm-pack build --target bundler
```

## Output

The `pkg` directory will contain:
- `orchestrator_wasm_bg.wasm` - The compiled WebAssembly module
- `orchestrator_wasm.js` - JavaScript bindings
- `orchestrator_wasm.d.ts` - TypeScript definitions
- `package.json` - NPM package metadata

## Usage in JavaScript

All functions return `Uint8Array` containing complete WAV files that can be:
1. Used directly in `<audio>` elements via Blob URLs
2. Saved to disk in Node.js
3. Sent over network
4. Processed further in Web Audio API

See `WASM_USAGE.md` for detailed usage examples.

## Key Architecture Changes

### Before (CLI):
```
Input JSON file → Parse → Generate PCM → Write WAV file to disk
```

### After (WASM):
```
JavaScript objects → WASM functions → Generate PCM → Return WAV bytes → JavaScript
```

## Breaking Changes from CLI

1. No file I/O - everything happens in memory
2. Sample rate is fixed at 44100 Hz in orchestrator functions
3. No JSON file input - data comes directly from JavaScript
4. All errors are returned as JavaScript exceptions instead of panicking

## Compatibility

- Works in all modern browsers with WebAssembly support
- Compatible with Node.js (with appropriate wasm-pack target)
- Can be used with React, Vue, Svelte, Angular, etc.
- TypeScript definitions included for type safety

