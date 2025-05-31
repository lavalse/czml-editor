// src/components/CommandInput.tsx
import type { RefObject } from "react";
import { useEffect } from "react";

interface Props {
  prompt: string;
  value: string;
  onChange: (value: string) => void;
  onEnter: () => void;
  inputRef: RefObject<HTMLInputElement | null>;
}

const CommandInput = ({ prompt, value, onChange, onEnter, inputRef }: Props) => {
  // 🔧 确保组件挂载后输入框可被找到
  useEffect(() => {
    console.log("📝 CommandInput 组件已挂载/更新");
  }, []);

  return (
    <>
      <p>{prompt}</p>
      <input
        ref={inputRef}
        data-command-input="true"  // 🔧 添加这个属性
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onEnter();
            onChange(""); // 清空输入框
          }
        }}
        placeholder=""
        style={{
          width: "100%",
          padding: "8px",
          marginBottom: "12px",
          fontFamily: "monospace",
          background: "#111",
          color: "#0f0",
          border: "1px solid #444",
          borderRadius: "4px",
        }}
      />
    </>
  );
};

export default CommandInput;