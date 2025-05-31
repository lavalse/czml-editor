// src/App.tsx
import ViewerPanel from "./components/ViewerPanel";
import EditorPanel from "./components/EditorPanel";
import { useCommandStore, selectCurrentInputType } from "./stores/useCommandStore";

function App() {
  // 🔧 直接从 store 获取状态，移除复杂的 ref 传递
  const interactiveCoords = useCommandStore((state) => state.interactiveCoords);
  const currentInputType = useCommandStore(selectCurrentInputType);
  const addInteractiveCoord = useCommandStore((state) => state.addInteractiveCoord);
  const setCommandInput = useCommandStore((state) => state.setCommandInput);

  // 🔧 直接处理坐标选择，不需要通过 ref
  const handleCoordinateSelected = (coord: { lon: number; lat: number; height: number }) => {
    if (currentInputType === "coordinates[]") {
      addInteractiveCoord({ lon: coord.lon, lat: coord.lat });
    } else if (currentInputType === "coordinate") {
      const coordStr = `${coord.lon.toFixed(6)},${coord.lat.toFixed(6)}`;
      setCommandInput(coordStr);
      
      // 聚焦输入框
      setTimeout(() => {
        const input = document.querySelector('input[data-command-input="true"]') as HTMLInputElement;
        if (input) input.focus();
      }, 100);
    }
  };

  // 🔧 直接处理实体选择
  const handleEntityPicked = (id: string) => {
    if (currentInputType === "entityId") {
      setCommandInput(id);
      
      // 聚焦输入框
      setTimeout(() => {
        const input = document.querySelector('input[data-command-input="true"]') as HTMLInputElement;
        if (input) input.focus();
      }, 100);
    }
  };

  // 🔧 完成坐标输入
  const handleFinishCoordinateInput = () => {
    if (currentInputType === "coordinates[]") {
      const coordStr = interactiveCoords
        .map(p => `${p.lon.toFixed(6)},${p.lat.toFixed(6)}`)
        .join(" ");
      
      setCommandInput(coordStr);
      
      // 聚焦输入框
      setTimeout(() => {
        const input = document.querySelector('input[data-command-input="true"]') as HTMLInputElement;
        if (input) input.focus();
      }, 100);
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw" }}>
      <div style={{ flex: 1 }}>
        <ViewerPanel 
          interactiveCoords={interactiveCoords}
          currentInputType={currentInputType}
          onCoordinateSelected={handleCoordinateSelected}
          onEntityPicked={handleEntityPicked}
          onFinishCoordinateInput={handleFinishCoordinateInput}
        />
      </div>
      <div style={{ width: 400, borderLeft: "1px solid #ccc", backgroundColor: "#f8f8f8" }}>
        <EditorPanel onUpdate={() => {}} />
      </div>
    </div>
  );
}

export default App;