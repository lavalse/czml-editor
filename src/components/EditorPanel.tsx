import { useState, useEffect, forwardRef, useImperativeHandle, useRef } from "react";
import type { CzmlEntity } from "../commandSystem/types";
import {
  handleCommandInput,
  getInteractiveCommand,
} from "../commandSystem/registry";

import {registerBuiltinCommands} from "../commandSystem/registerBuiltins"

interface Props {
  onUpdate: (czml: Record<string, unknown>[]) => void;
}

export interface EditorPanelHandle {
  handleCoordinateSelected: (coord: { lon: number; lat: number; height: number }) => void;
  handleEntityPicked(id: string): void;
}



const EditorPanel = forwardRef<EditorPanelHandle, Props>(({ onUpdate }, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    registerBuiltinCommands();
  }, []);

  const [text, setText] = useState(`[{
    "id": "document",
    "name": "CZML Path",
    "version": "1.0"
  }]`);

  const [currentCommandName, setCurrentCommandName] = useState<string | null>(null);
  const [interactiveStepIndex, setInteractiveStepIndex] = useState(0);
  const [interactiveParams, setInteractiveParams] = useState<Record<string, unknown>>({});
  const [prompt, setPrompt] = useState("请输入命令:");
  const [commandInput, setCommandInput] = useState("");

  const completeCommand = (params: Record<string, unknown>) => {
    const czml = JSON.parse(text) as CzmlEntity[];
    const command = getInteractiveCommand(currentCommandName!);
    if (!command) return;
    const newCzml = command.onComplete(params, czml);
    setText(JSON.stringify(newCzml, null, 2));
    onUpdate(newCzml);
    setCurrentCommandName(null);
    setInteractiveStepIndex(0);
    setInteractiveParams({});
    setPrompt("请输入命令:");
    setCommandInput("");
  };

  const handleCommand = (input: string) => {
    try {
      const czml = JSON.parse(text) as CzmlEntity[];

      if (!currentCommandName) {
        const interactive = getInteractiveCommand(input);
        if (interactive) {
          setCurrentCommandName(input);
          setInteractiveStepIndex(0);
          setInteractiveParams({});
          setPrompt(interactive.steps[0].prompt);
          return;
        }

        const newCzml = handleCommandInput(input, czml);
        setText(JSON.stringify(newCzml, null, 2));
        onUpdate(newCzml);
        return;
      }

      const command = getInteractiveCommand(currentCommandName);
      if (!command) return;

      const step = command.steps[interactiveStepIndex];
      const value = step.transform ? step.transform(input) : input;
      const updatedParams = { ...interactiveParams, [step.key]: value };
      setInteractiveParams(updatedParams);

      if (interactiveStepIndex + 1 < command.steps.length) {
        setInteractiveStepIndex(interactiveStepIndex + 1);
        setPrompt(command.steps[interactiveStepIndex + 1].prompt);
      } else {
        completeCommand(updatedParams);
      }
    } catch {
      alert("当前 CZML 内容格式不正确，无法执行命令");
    }
  };

  const currentCommand = currentCommandName ? getInteractiveCommand(currentCommandName) : null;
  const currentStep = currentCommand?.steps[interactiveStepIndex] ?? null;

  useImperativeHandle(ref, () => ({
  handleCoordinateSelected: ({ lon, lat }) => {
    if (currentStep?.inputType !== "coordinate") return;
    const coordString = `${lon.toFixed(6)},${lat.toFixed(6)}`;
    setCommandInput(coordString);
    inputRef.current?.focus();
  },
  handleEntityPicked: (id: string) => {
    if (currentStep?.inputType !== "entityId") return;
    setCommandInput(id);
    inputRef.current?.focus();
  }
}));

  return (
    <div style={{ padding: "16px", height: "100%", boxSizing: "border-box" }}>
      <h3>CZML 编辑器</h3>

      <p>{prompt}</p>
      <input
        ref={inputRef}
        value={commandInput}
        onChange={(e) => setCommandInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleCommand(commandInput);
            setCommandInput("");
          }
        }}
        placeholder=""
        style={{
          width: "100%",
          padding: "8px",
          marginBottom: "12px",
          fontFamily: "monospace",
          background: "#111",
          color: "#0f0",
          border: "1px solid #444",
          borderRadius: "4px",
        }}
      />

      <textarea
        style={{ width: "100%", height: "60%" }}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
    </div>
  );
});

export default EditorPanel;
