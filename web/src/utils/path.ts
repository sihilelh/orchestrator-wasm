import { useWaveStore } from "@/stores/wave.store";

interface PathValues {
  startPoint: { y: number };
  endPoint: { y: number };
  controlPoint1: { x: number; y: number };
  controlPoint2: { x: number; y: number };
  size: { width: number; height: number };
}

export interface ClippedPathValues {
  startPoint: { y: number };
  endPoint: { y: number };
  controlPoint1: { x: number; y: number };
  controlPoint2: { x: number; y: number };
}

// This will invert y axis and return the point values as if the path is drawn between -1 and 1
export const getClippedPathValues = (path: PathValues): ClippedPathValues => {
  const { width, height } = path.size;

  // For x, normalize from [0,width] to [0,1]
  const normalizeX = (x: number) => parseFloat((x / width).toFixed(3));
  // For y, flip, then normalize from [0,height] to [-1,1]
  const normalizeY = (y: number) =>
    parseFloat((((height - y) / height) * 2 - 1).toFixed(3));

  return {
    startPoint: {
      y: normalizeY(path.startPoint.y),
    },
    endPoint: {
      y: normalizeY(path.endPoint.y),
    },
    controlPoint1: {
      x: normalizeX(path.controlPoint1.x),
      y: normalizeY(path.controlPoint1.y),
    },
    controlPoint2: {
      x: normalizeX(path.controlPoint2.x),
      y: normalizeY(path.controlPoint2.y),
    },
  };
};

export const getPathValues = (
  clippedPathValues: ClippedPathValues
): PathValues => {
  // Get the current size from the wave store
  const size = useWaveStore.getState().size;
  const width = size;
  const height = size;

  // Reverse the normalization for X
  const denormalizeX = (x: number) => Math.round(x * width);
  // Reverse the normalization for Y
  const denormalizeY = (y: number) => Math.round((1 - (y + 1) / 2) * height);

  return {
    startPoint: { y: denormalizeY(clippedPathValues.startPoint.y) },
    endPoint: { y: denormalizeY(clippedPathValues.endPoint.y) },
    controlPoint1: {
      x: denormalizeX(clippedPathValues.controlPoint1.x),
      y: denormalizeY(clippedPathValues.controlPoint1.y),
    },
    controlPoint2: {
      x: denormalizeX(clippedPathValues.controlPoint2.x),
      y: denormalizeY(clippedPathValues.controlPoint2.y),
    },
    size: { width, height },
  };
};
