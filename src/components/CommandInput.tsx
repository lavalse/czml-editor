// src/components/CommandInput.tsx
import type { RefObject } from "react";
import { useEffect, useState, useCallback } from "react";
import { useUnifiedInput } from "../providers/UnifiedInputProvider";
import { KEYS } from "../hooks/useKeyboardManager";

interface Props {
  prompt: string;
  value: string;
  onChange: (value: string) => void;
  onEnter: () => void;
  inputRef: RefObject<HTMLInputElement | null>;
  commandHistory: string[];
}

const CommandInput = ({ prompt, value, onChange, onEnter, inputRef, commandHistory }: Props) => {
  const { registerKeyBinding } = useUnifiedInput();
  
  // 历史记录导航状态
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [tempInput, setTempInput] = useState("");

  // 重置历史记录索引
  useEffect(() => {
    setHistoryIndex(-1);
  }, [commandHistory.length]);

  // 当值改变时，如果不是通过历史导航改变的，重置历史索引
  useEffect(() => {
    if (historyIndex === -1) {
      setTempInput(value);
    }
  }, [value, historyIndex]);

  // 使用统一输入系统注册键盘事件
  useEffect(() => {
    // 只在输入框获得焦点时激活这些快捷键
    const isFocused = () => document.activeElement === inputRef.current;
    
    const unsubscribers: (() => void)[] = [];

    // Enter - 执行命令
    unsubscribers.push(
      registerKeyBinding({
        key: KEYS.ENTER,
        description: '执行命令',
        context: 'global', // 改为 global，因为我们用 isFocused 检查
        preventDefault: true,
        action: () => {
          if (!isFocused()) return;
          console.log("⌨️ Enter 键被按下，执行命令");
          onEnter();
          onChange("");
          setHistoryIndex(-1);
          setTempInput("");
        }
      })
    );

    // 上箭头 - 历史记录向上
    unsubscribers.push(
      registerKeyBinding({
        key: KEYS.ARROW_UP,
        description: '上一条命令',
        context: 'global', // 改为 global
        preventDefault: true,
        action: () => {
          if (!isFocused()) return;
          
          // 保存当前输入（如果是第一次按上键）
          if (historyIndex === -1 && value) {
            setTempInput(value);
          }
          
          // 向上导航历史记录
          if (commandHistory.length > 0) {
            const newIndex = historyIndex === -1 
              ? commandHistory.length - 1 
              : Math.max(0, historyIndex - 1);
            
            setHistoryIndex(newIndex);
            onChange(commandHistory[newIndex]);
          }
        }
      })
    );

    // 下箭头 - 历史记录向下
    unsubscribers.push(
      registerKeyBinding({
        key: KEYS.ARROW_DOWN,
        description: '下一条命令',
        context: 'global', // 改为 global
        preventDefault: true,
        action: () => {
          if (!isFocused()) return;
          
          // 向下导航历史记录
          if (historyIndex > -1) {
            const newIndex = historyIndex + 1;
            
            if (newIndex >= commandHistory.length) {
              // 回到当前输入
              setHistoryIndex(-1);
              onChange(tempInput);
            } else {
              setHistoryIndex(newIndex);
              onChange(commandHistory[newIndex]);
            }
          }
        }
      })
    );

    // Escape - 清空输入
    unsubscribers.push(
      registerKeyBinding({
        key: KEYS.ESCAPE,
        description: '清空输入',
        context: 'global', // 改为 global
        action: () => {
          if (!isFocused()) return;
          onChange("");
          setHistoryIndex(-1);
          setTempInput("");
        }
      })
    );

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [
    value, 
    commandHistory, 
    historyIndex, 
    tempInput, 
    onChange, 
    onEnter, 
    registerKeyBinding,
    inputRef
  ]);

  // 根据 prompt 生成更友好的 placeholder
  const getPlaceholder = () => {
    // 如果是默认提示，显示通用的命令提示
    if (prompt === "请输入命令:") {
      return "输入命令";
    }
    // 否则直接使用 prompt 作为 placeholder
    return prompt.replace(/[:：]$/, '...'); // 移除末尾的冒号并添加省略号
  };

  return (
    <div style={{ width: "100%" }}>
      <div style={{ 
        position: "relative", 
        marginBottom: "12px",
        width: "100%"
      }}>
        <input
          ref={inputRef}
          data-command-input="true"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setHistoryIndex(-1); // 用户输入时重置历史索引
          }}
          placeholder={getPlaceholder()}
          style={{
            width: "100%",
            padding: "10px 40px 10px 12px", // 右侧留出空间给历史索引
            fontFamily: "monospace",
            fontSize: "14px",
            background: "#1a1a1a",
            color: "#0f0",
            border: "1px solid #333",
            borderRadius: "4px",
            outline: "none",
            transition: "border-color 0.2s",
            boxSizing: "border-box", // 确保 padding 包含在宽度内
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "#555";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#333";
          }}
        />
        {historyIndex > -1 && (
          <div style={{
            position: "absolute",
            right: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: "11px",
            color: "#666",
            pointerEvents: "none"
          }}>
            [{historyIndex + 1}/{commandHistory.length}]
          </div>
        )}
      </div>
      <div style={{
        fontSize: "12px",
        color: "#555",
        fontFamily: "monospace",
        textAlign: "center"
      }}>
        ↑/↓ 浏览历史 | Enter 执行 | Esc 清空 | Ctrl+K 聚焦
      </div>
    </div>
  );
};

export default CommandInput;