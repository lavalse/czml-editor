// src/providers/KeyboardShortcutsProvider.tsx
import { createContext, useContext, ReactNode, useEffect } from 'react';
import { useKeyboardManager, KEYS, type KeyBinding } from '../hooks/useKeyboardManager';
import { useCommandStore } from '../stores/useCommandStore';

interface KeyboardShortcutsContextType {
  registerKeyBinding: (binding: KeyBinding) => () => void;
  focusTarget: (selector: string, options?: {
    delay?: number;
    retries?: number;
    retryDelay?: number;
  }) => void;
  focusCommandInput: () => void;
  showShortcutsHelp: () => void;
}

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextType | null>(null);

export const useKeyboardShortcuts = () => {
  const context = useContext(KeyboardShortcutsContext);
  if (!context) {
    throw new Error('useKeyboardShortcuts must be used within KeyboardShortcutsProvider');
  }
  return context;
};

interface Props {
  children: ReactNode;
  debugMode?: boolean;
}

export const KeyboardShortcutsProvider = ({ children, debugMode = false }: Props) => {
  const { registerKeyBinding, focusTarget } = useKeyboardManager({ debugMode });
  const { setCommandInput, clearHistory } = useCommandStore();
  
  // 全局快捷键定义
  useEffect(() => {
    const unsubscribers: (() => void)[] = [];
    
    // ESC - 全局退出/取消
    unsubscribers.push(
      registerKeyBinding({
        key: KEYS.ESCAPE,
        description: '退出当前操作/清空输入',
        context: 'global',
        action: () => {
          // 清空命令输入
          setCommandInput('');
          // 聚焦回命令输入框
          focusTarget('input[data-command-input="true"]');
        }
      })
    );
    
    // Ctrl+K - 聚焦命令输入框
    unsubscribers.push(
      registerKeyBinding({
        key: 'k',
        ctrl: true,
        description: '聚焦命令输入框',
        context: 'global',
        action: () => {
          focusTarget('input[data-command-input="true"]');
        }
      })
    );
    
    // Ctrl+L - 清空历史记录
    unsubscribers.push(
      registerKeyBinding({
        key: 'l',
        ctrl: true,
        shift: true,
        description: '清空命令历史',
        context: 'global',
        action: () => {
          if (confirm('确定要清空所有命令历史吗？')) {
            clearHistory();
          }
        }
      })
    );
    
    // ? - 显示快捷键帮助
    unsubscribers.push(
      registerKeyBinding({
        key: '?',
        shift: true,
        description: '显示快捷键帮助',
        context: 'global',
        action: () => {
          showShortcutsHelp();
        }
      })
    );
    
    // 清理函数
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [registerKeyBinding, setCommandInput, clearHistory, focusTarget]);
  
  // 便捷方法：聚焦命令输入框
  const focusCommandInput = () => {
    focusTarget('input[data-command-input="true"]', {
      delay: 100,
      retries: 5
    });
  };
  
  // 显示快捷键帮助
  const showShortcutsHelp = () => {
    // TODO: 实现快捷键帮助面板
    console.log(`
=== 快捷键帮助 ===
ESC - 退出当前操作/清空输入
Ctrl+K - 聚焦命令输入框
Ctrl+Shift+L - 清空命令历史
Shift+? - 显示此帮助

命令输入框：
↑/↓ - 浏览历史命令
Enter - 执行命令
Tab - 自动补全（待实现）

地图交互：
左键 - 选择坐标/实体
右键 - 完成坐标输入
==================
    `);
  };
  
  const value: KeyboardShortcutsContextType = {
    registerKeyBinding,
    focusTarget,
    focusCommandInput,
    showShortcutsHelp
  };
  
  return (
    <KeyboardShortcutsContext.Provider value={value}>
      {children}
    </KeyboardShortcutsContext.Provider>
  );
};