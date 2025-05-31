// src/commands/AddPoint.ts
import type { CommandDef, CzmlEntity } from "../commandSystem/types";

const AddPoint: CommandDef = {
  name: "AddPoint",
  parse(tokens) {
    const params: Record<string, number> = {};
    for (let i = 1; i < tokens.length; i += 2) {
      const key = tokens[i].replace("-", "");
      const val = parseFloat(tokens[i + 1]);
      if (!isNaN(val)) params[key] = val;
    }

    if (params.lon == null || params.lat == null) return null;

    return {
      type: "AddPoint",
      params,
    };
  },
  execute(cmd, czml) {
    const { lon, lat, height = 0 } = cmd.params as {
      lon: number;
      lat: number;
      height?: number;
    };

    const newEntity: CzmlEntity = {
      id: `point-${Date.now()}`,
      position: { cartographicDegrees: [lon, lat, height] },
      point: {
        pixelSize: 10,
        color: { rgba: [255, 0, 0, 255] },
      },
    };

    return [...czml, newEntity];
  },
  interactive: {
    steps: [
      {
        key: "coord",
        prompt: "请输入坐标 (lon,lat)，或点击地图选择",
        inputType: "coordinate",
        transform: (input) => {
          // 🔧 使用类型守卫来处理不同的输入类型
          if (typeof input === "string") {
            const [lon, lat] = input.split(",").map(Number);
            return { lon, lat };
          }
          if (typeof input === "object" && input !== null && !Array.isArray(input)) {
            return input; // 地图点击传入的对象
          }
          throw new Error("无效的坐标输入");
        },
      },
      { 
        key: "height", 
        prompt: "请输入高度 (可选):", 
        transform: (input) => {
          if (typeof input === "string") {
            return parseFloat(input) || 0;
          }
          return 0;
        }
      },
      { 
        key: "size", 
        prompt: "请输入点大小 (可选):", 
        transform: (input) => {
          if (typeof input === "string") {
            return parseInt(input) || 10;
          }
          return 10;
        }
      },
    ],
    onComplete(params, czml) {
      const { coord, height = 0, size = 10 } = params as {
        coord: { lon: number; lat: number };
        height?: number;
        size?: number;
      };

      const newEntity: CzmlEntity = {
        id: `point-${Date.now()}`,
        position: { cartographicDegrees: [coord.lon, coord.lat, height] },
        point: {
          pixelSize: size,
          color: { rgba: [255, 0, 0, 255] },
        },
      };

      return [...czml, newEntity];
    }
  },
};

export default AddPoint;