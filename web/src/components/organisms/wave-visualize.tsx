import { useWaveStore } from "@/stores/wave.store";
import { useEffect, useRef, useState } from "react";
import { Card } from "../atoms/Card";

export const WaveVisualize = () => {
  const { startPoint, endPoint, controlPoint1, controlPoint2, size } =
    useWaveStore();

  const [containerWidth, setContainerWidth] = useState<number>(0);
  const containerHeight = 100;
  const divideRatioX = size / containerHeight;
  const divideRatioY = size / containerHeight;

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.clientWidth);
    }
  }, [containerRef]);

  const generatePathString = () => {
    const generateSingleWave = (lastX: number) => {
      const sp = { x: lastX, y: startPoint.y / divideRatioY };
      const cp1 = {
        x: lastX + controlPoint1.x / divideRatioX,
        y: controlPoint1.y / divideRatioY,
      };
      const cp2 = {
        x: lastX + controlPoint2.x / divideRatioX,
        y: controlPoint2.y / divideRatioY,
      };
      const ep = { x: lastX + containerHeight, y: endPoint.y / divideRatioY };

      return `M ${sp.x} ${sp.y} C ${cp1.x} ${cp1.y} ${cp2.x} ${cp2.y} ${ep.x} ${
        ep.y
      } M ${ep.x} ${ep.y} L ${sp.x + containerHeight} ${sp.y}`;
    };

    let lastX = 0;
    const renderLimit = 10;
    let singlePathString = "";

    for (let i = 0; i < renderLimit; i++) {
      singlePathString += generateSingleWave(lastX);
      lastX += containerHeight;
    }

    return singlePathString;
  };

  return (
    <Card className="w-full">
      <Card.Header>
        <Card.Title>Wave Visualize</Card.Title>
        <Card.Description>
          Preview how your Bezier curve waveform repeats across multiple cycles.
          This shows the shape that will be used to generate audio for each note
          in your composition.
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <div className="w-full" ref={containerRef}>
          <svg width={containerWidth} height={100}>
            <path
              d={generatePathString()}
              stroke="var(--primary)"
              fill="none"
            />
            {Array.from({ length: 10 }).map((_, index) => (
              <path
                key={index}
                d={`M ${index * containerHeight} 0 L ${
                  index * containerHeight
                } ${containerHeight}`}
                stroke="var(--primary)"
                fill="none"
                opacity={0.1}
              />
            ))}
            {Array.from({ length: 5 }).map((_, index) => (
              <path
                key={index}
                d={`M 0 ${index * (containerHeight / 4)} L 800 ${
                  index * (containerHeight / 4)
                }`}
                stroke="var(--primary)"
                fill="none"
                opacity={0.1}
              />
            ))}
          </svg>
        </div>
      </Card.Content>
    </Card>
  );
};
