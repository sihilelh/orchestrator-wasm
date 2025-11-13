import { Text } from "@/components/atoms/Text";

export const About = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Text as="h1" className="mb-6">
        About Orchestrator
      </Text>

      <div className="space-y-6">
        <div>
          <Text as="h2" className="mb-3 text-xl">
            The Origin Story
          </Text>
          <Text as="p" className="text-muted-foreground mb-4">
            Orchestrator began as a question one evening:{" "}
            <em>
              How does analog sound become the ones and zeros stored on my
              phone?
            </em>
            After years of working with TypeScript, JavaScript, and PHP, I
            needed a new challenge. I'd been learning Rust's theoretical
            concepts for over a week, and this became my first real project in
            the language.
          </Text>
          <Text as="p" className="text-muted-foreground mb-4">
            Audio synthesis requires precise control over bytes, sample rates,
            and binary formats—exactly where Rust excels. The original CLI tool
            was built in a single evening (about six to seven hours),
            implementing the complete pipeline from frequency calculation to PCM
            encoding to RIFF file format.
          </Text>
        </div>

        <div>
          <Text as="h2" className="mb-3 text-xl">
            The Original CLI Tool
          </Text>
          <Text as="p" className="text-muted-foreground mb-4">
            The first version of Orchestrator was a command-line tool that
            generated WAV files from JSON notation. It implemented the complete
            audio synthesis pipeline:
          </Text>
          <Text
            as="p"
            className="text-muted-foreground mb-2 font-mono text-sm bg-muted p-3 rounded"
          >
            JSON Input → Parse Notes → Calculate Frequencies → Generate Sine
            Waves → PCM Encoding → WAV File
          </Text>
          <Text as="p" className="text-muted-foreground mb-4">
            Using the A440 standard with equal temperament tuning (f = 440 ×
            2^(n-9)/12), it demonstrated how musical tuning isn't arbitrary—it's
            mathematically precise. The project taught me how digital audio
            actually works, from the Nyquist theorem to little-endian byte
            ordering in WAV files.
          </Text>
        </div>

        <div>
          <Text as="h2" className="mb-3 text-xl">
            This WebAssembly Version
          </Text>
          <Text as="p" className="text-muted-foreground mb-4">
            This web version extends the original CLI tool with new
            capabilities:
          </Text>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
            <li>
              <strong>Bezier Curve Waveforms:</strong> Beyond simple sine waves,
              you can now design custom waveforms using interactive cubic Bezier
              curves with four control points
            </li>
            <li>
              <strong>WebAssembly Implementation:</strong> The Rust core is
              compiled to WebAssembly, bringing native performance to the
              browser
            </li>
            <li>
              <strong>Interactive UI:</strong> Real-time wave editing, piano
              roll composition, and waveform visualization
            </li>
            <li>
              <strong>JSON Compatibility:</strong> Export and import JSON files
              that work with both this web version and the original CLI tool
            </li>
          </ul>
          <Text as="p" className="text-muted-foreground">
            The same mathematical precision remains—A440 tuning, 16-bit PCM
            encoding at 44.1 kHz sample rate, and proper RIFF/WAV file
            structure. But now you can experiment with waveforms visually and
            hear the results instantly in your browser.
          </Text>
        </div>

        <div>
          <Text as="h2" className="mb-3 text-xl">
            What This Actually Means
          </Text>
          <Text as="p" className="text-muted-foreground">
            We take everyday technology for granted. Listening to music on a
            phone seems trivial—tap an app, press play, sound emerges. But
            underneath lies decades of work by engineers who solved problems
            like "How do we represent continuous sound waves in discrete digital
            form" and "What byte ordering should we use for cross-platform
            compatibility?"
          </Text>
          <Text as="p" className="text-muted-foreground mt-4">
            The gap between wondering "how does this work" and actually knowing
            is smaller than it seems. The specifications for WAV files are
            publicly available. The mathematics of equal temperament tuning is
            well-documented. The tools (Rust, WebAssembly, free online
            resources) are accessible to anyone. What separates someone who
            wonders from someone who knows is simply the decision to find out.
          </Text>
        </div>

        <div className="pt-4 border-t">
          <Text as="p" className="text-muted-foreground text-sm">
            Orchestrator by @sihilelh — Building things that matter, one line of
            code at a time.
          </Text>
        </div>
      </div>
    </div>
  );
};
