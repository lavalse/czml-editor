// src/commandSystem.ts

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
}

const commandRegistry: Record<string, CommandDef> = {};

export function registerCommand(def: CommandDef) {
  commandRegistry[def.name] = def;
}

// Function to get a command definition (NEW)
export function getCommand(name: string): CommandDef | null {
  return commandRegistry[name] || null;
}

export function handleCommandInput(
  input: string,
  czml: CzmlEntity[]
): CzmlEntity[] {
  const tokens = input.trim().split(/\s+/);
  const name = tokens[0];
  const command = commandRegistry[name];

  if (!command || !command.parse || !command.execute) {
    alert(`未知命令：${name}`);
    return czml;
  }

  const cmd = command.parse(tokens);
  if (!cmd) {
    alert(`命令参数错误`);
    return czml;
  }

  return command.execute(cmd, czml);
}

export function getInteractiveCommand(name: string): InteractiveCommandDef | null {
  const command = commandRegistry[name];
  return command?.interactive ?? null;
}

export function registerBuiltinCommands() {
  // AddPoint Command (existing)
  registerCommand({
    name: "AddPoint",
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
        point: {
          pixelSize: 10,
          color: { rgba: [255, 0, 0, 255] },
        },
      };
      return [...czml, newEntity];
    },
    interactive: {
      steps: [
        { key: "lon", prompt: "请输入经度:", transform: parseFloat },
        { key: "lat", prompt: "请输入纬度:", transform: parseFloat },
        { key: "height", prompt: "请输入高度 (可选):", transform: (v) => parseFloat(v) || 0 },
        { key: "size", prompt: "请输入点大小 (可选):", transform: (v) => parseInt(v) || 10 },
      ],
      onComplete(params, czml) {
        const { lon, lat, height = 0, size = 10 } = params as {
          lon: number;
          lat: number;
          height?: number;
          size?: number;
        };
        const newEntity: CzmlEntity = {
          id: `point-${Date.now()}`,
          position: { cartographicDegrees: [lon, lat, height] },
          point: {
            pixelSize: size,
            color: { rgba: [255, 0, 0, 255] },
          },
        };
        return [...czml, newEntity];
      },
    },
  });

  // AddPolyline Command (should have been added in a previous step)
  // Ensure its definition is present here.
  registerCommand({
    name: "AddPolyline",
    parse(tokens) {
      if (tokens.length < 2 || tokens[1] !== "-positions") return null;
      const positionsStr = tokens.slice(2).join(" ");
      const positionPairs = positionsStr.split(/\s+/);
      if (positionPairs.length < 2) return null; // Need at least 2 points for a polyline

      const positions: number[][] = [];
      for (const pair of positionPairs) {
        const parts = pair.split(',');
        if (parts.length !== 2) return null; // Each position must be lon,lat
        const lon = parseFloat(parts[0]);
        const lat = parseFloat(parts[1]);
        if (isNaN(lon) || isNaN(lat)) return null; // Coords must be numbers
        positions.push([lon, lat, 0]); // Add height 0
      }
      return { type: "AddPolyline", params: { positions } };
    },
    execute(cmd, czml) {
      const { positions } = cmd.params as { positions: number[][] }; // Array of [lon, lat, height]
      if (!positions || positions.length < 2) return czml; // Not enough points

      // Flatten positions for cartographicDegrees: [lon1, lat1, h1, lon2, lat2, h2, ...]
      const cartographicDegrees = positions.reduce((acc, val) => acc.concat(val), []);

      const newEntity: CzmlEntity = {
        id: `polyline-${Date.now()}`,
        polyline: {
          positions: { cartographicDegrees },
          width: 2,
          material: { solidColor: { color: { rgba: [255, 255, 0, 255] } } }, // Yellow
        },
      };
      return [...czml, newEntity];
    },
    interactive: {
      steps: [
        {
          key: "points",
          prompt: "请输入折线的点序列 (格式: lon1,lat1 lon2,lat2 ...):",
          transform: (input: string) => {
            const positionPairs = input.trim().split(/\s+/);
            if (positionPairs.length < 2) return null;
            const positions: number[][] = [];
            for (const pair of positionPairs) {
              const parts = pair.split(',');
              if (parts.length !== 2) return null;
              const lon = parseFloat(parts[0]);
              const lat = parseFloat(parts[1]);
              if (isNaN(lon) || isNaN(lat)) return null;
              positions.push([lon, lat, 0]);
            }
            return positions;
          },
          validate: (input: string) => { // Basic validation
            const positionPairs = input.trim().split(/\s+/);
            return positionPairs.length >= 2 && positionPairs.every(pair => pair.includes(','));
          }
        },
      ],
      onComplete(params, czml) {
        const { points } = params as { points: number[][] };
        if (!points || points.length < 2) return czml;
        
        const cartographicDegrees = points.reduce((acc, val) => acc.concat(val), []);
        const newEntity: CzmlEntity = {
          id: `polyline-${Date.now()}`,
          polyline: {
            positions: { cartographicDegrees },
            width: 2,
            material: { solidColor: { color: { rgba: [255, 255, 0, 255] } } },
          },
        };
        return [...czml, newEntity];
      },
    },
  });
}
