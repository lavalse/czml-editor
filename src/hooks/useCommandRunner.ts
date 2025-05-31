// src/hooks/useCommandRunner.ts
import { useEffect, useCallback } from "react";
import { handleCommandInput, getInteractiveCommand } from "../commandSystem/registry";
import { registerBuiltinCommands } from "../commandSystem/registerBuiltins";
import type { CzmlEntity } from "../commandSystem/types";
import { safeParseCzml } from "../utils/json";
import { useCzmlStore } from "../stores/useCzmlStore";
import { useCommandStore, selectIsWaitingForInput } from "../stores/useCommandStore";

interface Options {
  onUpdate: (czml: Record<string, unknown>[]) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export const useCommandRunner = ({ onUpdate, inputRef }: Options) => {
  // CZML Store
  const czml = useCzmlStore((state) => state.czml);
  const czmlText = useCzmlStore((state) => state.czmlText);
  const setCzml = useCzmlStore((state) => state.setCzml);
  const setCzmlText = useCzmlStore((state) => state.setCzmlText);

  // Command Store - 🔧 只获取需要的状态
  const {
    prompt,
    commandInput,
    error,
    setCommandInput,
    setError,
    startInteractiveCommand,
    nextStep,
    resetCommand,
  } = useCommandStore();

  const isWaitingForInput = useCommandStore(selectIsWaitingForInput);

  // 初始化命令系统
  useEffect(() => {
    registerBuiltinCommands();
  }, []);

  // 通知父组件更新
  useEffect(() => {
    onUpdate(czml);
  }, [czml]);

  // 🔧 简化的完成命令逻辑
  const completeCommand = useCallback(() => {
    const state = useCommandStore.getState();
    if (!state.currentCommandName) return;
    
    const command = getInteractiveCommand(state.currentCommandName);
    if (!command) return;
    
    const newCzml = command.onComplete(state.interactiveParams, czml);
    setCzml(newCzml);
    resetCommand();
    
    // 聚焦输入框
    setTimeout(() => {
      if (inputRef?.current) {
        inputRef.current.focus();
      }
    }, 100);
  }, [czml, setCzml, resetCommand, inputRef]);

  // 🔧 简化的命令处理逻辑
  const handleCommand = useCallback((input: string) => {
    try {
      if (error) {
        setError(null);
      }

      const parsedCzml = safeParseCzml(czmlText) as CzmlEntity[];
      if (!parsedCzml) {
        setError("当前 CZML 内容格式不正确，无法执行命令");
        return;
      }

      if (!isWaitingForInput) {
        // 新命令
        const interactive = getInteractiveCommand(input);
        if (interactive) {
          startInteractiveCommand(input);
          return;
        }

        // 非交互式命令
        const newCzml = handleCommandInput(input, parsedCzml);
        setCzml(newCzml);
        return;
      }

      // 交互式命令的下一步
      const hasNextStep = nextStep(input);
      if (!hasNextStep) {
        completeCommand();
      }
    } catch (err) {
      setError("命令执行出错: " + (err instanceof Error ? err.message : String(err)));
    }
  }, [
    error, 
    setError, 
    czmlText, 
    isWaitingForInput, 
    startInteractiveCommand, 
    setCzml, 
    nextStep, 
    completeCommand
  ]);

  return {
    // 🔧 只返回必要的状态和方法
    czmlText,
    setCzmlText,
    prompt,
    commandInput,
    setCommandInput,
    handleCommand,
    error,
  };
};