import { useMIDIEditorStore } from "@/stores/midi-editor.store";
import { useWaveStore } from "@/stores/wave.store";
import { getPathValues } from "@/utils/path";
import { Card } from "../atoms/Card";
import { Button } from "../atoms/Button";
import { Text } from "../atoms/Text";
import { DownloadIcon, UploadIcon } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";
import { cn } from "@/utils/classname.utils";

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
    toast.success("JSON exported successfully");
  };

  const handleImportMidi = React.useCallback(
    async (file: File) => {
      try {
        console.log("import midi");
        const json = JSON.parse(await file.text()) as OrchestratorJSON;
        // Setting control points if present
        if (json.control_points) {
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
        }
        // Setting editor related values
        setBpm(json.bpm);
        importFromNotes(json.notes);
        toast.success("JSON imported successfully");
      } catch (error) {
        console.error("Error importing MIDI:", error);
        toast.error(
          "Failed to import JSON file. Please check the file format."
        );
      }
    },
    [
      setBpm,
      importFromNotes,
      setControlPoint1,
      setControlPoint2,
      setEndPoint,
      setStartPoint,
    ]
  );

  const onDrop = React.useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        handleImportMidi(acceptedFiles[0]);
      }
    },
    [handleImportMidi]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept: {
        "application/json": [".json"],
      },
      multiple: false,
    });
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Card className="w-full">
          <Card.Header>
            <Card.Title>Export MIDI</Card.Title>
            <Card.Description>
              Export your composition to a JSON file compatible with the
              original CLI tool.
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <Text as={"p"}>
              Export your current composition (notes, BPM, and Bezier control
              points) to JSON. This file format is compatible with the original
              Orchestrator CLI tool, allowing you to share compositions between
              the web version and command-line version.
            </Text>
            <br />
            <Button onClick={handleExportMidi}>
              <DownloadIcon className="w-4 h-4 mr-2" />
              Export JSON
            </Button>
          </Card.Content>
        </Card>
      </div>
      <div>
        <Card className="w-full">
          <Card.Header>
            <Card.Title>Import MIDI</Card.Title>
            <Card.Description>
              Import compositions from JSON files created in this app or the
              original CLI tool.
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <Text as={"p"}>
              Import JSON files exported from this web version or created with
              the original Orchestrator CLI tool. This allows you to continue
              working on compositions across different platforms and share your
              work with others.
            </Text>
            <br />
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded p-8 text-center cursor-pointer transition-all",
                isDragActive && !isDragReject
                  ? "border-primary bg-primary/10 shadow-md"
                  : isDragReject
                  ? "border-destructive bg-destructive/10"
                  : "border-border hover:border-primary hover:bg-card",
                "hover:shadow-md active:shadow-none"
              )}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-4">
                <UploadIcon
                  className={cn(
                    "w-12 h-12",
                    isDragActive && !isDragReject
                      ? "text-primary"
                      : isDragReject
                      ? "text-destructive"
                      : "text-muted-foreground"
                  )}
                />
                {isDragActive ? (
                  isDragReject ? (
                    <Text as="p" className="text-destructive">
                      Invalid file type. Please drop a JSON file.
                    </Text>
                  ) : (
                    <Text as="p" className="text-primary">
                      Drop the JSON file here...
                    </Text>
                  )
                ) : (
                  <>
                    <Text as="p" className="text-muted-foreground">
                      Drag and drop a JSON file here, or click to select
                    </Text>
                    <Button variant="outline" size="sm" type="button">
                      <UploadIcon className="w-4 h-4 mr-2" />
                      Select File
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
};
