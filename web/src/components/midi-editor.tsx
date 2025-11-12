import React, { useEffect, useRef, useState } from "react";
import { useMIDIEditorStore } from "@/stores/midi-editor.store";
import { Rnd } from "react-rnd";
import { beatsToPixels, pixelsToBeats, snapToGrid } from "@/utils/editor.utils";
import { useDebounceCallback } from "@/hooks/useDebounce";

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

  // Calculate minimum timeline width (16 beats minimum, or more if notes extend beyond)
  const minTimelineBeats = 16;
  const maxBeat =
    visibleTimeline.length > 0
      ? Math.max(
          minTimelineBeats,
          ...visibleTimeline.map((note) => note.endBeatIndex)
        )
      : minTimelineBeats;
  const timelineWidth = beatsToPixels(maxBeat, zoom);

  // Create debounced callback for amplitude updates
  const debouncedUpdateAmplitude = useDebounceCallback(
    (noteId: string, amplitude: number) => {
      updateNote(noteId, { amplitude });
    },
    500 // 500ms delay for amplitude changes
  );

  return (
    <div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="editorOctave">Editor Octave</label>
          <input
            type="text"
            className="w-full"
            value={editorOctave}
            onChange={(e) => setEditorOctave(parseInt(e.target.value))}
            placeholder="Editor Octave"
          />
        </div>
        <div>
          <label htmlFor="sampleRate">Sample Rate</label>
          <input
            type="text"
            className="w-full"
            value={sampleRate}
            onChange={(e) => setSampleRate(parseInt(e.target.value))}
            placeholder="Sample Rate"
          />
        </div>
        <div>
          <label htmlFor="bpm">BPM</label>
          <input
            type="text"
            className="w-full"
            value={bpm}
            onChange={(e) => setBpm(parseInt(e.target.value))}
            placeholder="BPM"
          />
        </div>
      </div>
      <div className="mt-8">
        <div className="flex justify-between">
          <div>Timeline</div>
          <div>
            Octave Range: {editorOctave} - {editorOctave + 1}
            <button
              className="w-8 h-8 bg-blue-500 text-white rounded-full"
              onClick={() => setEditorOctave(editorOctave + 1)}
            >
              +
            </button>
            <button
              className="w-8 h-8 bg-blue-500 text-white rounded-full"
              onClick={() => setEditorOctave(editorOctave - 1)}
            >
              -
            </button>
          </div>
        </div>
      </div>
      <div className="mt-8">
        <div className="flex">
          <div className="flex flex-col w-[90%] overflow-x-auto">
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
                    const snappedBeat = snapToGrid(
                      beatPosition,
                      snapToGridSize
                    );
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
          <div className="w-[10%]">
            Selected note's amplitude
            {selectedNoteId && selectedNote ? (
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={localNoteAmplitude}
                onChange={(e) => {
                  setLocalNoteAmplitude(parseFloat(e.target.value));
                  debouncedUpdateAmplitude(
                    selectedNoteId,
                    parseFloat(e.target.value)
                  );
                }}
                className="-rotate-90"
              />
            ) : (
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                disabled
                className="-rotate-90 opacity-50"
              />
            )}
          </div>
        </div>
        <div className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="zoom">Zoom (pixels per beat): {zoom}</label>
              <input
                type="range"
                id="zoom"
                min="10"
                max="200"
                step="5"
                value={zoom}
                onChange={(e) => setZoom(parseInt(e.target.value) || 50)}
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="snapToGrid">Snap to Grid (beats)</label>
              <select
                id="snapToGrid"
                value={snapToGridSize}
                onChange={(e) =>
                  setSnapToGridSize(parseFloat(e.target.value) || 1.0)
                }
                className="w-full"
              >
                <option value={0.25}>0.25</option>
                <option value={0.5}>0.5</option>
                <option value={1.0}>1.0</option>
                <option value={2.0}>2.0</option>
                <option value={4.0}>4.0</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const MIDIEditorNote = (props: {
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
}) => {
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
    { label: `C${props.octave}`, className: "bg-neutral-100" },
    { label: `C${props.octave}#`, className: "bg-neutral-400" },
    { label: `D${props.octave}`, className: "bg-neutral-100" },
    { label: `D${props.octave}#`, className: "bg-neutral-400" },
    { label: `E${props.octave}`, className: "bg-neutral-100" },
    { label: `F${props.octave}`, className: "bg-neutral-100" },
    { label: `F${props.octave}#`, className: "bg-neutral-400" },
    { label: `G${props.octave}`, className: "bg-neutral-100" },
    { label: `G${props.octave}#`, className: "bg-neutral-400" },
    { label: `A${props.octave}`, className: "bg-neutral-100" },
    { label: `A${props.octave}#`, className: "bg-neutral-400" },
    { label: `B${props.octave}`, className: "bg-neutral-100" },
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
    <div className="flex flex-row gap-4 relative" style={{ minHeight: "32px" }}>
      <div
        className={`${
          ids[props.id].className
        } sticky left-0 z-10 min-w-[80px] flex items-center justify-center`}
        style={{ position: "sticky", left: 0 }}
      >
        {ids[props.id].label}
      </div>
      <div
        ref={rowRef}
        className="timeline-row relative border-b border-gray-200 cursor-pointer"
        style={{
          width: `${props.timelineWidth}px`,
          minWidth: `${props.timelineWidth}px`,
          height: "32px",
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
          const opacity = 0.2 + note.amplitude / 1.25;
          const isSelected = props.selectedNoteId === note.id;

          return (
            <Rnd
              key={note.id}
              size={{ width, height: 30 }}
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
                backgroundColor: `rgba(59, 130, 246, ${opacity})`,
                border: isSelected
                  ? "3px solid rgba(255, 215, 0, 1)"
                  : "1px solid rgba(59, 130, 246, 0.8)",
                borderRadius: "2px",
                cursor: draggingNoteId === note.id ? "grabbing" : "move",
                boxShadow: isSelected
                  ? "0 0 8px rgba(255, 215, 0, 0.6)"
                  : "none",
              }}
            />
          );
        })}
      </div>
    </div>
  );
};
