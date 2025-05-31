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

// 🔧 更健壮的focus工具函数，带重试机制
const focusCommandInput = (delay = 100, maxRetries = 3) => {
  let retryCount = 0;
  
  const tryFocus = () => {
    const input = document.querySelector('input[data-command-input="true"]') as HTMLInputElement;
    if (input) {
      input.focus();
      console.log("🎯 Hook聚焦输入框成功");
      return true;
    } else {
      retryCount++;
      if (retryCount < maxRetries) {
        console.log(`🔄 Hook重试聚焦 (${retryCount}/${maxRetries})`);
        setTimeout(tryFocus, 50); // 短间隔重试
      } else {
        console.warn("⚠️ Hook聚焦失败：未找到命令输入框");
      }
      return false;
    }
  };
  
  setTimeout(tryFocus, delay);
};

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
    
    // 🔧 使用统一的focus函数
    focusCommandInput(150);
  }, [czml, setCzml, resetCommand]);

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
          // 🔧 开始交互命令后聚焦
          focusCommandInput(100);
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
      } else {
        // 🔧 进入下一步后聚焦
        focusCommandInput(100);
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