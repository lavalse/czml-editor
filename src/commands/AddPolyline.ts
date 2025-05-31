// src/commands/AddPolyline.ts
import type { CommandDef, CzmlEntity } from "../commandSystem/types";

function transformCoordinatesInput(
  input: string | { lon: number; lat: number } | { lon: number; lat: number }[]
): number[] {
  if (typeof input === "string") {
    // 字符串情况: 例如 "130,30 135,35"
    const parts = input.trim().split(/\s+/); // 空格分割
    return parts.flatMap(pair => {
      const [lon, lat] = pair.split(",").map(Number);
      return [lon, lat, 0]; // 默认高度为 0
    });
  }

  if (Array.isArray(input)) {
    // 多次点击地图，得到多个点
    return input.flatMap(p => [p.lon, p.lat, 0]);
  }

  // 单点点击地图的情况
  return [input.lon, input.lat, 0];
}


const AddPolyline: CommandDef = {
  name: "AddPolyline",
  parse(tokens) {
    const coords: number[] = [];
    for (let i = 1; i < tokens.length; i++) {
      const pair = tokens[i].split(",");
      if (pair.length !== 2) continue;
      const lon = parseFloat(pair[0]);
      const lat = parseFloat(pair[1]);
      if (!isNaN(lon) && !isNaN(lat)) {
        coords.push(lon, lat, 0); // 默认高度为 0
      }
    }

    if (coords.length < 6) return null; // 至少两个点
    return {
      type: "AddPolyline",
      params: { coords },
    };
  },
  execute(cmd, czml) {
    const { coords } = cmd.params as { coords: number[] };

    const newEntity: CzmlEntity = {
      id: `polyline-${Date.now()}`,
      polyline: {
        positions: {
          cartographicDegrees: coords,
        },
        material: {
          solidColor: {
            color: {
              rgba: [0, 255, 255, 255],
            },
          },
        },
        width: 3,
        clampToGround: true,
      },
    };

    return [...czml, newEntity];
  },
  interactive: {
    steps: [
      {
        key: "coords",
        prompt: "请点击地图输入多个点，完成后按完成按钮",
        inputType: "coordinates[]", // 你需要支持 coordinates[] 类型的交互输入
        transform: transformCoordinatesInput // 默认高度为 0
      },
      {
        key: "width",
        prompt: "请输入线宽（可选）：",
        transform: v => {
          if (typeof v === "string") {
            const parsed = parseFloat(v);
            return isNaN(parsed) ? 3 : parsed;
          }
          return 3; // 如果用户通过地图交互给了对象，也返回默认值
        }
      },
    ],
    onComplete(params, czml) {
      const { coords, width = 3 } = params as {
        coords: number[];
        width?: number;
      };

      const newEntity: CzmlEntity = {
        id: `polyline-${Date.now()}`,
        polyline: {
          positions: {
            cartographicDegrees: coords,
          },
          material: {
            solidColor: {
              color: { rgba: [0, 255, 255, 255] },
            },
          },
          width,
          clampToGround: true,
        },
      };

      return [...czml, newEntity];
    },
  },
};

export default AddPolyline;
