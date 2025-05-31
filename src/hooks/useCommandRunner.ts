// src/hooks/useCommandRunner.ts
import { useEffect, useCallback } from "react";
import { handleCommandInput, getInteractiveCommand } from "../commandSystem/registry";
import { registerBuiltinCommands } from "../commandSystem/registerBuiltins";
import type { CzmlEntity } from "../commandSystem/types";
import { safeParseCzml } from "../utils/json";
import { useCzmlStore } from "../stores/useCZMLStore";
import { useCommandStore, selectCurrentInputType, selectIsWaitingForInput } from "../stores/useCommandStore";

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

  // Command Store - 使用 selectors 避免无限重渲染
  const {
    currentCommandName,
    prompt,
    commandInput,
    interactiveCoords,
    error,
    setCommandInput,
    setError,
    startInteractiveCommand,
    nextStep,
    resetCommand,
    addInteractiveCoord,
  } = useCommandStore();

  // 使用 selectors 获取计算后的状态
  const currentInputType = useCommandStore(selectCurrentInputType);
  const isWaitingForInput = useCommandStore(selectIsWaitingForInput);

  // 初始化命令系统
  useEffect(() => {
    registerBuiltinCommands();
  }, []);

  // 通知父组件更新
  useEffect(() => {
    onUpdate(czml);
  }, [czml]);

  // 自动聚焦输入框的辅助函数
  const focusInput = useCallback(() => {
    setTimeout(() => {
      if (inputRef?.current) {
        inputRef.current.focus();
      }
    }, 100);
  }, [inputRef]);

  // 完成命令执行
  const completeCommand = useCallback(() => {
    if (!currentCommandName) return;
    
    const command = getInteractiveCommand(currentCommandName);
    if (!command) return;
    
    const state = useCommandStore.getState();
    const newCzml = command.onComplete(state.interactiveParams, czml);
    setCzml(newCzml);
    
    resetCommand();
    focusInput();
  }, [currentCommandName, czml, setCzml, resetCommand, focusInput]);

  // 处理命令输入
  const handleCommand = useCallback((input: string) => {
    try {
      // 清除之前的错误
      if (error) {
        setError(null);
      }

      const parsedCzml = safeParseCzml(czmlText) as CzmlEntity[];
      if (!parsedCzml) {
        setError("当前 CZML 内容格式不正确，无法执行命令");
        return;
      }

      if (!isWaitingForInput) {
        // 新命令 - 检查是否是交互式命令
        const interactive = getInteractiveCommand(input);
        if (interactive) {
          startInteractiveCommand(input);
          return;
        }

        // 非交互式命令 - 直接执行
        const newCzml = handleCommandInput(input, parsedCzml);
        setCzml(newCzml);
        return;
      }

      // 交互式命令的下一步
      const hasNextStep = nextStep(input);
      if (!hasNextStep) {
        // 完成了所有步骤，执行命令
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

  // 处理地图坐标选择
  const handleCoordinateSelected = useCallback(({ lon, lat }: { lon: number; lat: number }) => {
    console.log("🎯 处理坐标选择:", { lon, lat, currentInputType });
    
    if (currentInputType === "coordinates[]") {
      addInteractiveCoord({ lon, lat });
      console.log("📍 添加坐标到数组");
    } else if (currentInputType === "coordinate") {
      const coordStr = `${lon.toFixed(6)},${lat.toFixed(6)}`;
      setCommandInput(coordStr);
      focusInput();
      console.log("📍 设置单个坐标:", coordStr);
    }
  }, [currentInputType, addInteractiveCoord, setCommandInput, focusInput]);

  // 处理实体选择
  const handleEntityPicked = useCallback((id: string) => {
    if (currentInputType === "entityId") {
      setCommandInput(id);
      focusInput();
    }
  }, [currentInputType, setCommandInput, focusInput]);

  // 完成坐标数组输入
  const finalizeCoordinatesStep = useCallback(() => {
    if (currentInputType !== "coordinates[]") return;

    const coordStr = interactiveCoords
      .map(p => `${p.lon.toFixed(6)},${p.lat.toFixed(6)}`)
      .join(" ");
    
    setCommandInput(coordStr);
    focusInput();
  }, [currentInputType, interactiveCoords, setCommandInput, focusInput]);

  return {
    // CZML 相关
    czmlText,
    setCzmlText,
    
    // 命令相关
    prompt,
    commandInput,
    setCommandInput,
    handleCommand,
    
    // 交互相关
    handleCoordinateSelected,
    handleEntityPicked,
    finalizeCoordinatesStep,
    interactiveCoords,
    
    // 状态
    error,
    currentInputType
  };
};