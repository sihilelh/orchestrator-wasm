import { useMIDIEditorStore } from "@/stores/midi-editor.store";
import { useWaveStore } from "@/stores/wave.store";
import initWasm, { bezier_orchestrator, init } from "orchestrator-wasm";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import murmurhash from "murmurhash-js";
import { useDebounce } from "@/hooks/useDebounce";
import { getClippedPathValues } from "@/utils/path";
import { Slider } from "@/components/atoms/Slider";
import { Button } from "@/components/atoms/Button";
import { Play, Pause, Square, RotateCw, Download } from "lucide-react";
import { Card } from "../atoms/Card";
import { trackAudioDownload } from "@/utils/analytics.utils";

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

  // Audio playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
    console.log(
      `[Player] Generating new audio due to changes hash:${noteHash}`
    );
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
    noteHash,
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

  // Handle audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
    };
  }, [audioUrl]);

  // Playback control functions
  const handlePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch((error) => {
        console.error("Error playing audio:", error);
      });
    }
  }, [isPlaying]);

  const handleStop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  const handleSeek = useCallback(
    (value: number[]) => {
      const audio = audioRef.current;
      if (!audio || !duration) return;

      const newTime = (value[0] / 100) * duration;
      audio.currentTime = newTime;
      setCurrentTime(newTime);
    },
    [duration]
  );

  // Format time helper
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle download
  const handleDownload = useCallback(() => {
    if (!audioUrl) return;

    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = `audio-${noteHash || "generated"}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    trackAudioDownload({
      duration,
    });
  }, [audioUrl, noteHash, duration]);

  // Handle force regenerate
  const handleForceRegenerate = useCallback(() => {
    generateAudio();
  }, [generateAudio]);

  return (
    <Card>
      <Card.Header>
        <Card.Title>Player</Card.Title>
        <Card.Description>
          Play your generated WAV audio file. Orchestrator synthesizes audio
          using the same pipeline as the original CLI tool: JSON notation →
          frequency calculation → waveform generation → PCM encoding → WAV file
          format.
        </Card.Description>
      </Card.Header>
      <Card.Content>
        {/* Hidden audio element for actual playback */}
        {audioUrl && (
          <audio
            ref={audioRef}
            src={audioUrl}
            onError={(e) => console.error("Audio error:", e)}
            className="hidden"
          />
        )}

        {/* Custom Player Controls */}
        {audioUrl ? (
          <div className="space-y-3">
            {/* Progress Slider */}
            <div className="space-y-1">
              <Slider
                value={duration > 0 ? [(currentTime / duration) * 100] : [0]}
                onValueChange={handleSeek}
                max={100}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-neutral-400">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Control Buttons */}
            <AudioControls
              isPlaying={isPlaying}
              isGenerating={isGenerating}
              onPlay={handlePlayPause}
              onStop={handleStop}
              onForceRegenerate={handleForceRegenerate}
              onDownload={handleDownload}
              audioUrl={audioUrl}
            />
            <div className="text-xs text-neutral-400">Hash: {noteHash}</div>
            <div className="text-xs text-neutral-400">
              Timeline: {timeline.length} notes
            </div>
          </div>
        ) : (
          <div className="text-xs text-red-400">
            Nothing to play yet. Tinker with the timeline and generate some
            audio!
          </div>
        )}

        {/* Status Messages */}
        {isGenerating && (
          <div className="text-xs text-neutral-400">Generating...</div>
        )}
        {hasPendingChanges && !isGenerating && (
          <div className="text-xs text-yellow-400">Changes pending...</div>
        )}
        {!wasmInitialized && (
          <div className="text-xs text-yellow-400">Initializing WASM...</div>
        )}
      </Card.Content>
    </Card>
  );
};

interface IAudioControlsProps {
  isPlaying: boolean;
  isGenerating: boolean;
  onPlay: () => void;
  onStop: () => void;
  onForceRegenerate: () => void;
  onDownload: () => void;
  audioUrl: string | null;
}
export const AudioControls = ({
  isPlaying,
  isGenerating,
  onPlay,
  onStop,
  onForceRegenerate,
  onDownload,
  audioUrl,
}: IAudioControlsProps) => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Button
        onClick={onPlay}
        disabled={!audioUrl || isGenerating}
        size="md"
        variant="default"
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>
      <Button
        onClick={onStop}
        disabled={!audioUrl || isGenerating || !isPlaying}
        size="md"
        variant="secondary"
      >
        <Square className="h-4 w-4" />
      </Button>
      <Button
        onClick={onForceRegenerate}
        disabled={isGenerating}
        size="md"
        variant="outline"
      >
        <RotateCw className={`h-4 w-4 ${isGenerating ? "animate-spin" : ""}`} />
      </Button>
      <Button
        onClick={onDownload}
        disabled={!audioUrl || isGenerating}
        size="md"
        variant="outline"
      >
        <Download className="h-4 w-4" />
      </Button>
    </div>
  );
};
