import { WaveVisualize } from "@/components/organisms/wave-visualize";
import { Player } from "@/components/organisms/player";
import {
  Tabs,
  TabsContent,
  TabsTrigger,
  TabsTriggerList,
} from "@/components/atoms/Tab";
import { WaveEditor } from "@/components/organisms/wave-editor";
import { MIDIEditor } from "@/components/organisms/midi-editor";
import { ExportImport } from "@/components/organisms/export-import";

export const Playground = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-8">
          <WaveVisualize />
          <Player />
        </div>
        <div className="col-span-2">
          <Tabs>
            <TabsTriggerList>
              <TabsTrigger>Wave Editor</TabsTrigger>
              <TabsTrigger>Piano Roll</TabsTrigger>
              <TabsTrigger>Export/Import</TabsTrigger>
            </TabsTriggerList>
            <TabsContent>
              <div className="md:h-[70vh] md:overflow-y-auto">
                <WaveEditor />
              </div>
            </TabsContent>
            <TabsContent>
              <div className="md:h-[70vh] md:overflow-y-auto">
                <MIDIEditor />
              </div>
            </TabsContent>
            <TabsContent>
              <div className="md:h-[70vh] md:overflow-y-auto">
                <ExportImport />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
