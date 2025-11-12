import { useWaveStore } from "@/stores/wave.store";
import { useEffect, useRef, useState } from "react";

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
    <div className="w-full border border-red-500" ref={containerRef}>
      <svg width={containerWidth} height={100}>
        <path d={generatePathString()} stroke="black" fill="none" />
      </svg>
    </div>
  );
};
