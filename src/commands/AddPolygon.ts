// src/commands/AddPolygon.ts
import type { CommandDef, CzmlEntity, CommandInputValue } from "../commandSystem/types";

// 🔧 坐标转换函数，支持多种输入格式
function transformPolygonCoordinates(input: CommandInputValue): number[] {
  if (typeof input === "string") {
    // 字符串情况: 例如 "130,30 135,35 135,30"
    const parts = input.trim().split(/\s+/); // 空格分割
    const coords: number[] = [];
    
    for (const pair of parts) {
      const [lon, lat] = pair.split(",").map(Number);
      if (!isNaN(lon) && !isNaN(lat)) {
        coords.push(lon, lat, 0); // 默认高度为 0
      }
    }
    
    // 多边形需要至少3个点
    if (coords.length < 9) { // 3个点 * 3个坐标值
      throw new Error("多边形需要至少3个点");
    }
    
    return coords;
  }

  if (Array.isArray(input)) {
    // 多次点击地图，得到多个点
    if (input.length < 3) {
      throw new Error("多边形需要至少3个点");
    }
    return input.flatMap(p => [p.lon, p.lat, 0]);
  }

  if (typeof input === "object" && input !== null) {
    // 单点点击地图的情况（不应该发生，但要处理）
    throw new Error("多边形需要多个点，请继续点击地图添加更多点");
  }

  throw new Error("无效的坐标输入");
}

const AddPolygon: CommandDef = {
  name: "AddPolygon",
  category: "geometry",
  
  parse(tokens) {
    const coords: number[] = [];
    
    // 解析格式: AddPolygon lon1,lat1 lon2,lat2 lon3,lat3 ...
    for (let i = 1; i < tokens.length; i++) {
      const pair = tokens[i].split(",");
      if (pair.length !== 2) continue;
      
      const lon = parseFloat(pair[0]);
      const lat = parseFloat(pair[1]);
      
      if (!isNaN(lon) && !isNaN(lat)) {
        coords.push(lon, lat, 0); // 默认高度为 0
      }
    }

    if (coords.length < 9) return null; // 至少需要3个点（9个值）
    
    return {
      type: "AddPolygon",
      params: { coords },
    };
  },
  
  execute(cmd, czml) {
    const { coords } = cmd.params as { coords: number[] };

    const newEntity: CzmlEntity = {
      id: `polygon-${Date.now()}`,
      polygon: {
        positions: {
          cartographicDegrees: coords,
        },
        material: {
          solidColor: {
            color: {
              rgba: [255, 255, 0, 128], // 半透明黄色
            },
          },
        },
        outline: true,
        outlineColor: {
          rgba: [255, 255, 0, 255], // 黄色边框
        },
        outlineWidth: 2,
        height: 0,
        extrudedHeight: 0,
        perPositionHeight: false,
        closeTop: true,
        closeBottom: true,
      },
    };

    return [...czml, newEntity];
  },
  
  interactive: {
    steps: [
      {
        key: "coords",
        prompt: "请点击地图输入多个点形成多边形（至少3个点），完成后右键或按完成按钮",
        inputType: "coordinates[]",
        transform: transformPolygonCoordinates,
        validate: (input: string) => {
          // 对于地图点击输入，这个验证函数可能不会被调用
          // 但如果是文本输入，需要验证格式
          if (!input.trim()) return false;
          
          const parts = input.trim().split(/\s+/);
          if (parts.length < 3) return false;
          
          for (const pair of parts) {
            const coords = pair.split(",");
            if (coords.length !== 2) return false;
            
            const lon = parseFloat(coords[0]);
            const lat = parseFloat(coords[1]);
            if (isNaN(lon) || isNaN(lat)) return false;
          }
          
          return true;
        }
      },
      {
        key: "fillColor",
        prompt: "请输入填充颜色 (R,G,B,A) 或按回车使用默认黄色：",
        transform: (input) => {
          if (typeof input === "string") {
            const trimmed = input.trim();
            if (!trimmed) {
              return [255, 255, 0, 128]; // 默认半透明黄色
            }
            
            const parts = trimmed.split(",").map(Number);
            if (parts.length === 4 && parts.every(n => !isNaN(n) && n >= 0 && n <= 255)) {
              return parts;
            }
            
            // 如果只提供 RGB，默认 alpha 为 128
            if (parts.length === 3 && parts.every(n => !isNaN(n) && n >= 0 && n <= 255)) {
              return [...parts, 128];
            }
          }
          
          return [255, 255, 0, 128]; // 默认值
        }
      },
      {
        key: "extrudedHeight",
        prompt: "请输入拉伸高度（可选，0为不拉伸）：",
        transform: (input) => {
          if (typeof input === "string") {
            const height = parseFloat(input);
            return isNaN(height) ? 0 : Math.max(0, height);
          }
          return 0;
        }
      },
    ],
    
    onComplete(params, czml) {
      const { 
        coords, 
        fillColor = [255, 255, 0, 128],
        extrudedHeight = 0 
      } = params as {
        coords: number[];
        fillColor?: number[];
        extrudedHeight?: number;
      };

      const newEntity: CzmlEntity = {
        id: `polygon-${Date.now()}`,
        polygon: {
          positions: {
            cartographicDegrees: coords,
          },
          material: {
            solidColor: {
              color: {
                rgba: fillColor,
              },
            },
          },
          outline: true,
          outlineColor: {
            rgba: [fillColor[0], fillColor[1], fillColor[2], 255], // 使用相同颜色但不透明的边框
          },
          outlineWidth: 2,
          height: 0,
          extrudedHeight: extrudedHeight,
          perPositionHeight: false,
          closeTop: true,
          closeBottom: true,
        },
      };

      return [...czml, newEntity];
    },
  },
};

export default AddPolygon;