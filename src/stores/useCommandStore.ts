// src/stores/useCommandStore.ts
import { create } from 'zustand';
import { getInteractiveCommand } from '../commandSystem/registry';
import type { InteractiveCommandDef } from '../commandSystem/types';

interface CommandStore {
  // 当前命令状态
  currentCommandName: string | null;
  interactiveStepIndex: number;
  interactiveParams: Record<string, unknown>;
  
  // UI 状态
  prompt: string;
  commandInput: string;
  interactiveCoords: { lon: number; lat: number }[];
  error: string | null;
  
  // Actions
  setCommandInput: (input: string) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // 命令流程控制
  startInteractiveCommand: (commandName: string) => void;
  nextStep: (value: unknown) => boolean; // 返回是否还有下一步
  resetCommand: () => void;
  
  // 坐标相关
  addInteractiveCoord: (coord: { lon: number; lat: number }) => void;
  clearInteractiveCoords: () => void;
}

export const useCommandStore = create<CommandStore>((set, get) => ({
  // 初始状态
  currentCommandName: null,
  interactiveStepIndex: 0,
  interactiveParams: {},
  prompt: "请输入命令:",
  commandInput: "",
  interactiveCoords: [],
  error: null,

  // 基础 Actions
  setCommandInput: (commandInput) => set({ commandInput }),
  
  setError: (error) => set({ error }),
  
  clearError: () => set({ error: null }),

  // 开始交互式命令
  startInteractiveCommand: (commandName) => {
    const command = getInteractiveCommand(commandName);
    if (!command) {
      set({ error: `未找到命令: ${commandName}` });
      return;
    }

    set({
      currentCommandName: commandName,
      interactiveStepIndex: 0,
      interactiveParams: {},
      prompt: command.steps[0].prompt,
      interactiveCoords: [],
      error: null,
      commandInput: ""
    });
  },

  // 进入下一步
  nextStep: (value) => {
    const state = get();
    const command = getInteractiveCommand(state.currentCommandName!);
    if (!command) return false;

    const step = command.steps[state.interactiveStepIndex];
    const transformedValue = step.transform ? step.transform(value) : value;
    
    const newParams = { 
      ...state.interactiveParams, 
      [step.key]: transformedValue 
    };

    const nextStepIndex = state.interactiveStepIndex + 1;
    
    if (nextStepIndex < command.steps.length) {
      // 还有下一步
      set({
        interactiveStepIndex: nextStepIndex,
        interactiveParams: newParams,
        prompt: command.steps[nextStepIndex].prompt,
        commandInput: ""
      });
      return true;
    } else {
      // 完成了所有步骤
      set({
        interactiveParams: newParams,
        commandInput: ""
      });
      return false;
    }
  },

  // 重置命令状态
  resetCommand: () => set({
    currentCommandName: null,
    interactiveStepIndex: 0,
    interactiveParams: {},
    prompt: "请输入命令:",
    commandInput: "",
    interactiveCoords: [],
    error: null
  }),

  // 坐标管理
  addInteractiveCoord: (coord) => set((state) => {
    // 🔧 防止重复添加相同的坐标
    const exists = state.interactiveCoords.some(
      existing => Math.abs(existing.lon - coord.lon) < 0.000001 && 
                  Math.abs(existing.lat - coord.lat) < 0.000001
    );
    
    if (exists) {
      return state; // 不添加重复坐标
    }
    
    return {
      interactiveCoords: [...state.interactiveCoords, coord]
    };
  }),

  clearInteractiveCoords: () => set({ interactiveCoords: [] }),
}));

// Selectors - 用于在组件中安全地获取计算后的状态
export const selectCurrentInputType = (state: CommandStore): "coordinate" | "entityId" | "coordinates[]" | null => {
  if (!state.currentCommandName) return null;
  
  const command = getInteractiveCommand(state.currentCommandName);
  if (!command) return null;
  
  const step = command.steps[state.interactiveStepIndex];
  return step?.inputType || null;
};

export const selectIsWaitingForInput = (state: CommandStore): boolean => {
  return state.currentCommandName !== null;
};