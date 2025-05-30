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
            transform: (input: string | { lon: number; lat: number }) => {
              if (typeof input === "string") {
                const [lon, lat] = input.split(",").map(Number);
                return { lon, lat };
              }
              return input; // 地图点击传入的对象
            },
            inputType:"coordinate"
          },
          { key: "height", prompt: "\u8bf7\u8f93\u5165\u9ad8\u5ea6 (\u53ef\u9009):", transform: (v) => parseFloat(v) || 0 },
          { key: "size", prompt: "\u8bf7\u8f93\u5165\u70b9\u5927\u5c0f (\u53ef\u9009):", transform: (v) => parseInt(v) || 10 },
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
