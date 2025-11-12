import { create } from "zustand";
import { validateNoteAddition, generateTimeline } from "@/utils/editor.utils";

export interface TimelineItem {
  id: string; // Unique identifier for the note
  octave: number;
  noteId: number; // 0 = C, 1 = C# ...
  duration: number; // in beats
  amplitude: number; // 0.0 - 1.0
  startBeatIndex: number; // Start time in beats
  endBeatIndex: number; // End time in beats
}
export interface Parameters {
  bpm: number;
  sampleRate: number;
  notes: {
    id: number;
    octave: number;
    beats: number;
    amplitude: number;
  }[];
}

interface MIDIEditorStore {
  editorOctave: number; // Visible octave range (editorOctave ~ editorOctave + 1)
  setEditorOctave: (editorOctave: number) => void;
  sampleRate: number;
  setSampleRate: (sampleRate: number) => void;
  bpm: number;
  setBpm: (bpm: number) => void;
  visibleTimeline: TimelineItem[];
  setVisibleTimeline: (visibleTimeline: TimelineItem[]) => void;
  timeline: TimelineItem[];
  setTimeline: (timeline: TimelineItem[]) => void;
  snapToGridSize: number;
  setSnapToGridSize: (size: number) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  selectedNoteId: string | null;
  setSelectedNoteId: (id: string | null) => void;
  addNote: (
    octave: number,
    noteId: number,
    startBeat: number,
    duration: number,
    amplitude: number
  ) => string | null; // Returns note ID if added, null if validation failed
  updateNote: (
    noteId: string,
    updates: Partial<TimelineItem>,
    previousState?: Partial<TimelineItem>
  ) => boolean; // Returns true if update succeeded, false if validation failed
  removeNote: (noteId: string) => void;
  generateParameters: () => Parameters;
}

export const useMIDIEditorStore = create<MIDIEditorStore>((set, get) => ({
  editorOctave: 4,
  setEditorOctave: (editorOctave) => set({ editorOctave }),
  sampleRate: 44100,
  setSampleRate: (sampleRate) => set({ sampleRate }),
  bpm: 120,
  setBpm: (bpm) => set({ bpm }),
  visibleTimeline: [],
  setVisibleTimeline: (visibleTimeline) => {
    const timeline = generateTimeline(visibleTimeline);
    set({ visibleTimeline, timeline });
  },
  timeline: [],
  setTimeline: (timeline) => set({ timeline }),
  snapToGridSize: 1.0,
  setSnapToGridSize: (size) => set({ snapToGridSize: size }),
  zoom: 50,
  setZoom: (zoom) => set({ zoom }),
  selectedNoteId: null,
  setSelectedNoteId: (id) => set({ selectedNoteId: id }),
  addNote: (octave, noteId, startBeat, duration, amplitude) => {
    const { visibleTimeline } = get();
    const newNote: TimelineItem = {
      id: `note-${Date.now()}-${Math.random()}`,
      octave,
      noteId,
      duration,
      amplitude,
      startBeatIndex: startBeat,
      endBeatIndex: startBeat + duration,
    };

    // Validate: check ALL notes in the timeline to prevent any overlap
    if (!validateNoteAddition(visibleTimeline, newNote)) {
      return null; // Validation failed
    }

    const updatedVisibleTimeline = [...visibleTimeline, newNote];
    const timeline = generateTimeline(updatedVisibleTimeline);
    set({ visibleTimeline: updatedVisibleTimeline, timeline });
    return newNote.id;
  },
  updateNote: (noteId, updates, previousState) => {
    const { visibleTimeline } = get();
    const noteIndex = visibleTimeline.findIndex((note) => note.id === noteId);
    if (noteIndex === -1) return false;

    const currentNote = visibleTimeline[noteIndex];
    const updatedNote = { ...currentNote, ...updates };

    // Ensure endBeatIndex is consistent with startBeatIndex + duration
    if (
      updates.startBeatIndex !== undefined ||
      updates.duration !== undefined
    ) {
      updatedNote.endBeatIndex =
        updatedNote.startBeatIndex + updatedNote.duration;
    }

    // Validate: check ALL notes in the timeline (excluding current note) to prevent any overlap
    const otherNotes = visibleTimeline.filter((note) => note.id !== noteId);

    if (!validateNoteAddition(otherNotes, updatedNote)) {
      // Revert to previous state if provided, otherwise keep current
      if (previousState) {
        const revertedNote = { ...currentNote, ...previousState };
        if (
          previousState.startBeatIndex !== undefined ||
          previousState.duration !== undefined
        ) {
          revertedNote.endBeatIndex =
            revertedNote.startBeatIndex + revertedNote.duration;
        }
        const reverted = [...visibleTimeline];
        reverted[noteIndex] = revertedNote;
        const timeline = generateTimeline(reverted);
        set({ visibleTimeline: reverted, timeline });
      }
      return false; // Validation failed
    }

    const updated = [...visibleTimeline];
    updated[noteIndex] = updatedNote;
    const timeline = generateTimeline(updated);
    set({ visibleTimeline: updated, timeline });
    return true;
  },
  removeNote: (noteId) => {
    const { visibleTimeline, selectedNoteId } = get();
    const filtered = visibleTimeline.filter((note) => note.id !== noteId);
    const timeline = generateTimeline(filtered);
    set({
      visibleTimeline: filtered,
      timeline,
      selectedNoteId: selectedNoteId === noteId ? null : selectedNoteId,
    });
  },
  generateParameters: () => {
    return {
      bpm: get().bpm,
      sampleRate: get().sampleRate,
      notes: get().timeline.map((note) => ({
        id: note.noteId,
        octave: note.octave,
        beats: note.duration,
        amplitude: note.amplitude,
      })),
    };
  },
}));
