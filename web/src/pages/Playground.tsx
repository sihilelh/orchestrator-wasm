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
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-4 sm:space-y-8">
          <WaveVisualize />
          <Player />
        </div>
        <div className="col-span-1 md:col-span-2">
          <Tabs>
            <TabsTriggerList className="flex-wrap">
              <TabsTrigger className="text-xs sm:text-sm">
                Wave Editor
              </TabsTrigger>
              <TabsTrigger className="text-xs sm:text-sm">
                Piano Roll
              </TabsTrigger>
              <TabsTrigger className="text-xs sm:text-sm">
                Export/Import
              </TabsTrigger>
            </TabsTriggerList>
            <TabsContent>
              <div className="h-[60vh] sm:h-[70vh] overflow-y-auto">
                <WaveEditor />
              </div>
            </TabsContent>
            <TabsContent>
              <div className="h-[60vh] sm:h-[70vh] overflow-y-auto">
                <MIDIEditor />
              </div>
            </TabsContent>
            <TabsContent>
              <div className="h-[60vh] sm:h-[70vh] overflow-y-auto">
                <ExportImport />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
