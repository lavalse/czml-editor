// src/App.tsx
import { useState, useRef, useEffect  } from "react";
import ViewerPanel from "./components/ViewerPanel";
import EditorPanel from "./components/EditorPanel";
import type { EditorPanelHandle } from "./components/EditorPanel";

type CzmlPacket = Record<string, unknown>;

function App() {
  const [czml, setCzml] = useState<CzmlPacket[]>([]);
  const editorRef = useRef<EditorPanelHandle>(null);

  // ✅ 添加 interactiveCoords 的 state
  const [interactiveCoords, setInteractiveCoords] = useState<{ lon: number; lat: number }[]>([]);

  // ✅ 定时同步 editorRef 中的交互坐标
  useEffect(() => {
    const interval = setInterval(() => {
      const coords = editorRef.current?.getInteractiveCoords?.();
      if (coords) {
        setInteractiveCoords(coords);
      }
    }, 100); // 每 100ms 拉一次
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw" }}>
      <div style={{ flex: 1 }}>
        <ViewerPanel 
          czml={czml}
          interactiveCoords={interactiveCoords}
          onCoordinateSelected={(coord) => {
            editorRef.current?.handleCoordinateSelected(coord);
          }}
          onEntityPicked={(id) => {
            editorRef.current?.handleEntityPicked(id);
          }}
          onFinishCoordinateInput={() => editorRef.current?.finalizeCoordinatesStep()}
        />
      </div>
      <div style={{ width: 400, borderLeft: "1px solid #ccc", backgroundColor: "#f8f8f8" }}>
        <EditorPanel onUpdate={setCzml} ref={editorRef} />
      </div>
    </div>
  );
}

export default App;
