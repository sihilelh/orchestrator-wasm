import React, { useEffect, useRef, useState } from "react";
import { useMIDIEditorStore } from "@/stores/midi-editor.store";
import { Rnd } from "react-rnd";
import { beatsToPixels, pixelsToBeats, snapToGrid } from "@/utils/editor.utils";
import { useDebounceCallback } from "@/hooks/useDebounce";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { Text } from "../atoms/Text";
import { Button } from "../atoms/Button";
import { ArrowUpIcon, SettingsIcon } from "lucide-react";
import { ArrowDownIcon } from "lucide-react";
import { Popover } from "@/components/atoms/Popover";
import { Slider } from "../atoms/Slider";
import { Select } from "../atoms/Select";

export const MIDIEditor = () => {
  const {
    editorOctave,
    setEditorOctave,
    sampleRate,
    setSampleRate,
    bpm,
    setBpm,
    visibleTimeline,
    snapToGridSize,
    setSnapToGridSize,
    zoom,
    setZoom,
    selectedNoteId,
    setSelectedNoteId,
    addNote,
    updateNote,
    removeNote,
  } = useMIDIEditorStore();

  const [localNoteAmplitude, setLocalNoteAmplitude] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  // Get selected note for amplitude slider
  const selectedNote = selectedNoteId
    ? visibleTimeline.find((note) => note.id === selectedNoteId)
    : null;

  // Sync local amplitude with store when selected note changes
  useEffect(() => {
    if (selectedNote) {
      setLocalNoteAmplitude(selectedNote.amplitude);
    } else {
      setLocalNoteAmplitude(0);
    }
  }, [selectedNote]);

  // Calculate container width for responsive timeline
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  // Calculate minimum timeline width (16 beats minimum, or more if notes extend beyond)
  // Ensure it fills the viewport width when zoomed out
  const minTimelineBeats = 16;
  const noteLabelWidth = 80; // Width of the note label column
  const padding = 32; // Total horizontal padding
  const availableWidth =
    containerWidth > 0 ? containerWidth - noteLabelWidth - padding : 0;
  const maxBeat =
    visibleTimeline.length > 0
      ? Math.max(
          minTimelineBeats,
          ...visibleTimeline.map((note) => note.endBeatIndex)
        )
      : minTimelineBeats;
  const beatsBasedWidth = beatsToPixels(maxBeat, zoom);
  // Use the larger of: beats-based width or available viewport width
  const timelineWidth = Math.max(beatsBasedWidth, availableWidth);

  // Create debounced callback for amplitude updates
  const debouncedUpdateAmplitude = useDebounceCallback(
    (noteId: string, amplitude: number) => {
      updateNote(noteId, { amplitude });
    },
    500 // 500ms delay for amplitude changes
  );

  return (
    <div ref={containerRef} className="px-2 sm:px-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mb-4">
        <div className="grid gap-1">
          <Label htmlFor="editorOctave" className="text-sm">
            Editor Octave
          </Label>
          <Input
            type="text"
            id="editorOctave"
            placeholder="Editor Octave"
            value={editorOctave}
            onChange={(e) => setEditorOctave(parseInt(e.target.value))}
            className="py-1 text-sm"
          />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="sampleRate" className="text-sm">
            Sample Rate
          </Label>
          <Input
            type="text"
            id="sampleRate"
            placeholder="Sample Rate"
            value={sampleRate}
            onChange={(e) => setSampleRate(parseInt(e.target.value))}
            className="py-1 text-sm"
          />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="bpm" className="text-sm">
            BPM
          </Label>
          <Input
            type="text"
            id="bpm"
            placeholder="BPM"
            value={bpm}
            onChange={(e) => setBpm(parseInt(e.target.value))}
            className="py-1 text-sm"
          />
        </div>
      </div>
      <div className="mb-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <Text as="h4" className="text-base">
            Timeline
          </Text>
          <div className="flex flex-wrap gap-2 items-center">
            <Popover>
              <Popover.Trigger>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!(selectedNote && selectedNoteId)}
                  className={`${
                    !(selectedNote && selectedNoteId)
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                  title={
                    !(selectedNote && selectedNoteId) ? "No note selected" : ""
                  }
                >
                  Amplitude <SettingsIcon className="w-3 h-3 ml-1" />
                </Button>
              </Popover.Trigger>
              <Popover.Content>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">
                      Adjust Amplitude
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Set the amplitude for the selected note.
                    </p>
                  </div>
                  <div>
                    <Slider
                      min={0}
                      max={1}
                      step={0.01}
                      value={[localNoteAmplitude]}
                      onValueChange={(value) => {
                        setLocalNoteAmplitude(value[0]);
                        debouncedUpdateAmplitude(
                          selectedNoteId || "",
                          value[0]
                        );
                      }}
                    />
                  </div>
                </div>
              </Popover.Content>
            </Popover>
            <Button size="sm" onClick={() => setEditorOctave(editorOctave + 1)}>
              Octave <ArrowUpIcon className="w-3 h-3 ml-2" />
            </Button>
            <Button size="sm" onClick={() => setEditorOctave(editorOctave - 1)}>
              Octave <ArrowDownIcon className="w-3 h-3 ml-2" />
            </Button>
          </div>
        </div>
      </div>
      <div className="mb-3">
        <div className="flex flex-col overflow-x-auto -mx-2 sm:mx-0">
          {Array.from({ length: 24 }, (_, i) => {
            // Note 11 to 0 for 2 octaves: first oct = editorOctave+1, then editorOctave
            // i=0..11 => oct=editorOctave+1, id=11-i
            // i=12..23 => oct=editorOctave, id=23-i
            const octave = i < 12 ? editorOctave + 1 : editorOctave;
            const noteId = i < 12 ? 11 - i : 23 - i;
            const rowNotes = visibleTimeline.filter(
              (note) => note.octave === octave && note.noteId === noteId
            );
            return (
              <MIDIEditorNote
                key={`${octave}-${noteId}`}
                octave={octave}
                id={noteId}
                notes={rowNotes}
                timelineWidth={timelineWidth}
                zoom={zoom}
                snapToGridSize={snapToGridSize}
                onNoteClick={(noteId) => setSelectedNoteId(noteId)}
                onNoteRemove={removeNote}
                onNoteUpdate={(noteId, updates, previousState) => {
                  return updateNote(noteId, updates, previousState);
                }}
                selectedNoteId={selectedNoteId}
                onRowMouseDown={(clickX) => {
                  const beatPosition = pixelsToBeats(clickX, zoom);
                  const snappedBeat = snapToGrid(beatPosition, snapToGridSize);
                  const newNoteId = addNote(
                    octave,
                    noteId,
                    snappedBeat,
                    snapToGridSize,
                    0.8
                  );
                  if (newNoteId) {
                    setSelectedNoteId(newNoteId);
                    return newNoteId;
                  }
                  return null;
                }}
              />
            );
          })}
        </div>
        <div className="mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="grid gap-1">
              <Label htmlFor="zoom" className="text-sm">
                Zoom: {zoom}px/beat
              </Label>
              <Slider
                id="zoom"
                min={10}
                max={200}
                step={5}
                value={[zoom]}
                onValueChange={([val]) => setZoom(val || 50)}
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="snapToGrid" className="text-sm">
                Snap to Grid
              </Label>
              <Select
                value={snapToGridSize.toString()}
                onValueChange={(value) => setSnapToGridSize(Number(value))}
              >
                <Select.Trigger>
                  <Select.Value placeholder="Snap to Grid (beats)" />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="0.25">1/4 beat</Select.Item>
                  <Select.Item value="0.5">1/2 beat</Select.Item>
                  <Select.Item value="1">1 beat</Select.Item>
                  <Select.Item value="2">2 beats</Select.Item>
                  <Select.Item value="4">4 beats</Select.Item>
                </Select.Content>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* eslint-disable no-unused-vars */
interface MidiEditorNoteProps {
  octave: number;
  id: number;
  notes: Array<{
    id: string;
    octave: number;
    noteId: number;
    duration: number;
    amplitude: number;
    startBeatIndex: number;
    endBeatIndex: number;
  }>;
  timelineWidth: number;
  zoom: number;
  snapToGridSize: number;
  onNoteClick: (noteId: string) => void;
  onNoteRemove: (noteId: string) => void;
  onNoteUpdate: (
    noteId: string,
    updates: {
      startBeatIndex?: number;
      duration?: number;
      amplitude?: number;
    },
    previousState?: {
      startBeatIndex?: number;
      duration?: number;
      amplitude?: number;
    }
  ) => boolean;
  onRowMouseDown: (clickX: number) => string | null; // Returns note ID if created, null otherwise
  selectedNoteId: string | null;
}
/* eslint-enable no-unused-vars */

export const MIDIEditorNote = (props: MidiEditorNoteProps) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const [draggingNoteId, setDraggingNoteId] = useState<string | null>(null);
  const [draggingNotePosition, setDraggingNotePosition] = useState<
    number | null
  >(null);
  const [creatingNoteId, setCreatingNoteId] = useState<string | null>(null);
  const [creatingNotePosition, setCreatingNotePosition] = useState<
    number | null
  >(null);
  const previousStatesRef = useRef<
    Map<string, { startBeatIndex?: number; duration?: number }>
  >(new Map());
  const creatingNoteStartRef = useRef<number | null>(null);
  const ids = [
    { label: `C${props.octave}`, className: "bg-card" },
    { label: `C${props.octave}#`, className: "bg-muted" },
    { label: `D${props.octave}`, className: "bg-card" },
    { label: `D${props.octave}#`, className: "bg-muted" },
    { label: `E${props.octave}`, className: "bg-card" },
    { label: `F${props.octave}`, className: "bg-card" },
    { label: `F${props.octave}#`, className: "bg-muted" },
    { label: `G${props.octave}`, className: "bg-card" },
    { label: `G${props.octave}#`, className: "bg-muted" },
    { label: `A${props.octave}`, className: "bg-card" },
    { label: `A${props.octave}#`, className: "bg-muted" },
    { label: `B${props.octave}`, className: "bg-card" },
  ];

  const handleRowMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only add note if clicking directly on the timeline-row div, not on child Rnd components
    if (e.target === e.currentTarget && e.button === 0) {
      // Only on left mouse button
      const rect = rowRef.current?.getBoundingClientRect();
      if (rect) {
        const clickX = e.clientX - rect.left;
        const beatPosition = pixelsToBeats(clickX, props.zoom);
        const snappedBeat = snapToGrid(beatPosition, props.snapToGridSize);
        creatingNoteStartRef.current = snappedBeat;
        const noteId = props.onRowMouseDown(clickX);
        if (noteId) {
          setCreatingNoteId(noteId);
        }
      }
    }
  };

  const handleRowMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (creatingNoteId && e.buttons === 1) {
      // Mouse is still down and we're creating a note
      const rect = rowRef.current?.getBoundingClientRect();
      if (rect) {
        const moveX = e.clientX - rect.left;
        const beatPosition = pixelsToBeats(moveX, props.zoom);
        const snappedBeat = snapToGrid(beatPosition, props.snapToGridSize);
        // Store position in state for visual update, validate on mouse up
        setCreatingNotePosition(snappedBeat);
        // Update note position without validation during drag
        props.onNoteUpdate(
          creatingNoteId,
          {
            startBeatIndex: snappedBeat,
          },
          undefined
        );
      }
    }
  };

  const handleRowMouseUp = () => {
    if (creatingNoteId && creatingNoteStartRef.current !== null) {
      // Validate the final position
      const finalPosition =
        creatingNotePosition ?? creatingNoteStartRef.current;
      const previousState = { startBeatIndex: creatingNoteStartRef.current };
      const success = props.onNoteUpdate(
        creatingNoteId,
        {
          startBeatIndex: finalPosition,
        },
        previousState
      );
      if (!success) {
        // Revert to original position
        props.onNoteUpdate(creatingNoteId, {
          startBeatIndex: creatingNoteStartRef.current,
        });
      }
      setCreatingNoteId(null);
      setCreatingNotePosition(null);
      creatingNoteStartRef.current = null;
    }
  };

  return (
    <div className="flex flex-row gap-2 relative" style={{ minHeight: "18px" }}>
      <div
        className={`${
          ids[props.id].className
        } sticky left-0 z-10 min-w-[80px] flex items-center justify-center text-xs border-r border-border`}
        style={{ position: "sticky", left: 0 }}
      >
        {ids[props.id].label}
      </div>
      <div
        ref={rowRef}
        className="timeline-row relative border-b border-border cursor-pointer"
        style={{
          width: `${props.timelineWidth}px`,
          minWidth: `${props.timelineWidth}px`,
          height: "18px",
        }}
        onMouseDown={handleRowMouseDown}
        onMouseMove={handleRowMouseMove}
        onMouseUp={handleRowMouseUp}
        onMouseLeave={handleRowMouseUp}
      >
        {props.notes.map((note) => {
          // Use creatingNotePosition if this note is being created and dragged
          // Use draggingNotePosition if this note is being dragged after creation
          const startBeat =
            creatingNoteId === note.id && creatingNotePosition !== null
              ? creatingNotePosition
              : draggingNoteId === note.id && draggingNotePosition !== null
              ? draggingNotePosition
              : note.startBeatIndex;
          const x = beatsToPixels(startBeat, props.zoom);
          const width = beatsToPixels(note.duration, props.zoom);
          const opacity = 0.3 + note.amplitude * 0.7;
          const isSelected = props.selectedNoteId === note.id;

          return (
            <Rnd
              key={note.id}
              size={{ width, height: 16 }}
              position={{ x, y: 1 }}
              onDragStart={() => {
                setDraggingNoteId(note.id);
                previousStatesRef.current.set(note.id, {
                  startBeatIndex: note.startBeatIndex,
                });
              }}
              onDrag={(_e, d) => {
                // Update position in real-time during drag
                const newStartBeat = snapToGrid(
                  pixelsToBeats(d.x, props.zoom),
                  props.snapToGridSize
                );
                setDraggingNotePosition(newStartBeat);
                // Update note position without validation during drag
                props.onNoteUpdate(
                  note.id,
                  {
                    startBeatIndex: newStartBeat,
                  },
                  undefined
                );
              }}
              onDragStop={(_e, d) => {
                setDraggingNoteId(null);
                const newStartBeat = snapToGrid(
                  pixelsToBeats(d.x, props.zoom),
                  props.snapToGridSize
                );
                const previousState = previousStatesRef.current.get(note.id);
                const success = props.onNoteUpdate(
                  note.id,
                  {
                    startBeatIndex: newStartBeat,
                  },
                  previousState
                );
                if (!success) {
                  // Note: revert is handled in the store
                  previousStatesRef.current.delete(note.id);
                } else {
                  previousStatesRef.current.delete(note.id);
                }
                setDraggingNotePosition(null);
              }}
              onResizeStart={() => {
                setDraggingNoteId(note.id);
                previousStatesRef.current.set(note.id, {
                  duration: note.duration,
                });
              }}
              onResizeStop={(_e, _direction, ref) => {
                setDraggingNoteId(null);
                const newWidth = parseFloat(ref.style.width);
                const newDuration = snapToGrid(
                  pixelsToBeats(newWidth, props.zoom),
                  props.snapToGridSize
                );
                const minDuration = props.snapToGridSize;
                const finalDuration = Math.max(minDuration, newDuration);
                const previousState = previousStatesRef.current.get(note.id);
                const success = props.onNoteUpdate(
                  note.id,
                  {
                    duration: finalDuration,
                  },
                  previousState
                );
                if (!success) {
                  // Note: revert is handled in the store
                  previousStatesRef.current.delete(note.id);
                } else {
                  previousStatesRef.current.delete(note.id);
                }
              }}
              enableResizing={{
                right: true,
                left: false,
                top: false,
                bottom: false,
              }}
              bounds="parent"
              dragGrid={[beatsToPixels(props.snapToGridSize, props.zoom), 0]}
              resizeGrid={[beatsToPixels(props.snapToGridSize, props.zoom), 0]}
              onContextMenu={(e: React.MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
                props.onNoteRemove(note.id);
              }}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                props.onNoteClick(note.id);
              }}
              style={{
                backgroundColor: `color-mix(in srgb, var(--primary) ${
                  opacity * 100
                }%, transparent)`,
                border: isSelected
                  ? "2px solid var(--primary)"
                  : "1px solid var(--border)",
                borderRadius: "2px",
                cursor: draggingNoteId === note.id ? "grabbing" : "move",
                boxShadow: isSelected
                  ? "0 0 4px color-mix(in srgb, var(--primary) 60%, transparent)"
                  : "none",
              }}
            />
          );
        })}
      </div>
    </div>
  );
};
