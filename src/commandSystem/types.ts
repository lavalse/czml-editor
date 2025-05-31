// src/commandSystem/types.ts

export interface CzmlEntity {
  id: string;
  [key: string]: unknown;
}

export interface CommandInstance {
  type: string;
  params: Record<string, unknown>;
}

// 🔧 更具体的输入类型定义
export type CommandInputValue = 
  | string 
  | { lon: number; lat: number } 
  | { lon: number; lat: number }[];

export interface CommandDef {
  name: string;
  category?: string;
  parse?: (tokens: string[]) => CommandInstance | null;
  execute?: (cmd: CommandInstance, czml: CzmlEntity[]) => CzmlEntity[];
  interactive?: InteractiveCommandDef;
}

export interface InteractiveCommandDef {
  steps: InteractiveStep[];
  onComplete: (params: Record<string, unknown>, czml: CzmlEntity[]) => CzmlEntity[];
}

// 🔧 简化的步骤定义，使用联合类型而不是泛型
export interface InteractiveStep {
  key: string;
  prompt: string;
  transform?: (input: CommandInputValue) => unknown;
  validate?: (input: string) => boolean;
  inputType?: "coordinate" | "entityId" | "coordinates[]";
}