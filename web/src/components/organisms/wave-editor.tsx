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
    document.addEventListener("mouseup", handleDragEnd);
    return () => {
      document.removeEventListener("mouseup", handleDragEnd);
    };
  }, [handleDragEnd]);

  const handleMoving = (event: React.MouseEvent, index: number) => {
    if (!isDragging) return;
    event.preventDefault();
    event.stopPropagation();

    const elementBounds = event.currentTarget.getBoundingClientRect();
    const relativeX = event.clientX - elementBounds.left;
    const relativeY = event.clientY - elementBounds.top;

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

  const handleDragStart = (event: React.MouseEvent, index: number) => {
    console.log("drag start", index);
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
    setDragIndex(index);
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Card className="w-full">
          <Card.Header>
            <Card.Title>Wave Editor</Card.Title>
            <Card.Description>
              Use this to edit the wave. You can drag the points to change the
              wave.
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <Text as={"p"}>
              This uses cubic bezier curve to generate the wave's shape. By
              dragging the points you can change the wave's shape and when
              generating the wave, the wave will be generated based on the
              points you dragged.
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
          <Card.Content className="flex items-center justify-center">
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
                fill="var(--primary)"
                onMouseDown={(event) => handleDragStart(event, 0)}
              />
              <circle
                cx={size}
                cy={endPoint.y}
                r={10}
                fill="var(--primary)"
                onMouseDown={(event) => handleDragStart(event, 1)}
              />
              <circle
                cx={controlPoint1.x}
                cy={controlPoint1.y}
                r={5}
                fill="var(--muted)"
                stroke="var(--primary)"
                onMouseDown={(event) => handleDragStart(event, 2)}
              />
              <circle
                cx={controlPoint2.x}
                cy={controlPoint2.y}
                r={5}
                fill="var(--muted)"
                stroke="var(--primary)"
                onMouseDown={(event) => handleDragStart(event, 3)}
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
