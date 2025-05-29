// src/commands/RemoveEntity.ts
import type { CommandDef } from "../commandSystem/types";

const RemoveEntity: CommandDef = {
  name: "RemoveEntity",
  category: "system",
  parse(tokens) {
    const id = tokens[1];
    return id ? { type: "RemoveEntity", params: { id } } : null;
  },
  execute(cmd, czml) {
    const { id } = cmd.params as { id: string };
    return czml.filter((e) => e.id !== id);
  },
};

export default RemoveEntity;
