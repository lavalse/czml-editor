// src/App.tsx
import { useState } from "react";
import ViewerPanel from "./components/ViewerPanel";
import EditorPanel from "./components/EditorPanel";

type CzmlPacket = Record<string, unknown>;

function App() {
  const [czml, setCzml] = useState<CzmlPacket[]>([]);

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw" }}>
      <div style={{ flex: 1 }}>
        <ViewerPanel czml={czml} />
      </div>
      <div style={{ width: 400, borderLeft: "1px solid #ccc", backgroundColor: "#f8f8f8" }}>
        <EditorPanel onUpdate={setCzml} />
      </div>
    </div>
  );
}

export default App;
