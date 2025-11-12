import { TimelineItem } from "@/stores/midi-editor.store";

export function beatsToPixels(beats: number, zoom: number): number {
  return beats * zoom;
}

export function pixelsToBeats(pixels: number, zoom: number): number {
  return pixels / zoom;
}

export function snapToGrid(beats: number, gridSize: number): number {
  return Math.round(beats / gridSize) * gridSize;
}

export function generateNoteId(): string {
  return `note-${Date.now()}-${Math.random().toString(36)}`;
}

export function validateNoteAddition(
  notes: TimelineItem[],
  newNote: TimelineItem
): boolean {
  // Make sure no note is overlapping with the new note
  for (const note of notes) {
    if (
      note.startBeatIndex < newNote.endBeatIndex &&
      note.endBeatIndex > newNote.startBeatIndex
    ) {
      return false;
    }
  }
  return true;
}

export function generateTimeline(
  visibleTimeline: TimelineItem[]
): TimelineItem[] {
  // Using the gap method to find the empty slots
  // Then fill empty slots with C0, Amplitude 0 note for silence

  // If there are less than 2 notes, return the visible timeline
  if (visibleTimeline.length < 2) return visibleTimeline;

  const sortedTimeline = visibleTimeline.sort(
    (a, b) => a.startBeatIndex - b.startBeatIndex
  );
  const timeline: TimelineItem[] = [];
  for (let i = 0; i < sortedTimeline.length; i++) {
    const currentNote = sortedTimeline[i];
    timeline.push(currentNote); // Add the current note to the timeline
    if (i === sortedTimeline.length - 1) continue; // Last note, no next note
    const nextNote = sortedTimeline[i + 1];
    const gap = nextNote.startBeatIndex - currentNote.endBeatIndex;
    if (gap > 0) {
      timeline.push({
        id: generateNoteId(),
        octave: 0,
        noteId: 0,
        duration: gap,
        amplitude: 0,
        startBeatIndex: currentNote.endBeatIndex,
        endBeatIndex: currentNote.endBeatIndex + gap,
      });
    }
  }
  return timeline;
}
