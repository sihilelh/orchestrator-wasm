import { useState } from "react";
import init, { bezier_oscillator } from "orchestrator-wasm";
import type { ClippedPathValues } from "./utils/path";

export const Test = ({ getPaths }: { getPaths: () => ClippedPathValues }) => {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const generateAudio = async () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    await init();
    const paths = getPaths();
    const bezierOscillator = bezier_oscillator(
      440,
      44100,
      new Float64Array([
        paths.startPoint.y,
        paths.controlPoint1.y,
        paths.controlPoint2.y,
        paths.endPoint.y,
      ]),
      1.0,
      0.8
    );
    const blob = new Blob([new Uint8Array(bezierOscillator)], {
      type: "audio/wav",
    });
    const url = URL.createObjectURL(blob);
    setAudioUrl(url);
  };
  return (
    <>
      <button onClick={generateAudio}>Generate Audio</button>
      {audioUrl && (
        <>
          <audio src={audioUrl} controls />
          <button
            onClick={() => {
              URL.revokeObjectURL(audioUrl);
              setAudioUrl(null);
            }}
          >
            Stop
          </button>
        </>
      )}
    </>
  );
};
