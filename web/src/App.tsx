import { useEffect, useState } from "react";
import "./App.css";
import { getClippedPathValues } from "./utils/path";
import { Test } from "./test";

function App() {
  const [startPoint, setStartPoint] = useState<{ y: number }>({
    y: 0,
  });
  const [endPoint, setEndPoint] = useState<{ y: number }>({
    y: 0,
  });
  const [controlPoint1, setControlPoint1] = useState<{ x: number; y: number }>({
    x: 100,
    y: 100,
  });
  const [controlPoint2, setControlPoint2] = useState<{ x: number; y: number }>({
    x: 200,
    y: 200,
  });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragIndex, setDragIndex] = useState<number>(-1);
  const [size, setSize] = useState<{ width: number; height: number }>({
    width: 500,
    height: 500,
  });

  useEffect(() => {
    document.addEventListener("mouseup", handleDragEnd);
    return () => {
      document.removeEventListener("mouseup", handleDragEnd);
    };
  }, []);

  const handleMoving = (event: React.MouseEvent, index: number) => {
    if (!isDragging) return;
    event.preventDefault();
    event.stopPropagation();
    // Clip the x value to the width of the svg
    const x =
      event.clientX > size.width
        ? size.width
        : event.clientX < 0
        ? 0
        : event.clientX;
    // Clip the y value to the height of the svg
    const y =
      event.clientY > size.height
        ? size.height
        : event.clientY < 0
        ? 0
        : event.clientY;

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

  const handleDragEnd = () => {
    console.log("drag end");
    setIsDragging(false);
    setDragIndex(-1);
  };

  return (
    <div>
      <svg
        width={size.width}
        height={size.height}
        viewBox={`0 0 ${size.width} ${size.height}`}
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
          cx={size.width}
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
          d={`M 0 ${startPoint.y} C 0 ${controlPoint1.y} ${controlPoint2.x} ${controlPoint2.y} ${size.width} ${endPoint.y}`}
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
          size,
        })
      ).map(([key, value]) => (
        <div key={key}>
          {key}: {JSON.stringify(value)}
        </div>
      ))}
      <Test
        getPaths={() => {
          return getClippedPathValues({
            startPoint,
            endPoint,
            controlPoint1,
            controlPoint2,
            size,
          });
        }}
      />
    </div>
  );
}

export default App;
