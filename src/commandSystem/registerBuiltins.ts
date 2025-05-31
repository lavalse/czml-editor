// src/commandSystem/registerBuiltins.ts
import AddPoint from "../commands/AddPoint";
import RemoveEntity from "../commands/RemoveEntity";
import { registerCommand } from "./registry";

export function registerBuiltinCommands() {
  [
    AddPoint,
    RemoveEntity,
    // 更多命令模块
  ].forEach(registerCommand);
}
