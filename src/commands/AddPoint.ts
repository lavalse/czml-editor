// src/commands/AddPoint.ts
import type { CommandDef, CzmlEntity } from "../commandSystem/types";

const AddPoint: CommandDef = {
  name: "AddPoint",
  category: "geometry",
  parse(tokens) {
    const params: Record<string, number> = {};
    for (let i = 1; i < tokens.length; i += 2) {
      const key = tokens[i].replace("-", "");
      const val = parseFloat(tokens[i + 1]);
      if (!isNaN(val)) params[key] = val;
    }
    if (params.lon == null || params.lat == null) return null;
    return { type: "AddPoint", params };
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
      point: { pixelSize: 10, color: { rgba: [255, 0, 0, 255] } },
    };
    return [...czml, newEntity];
  },
};

export default AddPoint;
