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

export function handleCommandInput(
  input: string,
  czml: CzmlEntity[]
): CzmlEntity[] {
  const tokens = input.trim().split(/\s+/);
  const name = tokens[0];
  const command = commandRegistry[name];

  if (!command || !command.parse || !command.execute) {
    alert(`\u672a\u77e5\u547d\u4ee4\uff1a${name}`);
    return czml;
  }

  const cmd = command.parse(tokens);
  if (!cmd) {
    alert(`\u547d\u4ee4\u53c2\u6570\u9519\u8bef`);
    return czml;
  }

  return command.execute(cmd, czml);
}

export function getInteractiveCommand(name: string): InteractiveCommandDef | null {
  const command = commandRegistry[name];
  return command?.interactive ?? null;
}

export function registerBuiltinCommands() {
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
          }
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
      },
    },
  });
}
