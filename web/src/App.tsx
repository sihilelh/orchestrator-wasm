import "./App.css";
import { WaveEditor } from "@/components/organisms/wave-editor";
import { WaveVisualize } from "@/components/organisms/wave-visualize";
import { MIDIEditor } from "@/components/organisms/midi-editor";
import { Player } from "@/components/organisms/player";
import { ExportImport } from "@/components/organisms/export-import";

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
