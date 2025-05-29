// src/commandSystem/registry.ts
import type { CommandDef, CzmlEntity } from "./types";

const commandRegistry: Record<string, CommandDef> = {};

export function registerCommand(def: CommandDef) {
  commandRegistry[def.name] = def;
}

export function getCommand(name: string): CommandDef | undefined {
  return commandRegistry[name];
}

export function getInteractiveCommand(name: string) {
  return commandRegistry[name]?.interactive ?? null;
}

export function handleCommandInput(input: string, czml: CzmlEntity[]): CzmlEntity[] {
  const tokens = input.trim().split(/\s+/);
  const name = tokens[0];
  const command = commandRegistry[name];

  if (!command || !command.parse || !command.execute) {
    alert(`未知命令：${name}`);
    return czml;
  }

  const cmd = command.parse(tokens);
  if (!cmd) {
    alert("命令参数错误");
    return czml;
  }

  return command.execute(cmd, czml);
}
