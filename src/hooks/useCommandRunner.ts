// hooks/useCommandRunner.ts
import { useState, useEffect, useCallback } from "react";
import { handleCommandInput, getInteractiveCommand } from "../commandSystem/registry";
import { registerBuiltinCommands } from "../commandSystem/registerBuiltins";
import type { CzmlEntity } from "../commandSystem/types";
import { safeParseCzml } from "../utils/json";
import { useCzmlStore } from "../stores/useCZMLStore";

interface Options {
  onUpdate: (czml: Record<string, unknown>[]) => void;
  initialText?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export const useCommandRunner = ({ onUpdate, initialText, inputRef }: Options) => {
  // 🔧 修复：分别获取数据和方法，避免无限循环
  const czml = useCzmlStore((state) => state.czml);
  const czmlText = useCzmlStore((state) => state.czmlText);
  const setCzml = useCzmlStore((state) => state.setCzml);
  const setCzmlText = useCzmlStore((state) => state.setCzmlText);

  // 其他状态保持不变
  const [currentCommandName, setCurrentCommandName] = useState<string | null>(null);
  const [interactiveStepIndex, setInteractiveStepIndex] = useState(0);
  const [interactiveParams, setInteractiveParams] = useState<Record<string, unknown>>({});
  const [prompt, setPrompt] = useState("请输入命令:");
  const [commandInput, setCommandInput] = useState("");
  const [interactiveCoords, setInteractiveCoords] = useState<{ lon: number; lat: number }[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    registerBuiltinCommands();
  }, []);

  // 🔧 修复：使用 useEffect 但添加依赖控制，避免无限循环
  useEffect(() => {
    onUpdate(czml);
  }, [czml]); // 移除 onUpdate 依赖，因为它可能每次都变

  const getCurrentInputType = useCallback(() => {
    if (!currentCommandName) return null;
    const command = getInteractiveCommand(currentCommandName);
    if (!command) return null;
    const step = command.steps[interactiveStepIndex];
    return step?.inputType || null;
  }, [currentCommandName, interactiveStepIndex]);

  const maintainInputFocus = useCallback(() => {
    const currentInputType = getCurrentInputType();
    if (currentInputType === "coordinate" || currentInputType === "entityId") {
      setTimeout(() => {
        if (inputRef?.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  }, [getCurrentInputType, inputRef]);

  const completeCommand = useCallback((params: Record<string, unknown>) => {
    const command = getInteractiveCommand(currentCommandName!);
    if (!command) return;
    
    const newCzml = command.onComplete(params, czml);
    setCzml(newCzml); // 🔧 这里只调用一次，不会造成循环

    setCurrentCommandName(null);
    setInteractiveCoords([]);
    setInteractiveStepIndex(0);
    setInteractiveParams({});
    setPrompt("请输入命令:");
    setCommandInput("");
    
    setTimeout(() => {
      if (inputRef?.current) {
        inputRef.current.focus();
      }
    }, 100);
  }, [currentCommandName, czml, setCzml, inputRef]);

  const handleCommand = useCallback((input: string) => {
    try {
      const parsedCzml = safeParseCzml(czmlText) as CzmlEntity[];

      if (!currentCommandName) {
        const interactive = getInteractiveCommand(input);
        if (interactive) {
          setCurrentCommandName(input);
          setInteractiveStepIndex(0);
          setInteractiveParams({});
          setPrompt(interactive.steps[0].prompt);
          setInteractiveCoords([]);
          return;
        }

        const newCzml = handleCommandInput(input, parsedCzml);
        setCzml(newCzml); // 🔧 这里只调用一次
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
  }, [czmlText, currentCommandName, interactiveStepIndex, interactiveParams, setCzml, completeCommand]);

  const getCurrentStep = useCallback(() => {
    const command = getInteractiveCommand(currentCommandName!);
    return command?.steps[interactiveStepIndex] ?? null;
  }, [currentCommandName, interactiveStepIndex]);

  const isCurrentStepInputType = useCallback((type: string) => {
    const step = getCurrentStep();
    return step?.inputType === type;
  }, [getCurrentStep]);

  const handleCoordinateSelected = useCallback(({ lon, lat }: { lon: number; lat: number }) => {
    if (isCurrentStepInputType("coordinates[]")) {
      setInteractiveCoords(prev => [...prev, { lon, lat }]);
    } else if (isCurrentStepInputType("coordinate")) {
      const coordStr = `${lon.toFixed(6)},${lat.toFixed(6)}`;
      setCommandInput(coordStr);
      setInteractiveCoords([{ lon, lat }]);
      maintainInputFocus();
    }
  }, [isCurrentStepInputType, maintainInputFocus]);

  const handleEntityPicked = useCallback((id: string) => {
    if (!isCurrentStepInputType("entityId")) return;
    setCommandInput(id);
    maintainInputFocus();
  }, [isCurrentStepInputType, maintainInputFocus]);

  const finalizeCoordinatesStep = useCallback(() => {
    if (!isCurrentStepInputType("coordinates[]")) return;

    const coordStr = interactiveCoords.map(p => `${p.lon.toFixed(6)},${p.lat.toFixed(6)}`).join(" ");
    setCommandInput(coordStr);
    setTimeout(() => {
      if (inputRef?.current) {
        inputRef.current.focus();
      }
    }, 100);
  }, [isCurrentStepInputType, interactiveCoords, inputRef]);

  return {
    czmlText,
    setCzmlText,
    prompt,
    commandInput,
    setCommandInput,
    handleCommand,
    handleCoordinateSelected,
    interactiveCoords,
    finalizeCoordinatesStep,
    handleEntityPicked,
    error,
    currentInputType: getCurrentInputType()
  };
};