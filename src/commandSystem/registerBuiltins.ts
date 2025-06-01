// src/commandSystem/registerBuiltins.ts
import AddPoint from "../commands/AddPoint";
import AddPolygon from "../commands/AddPolygon";
import AddPolyline from "../commands/AddPolyline";
import RemoveEntity from "../commands/RemoveEntity";
import { registerCommand } from "./registry";

export function registerBuiltinCommands() {
  [
    AddPoint,
    RemoveEntity,
    AddPolyline,
    AddPolygon,
    // 更多命令模块
  ].forEach(registerCommand);
}
