import { Text } from "@/components/atoms/Text";

export const HowToUse = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Text as="h1" className="mb-6">
        How to Use Orchestrator
      </Text>

      <div className="space-y-8">
        <div>
          <Text as="h2" className="mb-3 text-xl">
            Overview
          </Text>
          <Text as="p" className="text-muted-foreground mb-4">
            Orchestrator generates WAV audio files from JSON notation. You can
            compose melodies using the piano roll editor, design custom
            waveforms with Bezier curves, and export your creations as WAV files
            or JSON that's compatible with the original CLI tool.
          </Text>
        </div>

        <div>
          <Text as="h2" className="mb-3 text-xl">
            Wave Editor
          </Text>
          <Text as="p" className="text-muted-foreground mb-4">
            The Wave Editor lets you design custom waveforms using cubic Bezier
            curves. This is a unique feature of this WebAssembly version—the
            original CLI tool only supported sine waves.
          </Text>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
            <li>
              <strong>Start Point & End Point:</strong> The beginning and end of
              your waveform cycle (y-values between -1.0 and 1.0)
            </li>
            <li>
              <strong>Control Points:</strong> Two control points that shape the
              curve between start and end
            </li>
            <li>
              <strong>Drag to Edit:</strong> Click and drag any point to modify
              the waveform shape in real-time
            </li>
          </ul>
          <Text as="p" className="text-muted-foreground">
            The waveform you design will be used for all notes in your
            composition when using the Bezier orchestrator. You can preview the
            repeating pattern in the Wave Visualize panel.
          </Text>
        </div>

        <div>
          <Text as="h2" className="mb-3 text-xl">
            Piano Roll Editor
          </Text>
          <Text as="p" className="text-muted-foreground mb-4">
            Compose your melody by adding notes to the timeline:
          </Text>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
            <li>
              <strong>Note ID:</strong> 0-11 representing C, C#, D, D#, E, F,
              F#, G, G#, A, A#, B
            </li>
            <li>
              <strong>Octave:</strong> 0-8 (4 is middle C, A4 = 440 Hz)
            </li>
            <li>
              <strong>Beats:</strong> Duration of the note in beats (relative to
              BPM)
            </li>
            <li>
              <strong>Amplitude:</strong> Volume from 0.0 to 1.0
            </li>
          </ul>
          <Text as="p" className="text-muted-foreground">
            Notes are tuned using the A440 standard with equal temperament: f =
            440 × 2^(n-9)/12, where n is the semitone offset from C4. This
            ensures your compositions sound correct and can be played alongside
            other instruments.
          </Text>
        </div>

        <div>
          <Text as="h2" className="mb-3 text-xl">
            Player & Export
          </Text>
          <Text as="p" className="text-muted-foreground mb-4">
            Once you've composed your melody:
          </Text>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
            <li>
              <strong>Generate Audio:</strong> Click play to generate and listen
              to your composition
            </li>
            <li>
              <strong>Download WAV:</strong> Export your audio as a standard WAV
              file (16-bit PCM, 44.1 kHz)
            </li>
            <li>
              <strong>Export JSON:</strong> Save your composition as JSON that
              works with both this web version and the CLI tool
            </li>
            <li>
              <strong>Import JSON:</strong> Load compositions created in this
              app or exported from the CLI tool
            </li>
          </ul>
        </div>

        <div>
          <Text as="h2" className="mb-3 text-xl">
            JSON Format
          </Text>
          <Text as="p" className="text-muted-foreground mb-4">
            The JSON format is compatible with the original CLI tool:
          </Text>
          <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
            {`{
  "bpm": 120,
  "control_points": [0.5, -0.3, 0.2, -0.5],
  "notes": [
    {
      "id": 0,
      "octave": 4,
      "beats": 1.0,
      "amplitude": 0.8
    }
  ],
  "_x": [25.0, 75.0]
}`}
          </pre>
          <Text as="p" className="text-muted-foreground mt-4">
            <strong>control_points:</strong> Four y-values for the Bezier curve
            (only used in web version)
            <br />
            <strong>notes:</strong> Array of note objects with id, octave,
            beats, and amplitude
            <br />
            <strong>_x:</strong> X-coordinates for control points (web version
            only)
          </Text>
        </div>

        <div>
          <Text as="h2" className="mb-3 text-xl">
            Technical Details
          </Text>
          <Text as="p" className="text-muted-foreground mb-4">
            Orchestrator generates audio using:
          </Text>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>
              <strong>Sample Rate:</strong> 44.1 kHz (captures frequencies up to
              22.05 kHz, beyond human hearing)
            </li>
            <li>
              <strong>Bit Depth:</strong> 16-bit PCM (65,536 possible values per
              sample)
            </li>
            <li>
              <strong>Format:</strong> Standard RIFF/WAV with little-endian byte
              ordering
            </li>
            <li>
              <strong>Channels:</strong> Mono (single channel)
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
