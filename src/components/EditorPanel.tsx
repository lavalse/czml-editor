// src/components/EditorPanel.tsx
import { useState } from "react";

interface Props {
  onUpdate: (czml: Record<string, unknown>[]) => void;
}

const EditorPanel = ({ onUpdate }: Props) => {
  const [text, setText] = useState(`[
    {
      "id": "document",
      "name": "CZML Path",
      "version": "1.0"
    },
    {
      "id": "point1",
      "position": {
        "cartographicDegrees": [139.767, 35.6814, 100]
      },
      "point": {
        "pixelSize": 10,
        "color": { "rgba": [255, 0, 0, 255] }
      }
    }
  ]`);

  const handleApply = () => {
    try {
      const parsed = JSON.parse(text);
      onUpdate(parsed);
    } catch {
      alert("CZML 格式有误！");
    }
  };

  return (
    <div style={{ padding: "16px", height: "100%", boxSizing: "border-box" }}>
      <h3>CZML 编辑器</h3>
      <textarea
        style={{ width: "100%", height: "60%" }}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button onClick={handleApply} style={{ marginTop: "12px" }}>
        应用到地图
      </button>
    </div>
  );
};

export default EditorPanel;
