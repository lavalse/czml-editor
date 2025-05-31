// src/components/EditorPanel.tsx
import { useRef } from "react";
import { useCommandRunner } from "../hooks/useCommandRunner";
import CzmlEditor from "./CZMLEditor";
import CommandInput from "../components/CommandInput";

interface Props {
  onUpdate: (czml: Record<string, unknown>[]) => void;
}

// 🔧 移除复杂的 forwardRef 和 useImperativeHandle
const EditorPanel = ({ onUpdate }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    czmlText,
    setCzmlText,
    prompt,
    commandInput,
    setCommandInput,
    handleCommand,
    error,
  } = useCommandRunner({ onUpdate, inputRef });

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
};

export default EditorPanel;