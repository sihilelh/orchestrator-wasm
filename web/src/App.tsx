import "./App.css";
import { WaveEditor } from "@/components/wave-editor";
import { WaveVisualize } from "@/components/wave-visualize";
import { MIDIEditor } from "@/components/midi-editor";
import { Player } from "@/components/player";
import { ExportImport } from "@/components/export-import";

function App() {
  return (
    <div className="grid grid-cols-2 gap-4 p-8">
      <div>
        <WaveEditor />
        <WaveVisualize />
        <Player />
      </div>
      <div>
        <ExportImport />
        <MIDIEditor />
      </div>
    </div>
  );
}

export default App;
