// src/App.tsx
import ViewerPanel from "./components/ViewerPanel";
import EditorPanel from "./components/EditorPanel";
import { useCommandStore, selectCurrentInputType } from "./stores/useCommandStore";

// 🔧 更健壮的focus工具函数，带重试机制
const focusCommandInput = (delay = 150, maxRetries = 3) => {
  let retryCount = 0;
  
  const tryFocus = () => {
    const input = document.querySelector('input[data-command-input="true"]') as HTMLInputElement;
    if (input) {
      input.focus();
      console.log("🎯 App聚焦输入框成功");
      return true;
    } else {
      retryCount++;
      if (retryCount < maxRetries) {
        console.log(`🔄 App重试聚焦 (${retryCount}/${maxRetries})`);
        setTimeout(tryFocus, 50); // 短间隔重试
      } else {
        console.warn("⚠️ App聚焦失败：未找到命令输入框");
      }
      return false;
    }
  };
  
  setTimeout(tryFocus, delay);
};

function App() {
  // 🔧 直接从 store 获取状态，移除复杂的 ref 传递
  const interactiveCoords = useCommandStore((state) => state.interactiveCoords);
  const currentInputType = useCommandStore(selectCurrentInputType);
  const addInteractiveCoord = useCommandStore((state) => state.addInteractiveCoord);
  const setCommandInput = useCommandStore((state) => state.setCommandInput);

  // 🔧 直接处理坐标选择，不需要通过 ref
  const handleCoordinateSelected = (coord: { lon: number; lat: number; height: number }) => {
    console.log("🎯 App处理坐标选择:", { coord, currentInputType });
    
    if (currentInputType === "coordinates[]") {
      addInteractiveCoord({ lon: coord.lon, lat: coord.lat });
      console.log("📍 添加坐标到数组");
    } else if (currentInputType === "coordinate") {
      const coordStr = `${coord.lon.toFixed(6)},${coord.lat.toFixed(6)}`;
      setCommandInput(coordStr);
      console.log("📍 设置单个坐标:", coordStr);
      
      // 🔧 确保聚焦输入框
      focusCommandInput();
    }
  };

  // 🔧 直接处理实体选择
  const handleEntityPicked = (id: string) => {
    console.log("🎯 App处理实体选择:", { id, currentInputType });
    
    if (currentInputType === "entityId") {
      setCommandInput(id);
      console.log("📍 设置实体ID:", id);
      
      // 🔧 确保聚焦输入框
      focusCommandInput();
    }
  };

  // 🔧 完成坐标输入
  const handleFinishCoordinateInput = () => {
    console.log("🎯 App完成坐标输入:", { currentInputType, coordsCount: interactiveCoords.length });
    
    if (currentInputType === "coordinates[]") {
      const coordStr = interactiveCoords
        .map(p => `${p.lon.toFixed(6)},${p.lat.toFixed(6)}`)
        .join(" ");
      
      setCommandInput(coordStr);
      console.log("📍 设置坐标数组:", coordStr);
      
      // 🔧 确保聚焦输入框
      focusCommandInput();
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