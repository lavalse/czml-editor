import { forwardRef, useImperativeHandle, useRef } from "react";
import { useCommandRunner } from "../hooks/useCommandRunner";
import CzmlEditor from "./CZMLEditor";
import CommandInput from "../components/CommandInput";

interface Props {
  onUpdate: (czml: Record<string, unknown>[]) => void;
}

export interface EditorPanelHandle {
  handleCoordinateSelected: (coord: { lon: number; lat: number; height: number }) => void;
  handleEntityPicked(id: string): void;
  finalizeCoordinatesStep(): void;
  getInteractiveCoords: () => { lon: number; lat: number }[];
  // 🔧 添加缺失的方法定义
  getCurrentInputType: () => string | null;
}

const EditorPanel = forwardRef<EditorPanelHandle, Props>(({ onUpdate }, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    czmlText,
    setCzmlText,
    prompt,
    commandInput,
    setCommandInput,
    handleCommand,
    handleCoordinateSelected,
    finalizeCoordinatesStep,
    handleEntityPicked,
    interactiveCoords,
    error,
    currentInputType, // 🔧 确保从 hook 中获取这个值
  } = useCommandRunner({ onUpdate, inputRef });

  useImperativeHandle(ref, () => ({
    handleCoordinateSelected,
    handleEntityPicked,
    finalizeCoordinatesStep,
    getInteractiveCoords: () => interactiveCoords,
    // 🔧 实现 getCurrentInputType 方法
    getCurrentInputType: () => currentInputType,
  }));

  return (
    <div 
      className="editor-panel"
      style={{ padding: "16px", height: "100%", boxSizing: "border-box" }}
    >
      <h3>CZML 编辑器</h3>
      <CommandInput
        prompt={prompt}
        inputRef={inputRef}
        value={commandInput}
        onChange={setCommandInput}
        onEnter={() => handleCommand(commandInput)}
      />
      {error && (
        <div
          style={{
            color: "red",
            backgroundColor: "#ffe6e6",
            padding: "8px",
            border: "1px solid red",
            borderRadius: "4px",
            marginBottom: "12px",
          }}
        >
          ⚠️ {error}
        </div>
      )}
      <CzmlEditor value={czmlText} onChange={setCzmlText} />
    </div>
  );
});

export default EditorPanel;