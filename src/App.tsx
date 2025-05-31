// src/App.tsx
import { useRef } from "react";
import ViewerPanel from "./components/ViewerPanel";
import EditorPanel from "./components/EditorPanel";
import { useCommandStore, selectCurrentInputType } from "./stores/useCommandStore";
import type { EditorPanelHandle } from "./components/EditorPanel";

function App() {
  const editorRef = useRef<EditorPanelHandle>(null);
  
  // 直接从 store 获取需要的状态
  const interactiveCoords = useCommandStore((state) => state.interactiveCoords);
  const currentInputType = useCommandStore(selectCurrentInputType);

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
        <EditorPanel onUpdate={() => {}} ref={editorRef} />
      </div>
    </div>
  );
}

export default App;