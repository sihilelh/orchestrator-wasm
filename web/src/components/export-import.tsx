import { useMIDIEditorStore } from "@/stores/midi-editor.store";
import { useWaveStore } from "@/stores/wave.store";
import { getPathValues } from "@/utils/path";

interface OrchestratorJSON {
  bpm: number;
  control_points: [number, number, number, number];
  notes: {
    id: number;
    beats: number;
    octave: number;
    amplitude: number;
  }[];
  _x: [number, number];
}

export const ExportImport = () => {
  const { generateParameters, setBpm, importFromNotes } = useMIDIEditorStore();
  const {
    getClippedPathValues,
    setStartPoint,
    setEndPoint,
    setControlPoint1,
    setControlPoint2,
  } = useWaveStore();

  // Export a JSON that CLI tool also supports
  const handleExportMidi = () => {
    console.log(`Generating JSON for export...`);
    const params = generateParameters();
    const pathValues = getClippedPathValues();
    const json: OrchestratorJSON = {
      bpm: params.bpm,
      control_points: [
        pathValues.controlPoint1.y,
        pathValues.controlPoint2.y,
        pathValues.endPoint.y,
        pathValues.startPoint.y,
      ],
      notes: params.notes,
      _x: [pathValues.controlPoint1.x, pathValues.controlPoint2.x],
    };
    const jsonString = JSON.stringify(json);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orchestrator_${params.bpm}bpm_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
  };

  const handleImportMidi = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      console.log("import midi");
      const file = new FormData(event.target as HTMLFormElement).get(
        "json-file"
      ) as File;
      const json = JSON.parse(await file.text()) as OrchestratorJSON;
      // Setting control points
      const pathValues = getPathValues({
        startPoint: { y: json.control_points[3] },
        endPoint: { y: json.control_points[2] },
        controlPoint1: { x: json._x[0], y: json.control_points[0] },
        controlPoint2: { x: json._x[1], y: json.control_points[1] },
      });
      setControlPoint1(pathValues.controlPoint1);
      setControlPoint2(pathValues.controlPoint2);
      setEndPoint(pathValues.endPoint);
      setStartPoint(pathValues.startPoint);

      // Setting editor related values
      setBpm(json.bpm);
      importFromNotes(json.notes);
    } catch (error) {
      console.error("Error importing MIDI:", error);
    }
  };
  return (
    <div>
      <button onClick={handleExportMidi}>Export</button>
      <form action="import-midi" onSubmit={handleImportMidi}>
        <input type="file" accept=".json" name="json-file" />
        <button type="submit">Import</button>
      </form>
    </div>
  );
};
