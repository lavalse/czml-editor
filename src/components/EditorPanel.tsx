// src/components/EditorPanel.tsx
import { useRef } from "react";
import { useCommandRunner } from "../hooks/useCommandRunner";
import CzmlEditor from "./CzmlEditor";
import CommandInput from "../components/CommandInput";
import { useCommandStore } from "../stores/useCommandStore";

interface Props {
  onUpdate: (czml: Record<string, unknown>[]) => void;
}

const EditorPanel = ({ onUpdate }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  
  // 从 store 获取历史记录
  const commandHistory = useCommandStore((state) => state.commandHistory);

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
      style={{ 
        padding: "16px", 
        height: "100%", 
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column"
      }}
    >
      
      <div style={{ 
        marginBottom: "16px",
        padding: "12px",
        background: "#0a0a0a",
        borderRadius: "6px",
        border: "1px solid #222"
      }}>
        <CommandInput
          prompt={prompt}
          inputRef={inputRef}
          value={commandInput}
          onChange={setCommandInput}
          onEnter={() => handleCommand(commandInput)}
          commandHistory={commandHistory}
        />
      </div>
      
      {error && (
        <div
          style={{
            color: "#ff6b6b",
            backgroundColor: "rgba(255, 107, 107, 0.1)",
            padding: "10px 12px",
            border: "1px solid rgba(255, 107, 107, 0.3)",
            borderRadius: "4px",
            marginBottom: "12px",
            fontSize: "14px",
            fontFamily: "monospace"
          }}
        >
          ⚠️ {error}
        </div>
      )}
      
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <CzmlEditor value={czmlText} onChange={setCzmlText} />
      </div>
    </div>
  );
};

export default EditorPanel;