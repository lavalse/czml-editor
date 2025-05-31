// src/App.tsx
import { useState, useRef, useEffect  } from "react";
import ViewerPanel from "./components/ViewerPanel";
import EditorPanel from "./components/EditorPanel";
import type { EditorPanelHandle } from "./components/EditorPanel";

function App() {
  const editorRef = useRef<EditorPanelHandle>(null);
  const [interactiveCoords, setInteractiveCoords] = useState<{ lon: number; lat: number }[]>([]);
  const [currentInputType, setCurrentInputType] = useState<"coordinate" | "entityId" | "coordinates[]" | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      // 🔧 添加空值检查，避免运行时错误
      if (editorRef.current) {
        const coords = editorRef.current.getInteractiveCoords();
        if (coords) {
          setInteractiveCoords(coords);
        }
        
        const inputType = editorRef.current.getCurrentInputType();
        setCurrentInputType(inputType);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw" }}>
      <div style={{ flex: 1 }}>
        <ViewerPanel 
          interactiveCoords={interactiveCoords}
          currentInputType={currentInputType}
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
        {/* 🔧 保持 onUpdate 回调，但可以是空函数 */}
        <EditorPanel onUpdate={() => {}} ref={editorRef} />
      </div>
    </div>
  );
}

export default App;