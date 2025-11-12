import { useMIDIEditorStore } from "@/stores/midi-editor.store";
import { useWaveStore } from "@/stores/wave.store";
import initWasm, { bezier_orchestrator, init } from "orchestrator-wasm";
import { useCallback, useEffect, useMemo, useState } from "react";
import murmurhash from "murmurhash-js";
import { useDebounce } from "@/hooks/useDebounce";
import { getClippedPathValues } from "@/utils/path";

export const Player = () => {
  // Subscribe to all relevant state from MIDI store
  const { timeline, bpm, sampleRate } = useMIDIEditorStore();

  // Subscribe to all relevant state from wave store
  const { startPoint, endPoint, controlPoint1, controlPoint2, size } =
    useWaveStore();

  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [noteHash, setNoteHash] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [wasmInitialized, setWasmInitialized] = useState<boolean>(false);

  // Create a dependency object for values that need debouncing (exclude timeline/notes)
  const debounceableDependencies = useMemo(
    () => ({
      bpm,
      sampleRate,
      startPointY: startPoint.y,
      endPointY: endPoint.y,
      controlPoint1Y: controlPoint1.y,
      controlPoint2Y: controlPoint2.y,
    }),
    [
      bpm,
      sampleRate,
      startPoint.y,
      endPoint.y,
      controlPoint1.y,
      controlPoint2.y,
    ]
  );

  // Debounce only the control points, BPM, and sample rate (not notes)
  const debouncedValues = useDebounce(debounceableDependencies, 500);

  // Check if there are pending changes (current values differ from debounced values)
  // Note: timeline changes are excluded from this check since they're not debounced
  const hasPendingChanges = useMemo(() => {
    return (
      debounceableDependencies.bpm !== debouncedValues.bpm ||
      debounceableDependencies.sampleRate !== debouncedValues.sampleRate ||
      debounceableDependencies.startPointY !== debouncedValues.startPointY ||
      debounceableDependencies.endPointY !== debouncedValues.endPointY ||
      debounceableDependencies.controlPoint1Y !==
        debouncedValues.controlPoint1Y ||
      debounceableDependencies.controlPoint2Y !== debouncedValues.controlPoint2Y
    );
  }, [debounceableDependencies, debouncedValues]);

  // Initialize WASM module once on mount
  useEffect(() => {
    const initializeWasm = async () => {
      if (!wasmInitialized) {
        try {
          await initWasm();
          init(); // Initialize panic hook
          setWasmInitialized(true);
        } catch (error) {
          console.error("Failed to initialize WASM:", error);
        }
      }
    };
    initializeWasm();
  }, [wasmInitialized]);

  const generateAudio = useCallback(async () => {
    if (!wasmInitialized) {
      return;
    }

    setIsGenerating(true);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    try {
      // Use immediate timeline (not debounced) and debounced values for other params
      const notes = timeline.map((note) => ({
        id: note.noteId,
        octave: note.octave,
        beats: note.duration,
        amplitude: note.amplitude,
      }));

      // Get clipped path values using debounced Y values
      // Note: We still need current X values for control points from the store
      const paths = getClippedPathValues({
        startPoint: { y: debouncedValues.startPointY },
        endPoint: { y: debouncedValues.endPointY },
        controlPoint1: {
          x: controlPoint1.x,
          y: debouncedValues.controlPoint1Y,
        },
        controlPoint2: {
          x: controlPoint2.x,
          y: debouncedValues.controlPoint2Y,
        },
        size: { width: size, height: size },
      });

      const bezierOscillator = bezier_orchestrator(
        new Float64Array([
          paths.startPoint.y,
          paths.controlPoint1.y,
          paths.controlPoint2.y,
          paths.endPoint.y,
        ]),
        debouncedValues.bpm,
        notes,
        debouncedValues.sampleRate
      );
      const blob = new Blob([new Uint8Array(bezierOscillator)], {
        type: "audio/wav",
      });
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
    } catch (error) {
      console.error("Error generating audio:", error);
    } finally {
      setIsGenerating(false);
    }
  }, [
    wasmInitialized,
    audioUrl,
    timeline,
    debouncedValues,
    controlPoint1.x,
    controlPoint2.x,
    size,
  ]);

  // Generate audio when timeline changes immediately, or when debounced values change
  useEffect(() => {
    if (!wasmInitialized) {
      return;
    }

    // Create a hash using immediate timeline and debounced values for other params
    const hashInput = JSON.stringify({
      params: {
        bpm: debouncedValues.bpm,
        sampleRate: debouncedValues.sampleRate,
        notes: timeline.map((note) => ({
          id: note.noteId,
          octave: note.octave,
          beats: note.duration,
          amplitude: note.amplitude,
        })),
      },
      paths: {
        startY: debouncedValues.startPointY,
        endY: debouncedValues.endPointY,
        cp1Y: debouncedValues.controlPoint1Y,
        cp2Y: debouncedValues.controlPoint2Y,
      },
    });
    const hash = murmurhash.murmur3(hashInput, 0);

    // Only regenerate if hash has changed (or if it's the first time)
    if (noteHash === null || hash !== noteHash) {
      setNoteHash(hash);
      generateAudio();
    }
  }, [timeline, debouncedValues, noteHash, generateAudio, wasmInitialized]);

  return (
    <div className="border border-blue-500 h-24">
      {audioUrl ? (
        <audio
          src={audioUrl}
          controls
          className="w-full"
          onError={(e) => console.error("Audio error:", e)}
        />
      ) : (
        <div className="text-xs text-red-400">No audio URL</div>
      )}
      {isGenerating && (
        <div className="text-xs text-neutral-400">Generating...</div>
      )}
      {hasPendingChanges && !isGenerating && (
        <div className="text-xs text-yellow-400">Changes pending...</div>
      )}
      <div className="text-xs text-neutral-400">Hash: {noteHash}</div>
      <div className="text-xs text-neutral-400">
        Timeline: {timeline.length} notes
      </div>
      {!wasmInitialized && (
        <div className="text-xs text-yellow-400">Initializing WASM...</div>
      )}
    </div>
  );
};
