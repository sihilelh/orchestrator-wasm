import { ClippedPathValues, getClippedPathValues } from "@/utils/path";
import { create } from "zustand";

interface Point {
  x: number;
  y: number;
}

interface WaveStore {
  // State
  startPoint: Point;
  endPoint: Point;
  controlPoint1: Point;
  controlPoint2: Point;
  isDragging: boolean;
  dragIndex: number;
  size: number; // 1:1 aspect ratio

  // Actions
  setStartPoint: (point: Partial<Point>) => void;
  setEndPoint: (point: Partial<Point>) => void;
  setControlPoint1: (point: Partial<Point>) => void;
  setControlPoint2: (point: Partial<Point>) => void;
  setIsDragging: (isDragging: boolean) => void;
  setDragIndex: (index: number) => void;
  getClippedPathValues: () => ClippedPathValues;
}

export const useWaveStore = create<WaveStore>((set, get) => ({
  // Initial state - 400x400 square canvas
  size: 400,
  startPoint: { x: 0, y: 200 },
  endPoint: { x: 400, y: 200 },
  controlPoint1: { x: 133, y: 100 },
  controlPoint2: { x: 266, y: 300 },
  isDragging: false,
  dragIndex: -1,

  // Actions
  setStartPoint: (point) =>
    set((state) => ({
      startPoint: { ...state.startPoint, ...point },
    })),

  setEndPoint: (point) =>
    set((state) => ({
      endPoint: { ...state.endPoint, ...point },
    })),

  setControlPoint1: (point) =>
    set((state) => ({
      controlPoint1: { ...state.controlPoint1, ...point },
    })),

  setControlPoint2: (point) =>
    set((state) => ({
      controlPoint2: { ...state.controlPoint2, ...point },
    })),

  setIsDragging: (isDragging) => set({ isDragging }),

  setDragIndex: (index) => set({ dragIndex: index }),

  getClippedPathValues: () => {
    return getClippedPathValues({
      startPoint: { y: get().startPoint.y },
      endPoint: { y: get().endPoint.y },
      controlPoint1: { x: get().controlPoint1.x, y: get().controlPoint1.y },
      controlPoint2: { x: get().controlPoint2.x, y: get().controlPoint2.y },
      size: { width: get().size, height: get().size },
    });
  },
}));
