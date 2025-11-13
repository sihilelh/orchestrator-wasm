import { useWaveStore } from "@/stores/wave.store";
import React, { useEffect, useCallback } from "react";
import { Card } from "../atoms/Card";
import { Text } from "../atoms/Text";
import { Badge } from "../atoms/Badge";

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
    const handleEnd = () => handleDragEnd();
    document.addEventListener("mouseup", handleEnd);
    document.addEventListener("touchend", handleEnd);
    return () => {
      document.removeEventListener("mouseup", handleEnd);
      document.removeEventListener("touchend", handleEnd);
    };
  }, [handleDragEnd]);

  const handleMoving = (
    event: React.MouseEvent | React.TouchEvent,
    index: number
  ) => {
    if (!isDragging) return;
    event.preventDefault();
    event.stopPropagation();

    const clientX =
      "touches" in event ? event.touches[0]?.clientX ?? 0 : event.clientX;
    const clientY =
      "touches" in event ? event.touches[0]?.clientY ?? 0 : event.clientY;

    const elementBounds = event.currentTarget.getBoundingClientRect();
    const relativeX = clientX - elementBounds.left;
    const relativeY = clientY - elementBounds.top;

    // Clip the x value to the size
    const x = relativeX > size ? size : relativeX < 0 ? 0 : relativeX;

    // Clip the y value to the size
    const y = relativeY > size ? size : relativeY < 0 ? 0 : relativeY;

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

  const handleDragStart = (
    event: React.MouseEvent | React.TouchEvent,
    index: number
  ) => {
    console.log("drag start", index);
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
    setDragIndex(index);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Card className="w-full">
          <Card.Header>
            <Card.Title>Wave Editor</Card.Title>
            <Card.Description>
              Design custom waveforms using cubic Bezier curves. This feature is
              unique to the WebAssembly version—the original CLI tool only
              supported sine waves.
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <Text as={"p"}>
              Drag the four control points to shape your waveform. The Bezier
              curve defines one complete cycle of your wave, which repeats at
              the frequency of each note. This allows you to create rich,
              complex timbres beyond simple sine waves.
            </Text>
            <br />
            <div className="grid grid-cols-1 gap-2">
              <Badge>
                Start Point: ({startPoint.y.toFixed(2)},{" "}
                {startPoint.x.toFixed(2)})
              </Badge>
              <Badge>
                End Point: ({endPoint.y.toFixed(2)}, {endPoint.x.toFixed(2)})
              </Badge>
              <Badge>
                Control Point 1: ({controlPoint1.x.toFixed(2)},{" "}
                {controlPoint1.y.toFixed(2)})
              </Badge>
              <Badge>
                Control Point 2: ({controlPoint2.x.toFixed(2)},{" "}
                {controlPoint2.y.toFixed(2)})
              </Badge>
            </div>
          </Card.Content>
        </Card>
      </div>
      <div>
        <Card className="w-full">
          <Card.Content className="flex items-center justify-center p-2 sm:p-4">
            <svg
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              onMouseMove={(event) => handleMoving(event, dragIndex)}
              onTouchMove={(event) => handleMoving(event, dragIndex)}
              style={{ touchAction: "none", maxWidth: "100%", height: "auto" }}
              className="w-full max-w-full"
            >
              <circle
                cx={0}
                cy={startPoint.y}
                r={10}
                fill="var(--primary)"
                onMouseDown={(event) => handleDragStart(event, 0)}
                onTouchStart={(event) => handleDragStart(event, 0)}
              />
              <circle
                cx={size}
                cy={endPoint.y}
                r={10}
                fill="var(--primary)"
                onMouseDown={(event) => handleDragStart(event, 1)}
                onTouchStart={(event) => handleDragStart(event, 1)}
              />
              <circle
                cx={controlPoint1.x}
                cy={controlPoint1.y}
                r={5}
                fill="var(--muted)"
                stroke="var(--primary)"
                onMouseDown={(event) => handleDragStart(event, 2)}
                onTouchStart={(event) => handleDragStart(event, 2)}
              />
              <circle
                cx={controlPoint2.x}
                cy={controlPoint2.y}
                r={5}
                fill="var(--muted)"
                stroke="var(--primary)"
                onMouseDown={(event) => handleDragStart(event, 3)}
                onTouchStart={(event) => handleDragStart(event, 3)}
              />
              {/* Cubic Bezier Curve */}
              <path
                d={`M 0 ${startPoint.y} C ${controlPoint1.x} ${controlPoint1.y} ${controlPoint2.x} ${controlPoint2.y} ${size} ${endPoint.y}`}
                stroke="var(--primary)"
                fill="none"
              />
              {/* Vertical grid paths  */}
              {Array.from({ length: 11 }).map((_, index) => (
                <path
                  key={index}
                  d={`M ${index * (size / 10)} ${size} L ${
                    index * (size / 10)
                  } ${0}`}
                  stroke="var(--primary)"
                  opacity={0.1}
                  fill="none"
                />
              ))}
              {/* Horizontal grid paths  */}
              {Array.from({ length: 11 }).map((_, index) => (
                <path
                  key={index}
                  d={`M ${0} ${index * (size / 10)} L ${size} ${
                    index * (size / 10)
                  }`}
                  stroke="var(--primary)"
                  opacity={0.1}
                  fill="none"
                />
              ))}
            </svg>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
};
