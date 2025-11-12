import { useWaveStore } from "@/stores/wave.store";
import { getClippedPathValues } from "@/utils/path";
import { useEffect, useCallback } from "react";

export const WaveEditor = () => {
  const {
    startPoint,
    endPoint,
    controlPoint1,
    controlPoint2,
    isDragging,
    dragIndex,
    size,
    setStartPoint,
    setEndPoint,
    setControlPoint1,
    setControlPoint2,
    setIsDragging,
    setDragIndex,
  } = useWaveStore();

  const handleDragEnd = useCallback(() => {
    console.log("drag end");
    setIsDragging(false);
    setDragIndex(-1);
  }, [setIsDragging, setDragIndex]);

  useEffect(() => {
    document.addEventListener("mouseup", handleDragEnd);
    return () => {
      document.removeEventListener("mouseup", handleDragEnd);
    };
  }, [handleDragEnd]);

  const handleMoving = (event: React.MouseEvent, index: number) => {
    if (!isDragging) return;
    event.preventDefault();
    event.stopPropagation();

    // Clip the x value to the size
    const x =
      event.clientX > size ? size : event.clientX < 0 ? 0 : event.clientX;

    // Clip the y value to the size
    const y =
      event.clientY > size ? size : event.clientY < 0 ? 0 : event.clientY;

    switch (index) {
      case 0:
        setStartPoint({ y });
        break;
      case 1:
        setEndPoint({ y });
        break;
      case 2:
        setControlPoint1({ x, y });
        break;
      case 3:
        setControlPoint2({ x, y });
        break;
    }
  };

  const handleDragStart = (event: React.MouseEvent, index: number) => {
    console.log("drag start", index);
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
    setDragIndex(index);
  };

  return (
    <div>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        onMouseMove={(event) => handleMoving(event, dragIndex)}
      >
        <circle
          cx={0}
          cy={startPoint.y}
          r={10}
          fill="red"
          onMouseDown={(event) => handleDragStart(event, 0)}
        />
        <circle
          cx={size}
          cy={endPoint.y}
          r={10}
          fill="blue"
          onMouseDown={(event) => handleDragStart(event, 1)}
        />
        <circle
          cx={controlPoint1.x}
          cy={controlPoint1.y}
          r={5}
          fill="green"
          onMouseDown={(event) => handleDragStart(event, 2)}
        />
        <circle
          cx={controlPoint2.x}
          cy={controlPoint2.y}
          r={5}
          fill="green"
          onMouseDown={(event) => handleDragStart(event, 3)}
        />
        {/* Cubic Bezier Curve */}
        <path
          d={`M 0 ${startPoint.y} C ${controlPoint1.x} ${controlPoint1.y} ${controlPoint2.x} ${controlPoint2.y} ${size} ${endPoint.y}`}
          stroke="black"
          fill="none"
        />
      </svg>
      {Object.entries(
        getClippedPathValues({
          startPoint,
          endPoint,
          controlPoint1,
          controlPoint2,
          size: { width: size, height: size },
        })
      ).map(([key, value]) => (
        <div key={key}>
          {key}: {JSON.stringify(value)}
        </div>
      ))}
    </div>
  );
};
