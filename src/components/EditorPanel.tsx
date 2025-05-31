import { forwardRef, useImperativeHandle, useRef } from "react";
import CommandInput from "../components/CommandInput";
import { useCommandRunner } from "../hooks/useCommandRunner";
import CzmlEditor from "./CZMLEditor";


interface Props {
  onUpdate: (czml: Record<string, unknown>[]) => void;
}

export interface EditorPanelHandle {
  handleCoordinateSelected: (coord: { lon: number; lat: number; height: number }) => void;
  handleEntityPicked(id: string): void;
  finalizeCoordinatesStep(): void;
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
    error,
  } = useCommandRunner({ onUpdate,inputRef });

  useImperativeHandle(ref, () => ({
    handleCoordinateSelected,
    handleEntityPicked,
    finalizeCoordinatesStep,
  }));

  return (
    <div style={{ padding: "16px", height: "100%", boxSizing: "border-box" }}>
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
