// src/commandSystem/types.ts

export interface CzmlEntity {
  id: string;
  [key: string]: unknown;
}

export interface CommandInstance {
  type: string;
  params: Record<string, unknown>;
}

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

export interface InteractiveStep {
  key: string;
  prompt: string;
  transform?: (input: string) => unknown;
  validate?: (input: string) => boolean;
  inputType?: "coordinate" | "entityId" ;
}
