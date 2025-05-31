// src/utils/json.ts

export function safeParseCzml(text: string): Record<string, unknown>[] | null {
  try {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) {
      console.warn("CZML 格式应为数组");
      return null;
    }
    return parsed;
  } catch (e) {
    console.warn("CZML 解析失败:", e);
    return null;
  }
}
