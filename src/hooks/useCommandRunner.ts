import { useState, useEffect, useCallback } from "react";
import { handleCommandInput, getInteractiveCommand } from "../commandSystem/registry";
import { registerBuiltinCommands } from "../commandSystem/registerBuiltins";
import type { CzmlEntity } from "../commandSystem/types";
import { safeParseCzml } from "../utils/json";

interface Options {
  onUpdate: (czml: Record<string, unknown>[]) => void;
  initialText?: string;
}

export const useCommandRunner = ({ onUpdate, initialText }: Options) => {
  const [czmlText, setCzmlText] = useState<string>(
    initialText ??
      `[{
        "id": "document",
        "name": "CZML Path",
        "version": "1.0"
      }]`
  );

  const [currentCommandName, setCurrentCommandName] = useState<string | null>(null);
  const [interactiveStepIndex, setInteractiveStepIndex] = useState(0);
  const [interactiveParams, setInteractiveParams] = useState<Record<string, unknown>>({});
  const [prompt, setPrompt] = useState("请输入命令:");
  const [commandInput, setCommandInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    registerBuiltinCommands();
  }, []);

  const completeCommand = useCallback((params: Record<string, unknown>) => {
    const czml = safeParseCzml(czmlText) as CzmlEntity[];
    const command = getInteractiveCommand(currentCommandName!);
    if (!command) return;
    const newCzml = command.onComplete(params, czml);
    const newText = JSON.stringify(newCzml, null, 2);
    setCzmlText(newText);
    onUpdate(newCzml);

    setCurrentCommandName(null);
    setInteractiveStepIndex(0);
    setInteractiveParams({});
    setPrompt("请输入命令:");
    setCommandInput("");
  }, [czmlText, currentCommandName, onUpdate]);

  const handleCommand = (input: string) => {
    try {
      const czml = safeParseCzml(czmlText) as CzmlEntity[];

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
        const newText = JSON.stringify(newCzml, null, 2);
        setCzmlText(newText);
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
      setError("当前 CZML 内容格式不正确，无法执行命令");
    }
  };

  const getCurrentStep = () => {
    const command = getInteractiveCommand(currentCommandName!);
    return command?.steps[interactiveStepIndex] ?? null;
  };

  const isCurrentStepInputType = (type: string) => {
    const step = getCurrentStep();
    return step?.inputType === type;
  };


  const handleCoordinateSelected = ({ lon, lat }: { lon: number; lat: number }) => {
    if (!isCurrentStepInputType("coordinate")) return;
    const coordStr = `${lon.toFixed(6)},${lat.toFixed(6)}`;
    setCommandInput(coordStr);
  };

  const handleEntityPicked = (id: string) => {
    if (!isCurrentStepInputType("entityId")) return;
    setCommandInput(id);
  };


  return {
    czmlText,
    setCzmlText,
    prompt,
    commandInput,
    setCommandInput,
    handleCommand,
    handleCoordinateSelected,
    handleEntityPicked,
    error
  };
};
