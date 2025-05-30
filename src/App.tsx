// src/App.tsx
import { useState, useRef } from "react";
import ViewerPanel from "./components/ViewerPanel";
import EditorPanel from "./components/EditorPanel";
import type { EditorPanelHandle } from "./components/EditorPanel";

type CzmlPacket = Record<string, unknown>;

function App() {
  const [czml, setCzml] = useState<CzmlPacket[]>([]);

  // ✅ 正确声明 ref 类型
  const editorRef = useRef<EditorPanelHandle>(null);

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw" }}>
      <div style={{ flex: 1 }}>
        <ViewerPanel czml={czml} onCoordinateSelected={(coord) => {
    editorRef.current?.handleCoordinateSelected(coord);
  }}
  onEntityPicked={(id) => {
    editorRef.current?.handleEntityPicked(id);
  }} />
      </div>
      <div style={{ width: 400, borderLeft: "1px solid #ccc", backgroundColor: "#f8f8f8" }}>
        <EditorPanel onUpdate={setCzml} ref={editorRef} />
      </div>
    </div>
  );
}

export default App;
