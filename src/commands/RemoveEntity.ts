// src/commands/RemoveEntity.ts
import type { CommandDef } from "../commandSystem/types";

const RemoveEntity: CommandDef = {
  name: "RemoveEntity",

  interactive: {
    steps: [
      {
        key: "id",
        prompt: "请输入要删除的实体ID，或点击地图上的实体：",
        inputType: "entityId",
        transform: (input) => {
          if (typeof input === "string") {
            return input.trim();
          }
          return String(input).trim();
        },
      }
    ],

    onComplete(params, czml) {
      const { id } = params as { id: string };

      if (!id) {
        alert("未输入有效的实体 ID");
        return czml;
      }

      const newCzml = czml.filter(entity => entity.id !== id);

      if (newCzml.length === czml.length) {
        alert(`未找到 ID 为 ${id} 的实体`);
      }

      return newCzml;
    },
  },
};

export default RemoveEntity;