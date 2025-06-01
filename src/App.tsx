// src/App.tsx
import ViewerPanel from "./components/ViewerPanel";
import EditorPanel from "./components/EditorPanel";
import { useCommandStore, selectCurrentInputType } from "./stores/useCommandStore";
import { UnifiedInputProvider } from "./providers/UnifiedInputProvider";
import { useUnifiedInput } from "./providers/UnifiedInputProvider";

// 将主要逻辑抽取到单独的组件中，这样可以使用 hooks
function AppContent() {
  const { focusCommandInput } = useUnifiedInput();
  
  // 直接从 store 获取状态
  const interactiveCoords = useCommandStore((state) => state.interactiveCoords);
  const currentInputType = useCommandStore(selectCurrentInputType);
  const addInteractiveCoord = useCommandStore((state) => state.addInteractiveCoord);
  const setCommandInput = useCommandStore((state) => state.setCommandInput);

  // 处理坐标选择
  const handleCoordinateSelected = (coord: { lon: number; lat: number; height: number }) => {
    console.log("🎯 App处理坐标选择:", { coord, currentInputType });
    
    if (currentInputType === "coordinates[]") {
      addInteractiveCoord({ lon: coord.lon, lat: coord.lat });
      console.log("📍 添加坐标到数组");
    } else if (currentInputType === "coordinate") {
      const coordStr = `${coord.lon.toFixed(6)},${coord.lat.toFixed(6)}`;
      setCommandInput(coordStr);
      console.log("📍 设置单个坐标:", coordStr);
      
      // 使用统一的聚焦方法
      focusCommandInput();
    }
  };

  // 处理实体选择
  const handleEntityPicked = (id: string) => {
    console.log("🎯 App处理实体选择:", { id, currentInputType });
    
    if (currentInputType === "entityId") {
      setCommandInput(id);
      console.log("📍 设置实体ID:", id);
      
      // 使用统一的聚焦方法
      focusCommandInput();
    }
  };

  // 完成坐标输入
  const handleFinishCoordinateInput = () => {
    console.log("🎯 App完成坐标输入:", { currentInputType, coordsCount: interactiveCoords.length });
    
    if (currentInputType === "coordinates[]") {
      const coordStr = interactiveCoords
        .map(p => `${p.lon.toFixed(6)},${p.lat.toFixed(6)}`)
        .join(" ");
      
      setCommandInput(coordStr);
      console.log("📍 设置坐标数组:", coordStr);
      
      // 使用统一的聚焦方法
      focusCommandInput();
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden" }}>
      <div style={{ flex: 1, position: "relative" }}>
        <ViewerPanel 
          interactiveCoords={interactiveCoords}
          currentInputType={currentInputType}
          onCoordinateSelected={handleCoordinateSelected}
          onEntityPicked={handleEntityPicked}
          onFinishCoordinateInput={handleFinishCoordinateInput}
        />
        
        {/* 快捷键提示浮层 */}
        <div style={{
          position: "absolute",
          bottom: "20px",
          left: "20px",
          background: "rgba(0, 0, 0, 0.8)",
          color: "white",
          padding: "10px 15px",
          borderRadius: "6px",
          fontSize: "12px",
          fontFamily: "monospace",
          pointerEvents: "none",
          zIndex: 1000
        }}>
          <div>Ctrl+K: 命令输入 | Ctrl+H: 帮助</div>
          {currentInputType === "coordinates[]" && (
            <div style={{ marginTop: "5px", color: "#ffeb3b" }}>
              左键: 添加点 | 右键: 完成
            </div>
          )}
        </div>
      </div>
      
      <div style={{ 
        width: 400, 
        borderLeft: "1px solid #333", 
        backgroundColor: "#1a1a1a",
        display: "flex",
        flexDirection: "column"
      }}>
        <EditorPanel onUpdate={() => {}} />
      </div>
    </div>
  );
}

function App() {
  return (
    <UnifiedInputProvider debugMode={true}>
      <AppContent />
    </UnifiedInputProvider>
  );
}

export default App;