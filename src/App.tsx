// src/App.tsx
import { useState, useRef } from "react";
import ViewerPanel from "./components/ViewerPanel";
import EditorPanel from "./components/EditorPanel";
import type { EditorPanelHandle } from "./components/EditorPanel";
import Toolbar from './components/Toolbar'; // Import Toolbar
import { getCommand } from './commandSystem'; // Import getCommand
import type { CommandInstance } from './commandSystem'; // Import CommandInstance

type CzmlPacket = Record<string, unknown>;

function App() {
  // Initialize with a default document packet as good practice
  const [czml, setCzml] = useState<CzmlPacket[]>([
    {
      id: "document",
      name: "CZML Geometries",
      version: "1.0",
    },
  ]);
  const [drawingMode, setDrawingMode] = useState<'select' | 'point' | 'polyline'>('select');
  const editorPanelRef = useRef<EditorPanelHandle>(null);

  const handleCzmlUpdate = (updatedCzml: CzmlPacket[]) => {
    setCzml(updatedCzml);
  };

  const handleCoordinateSelected = (coord: { lon: number; lat: number; height: number }) => {
    if (editorPanelRef.current) {
      editorPanelRef.current.handleCoordinateSelected(coord);
    }
  };

  const handlePolylineComplete = (points: Array<[number, number, number]>) => {
    console.log("Polyline completed in App with points:", points);

    const polylineCommandInstance: CommandInstance = {
      type: "AddPolyline", // Should match the registered command name
      params: {
        positions: points, // This is an array of [lon, lat, height]
      },
    };

    const commandDef = getCommand("AddPolyline");

    if (commandDef && commandDef.execute) {
      const newCzml = commandDef.execute(polylineCommandInstance, czml);
      setCzml(newCzml); // Update the CZML state
    } else {
      console.error("AddPolyline command definition or execute function not found.");
      // Consider adding user feedback, e.g., an alert message
      alert("Error: Could not add polyline. Command not found.");
    }
  };

  return (
    <div className="app-container">
      <Toolbar currentMode={drawingMode} onModeChange={setDrawingMode} />
      <div className="main-content">
        <div style={{ flex: 1, overflow: 'auto' }}>
          <ViewerPanel
            czml={czml}
            drawingMode={drawingMode}
            onCoordinateSelected={handleCoordinateSelected}
            onPolylineComplete={handlePolylineComplete} // Pass the new handler here
          />
        </div>
        <div style={{ width: 400, borderLeft: "1px solid #ccc", backgroundColor: "#f8f8f8", overflow: 'auto' }}>
          <EditorPanel
            ref={editorPanelRef}
            onUpdate={handleCzmlUpdate}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
