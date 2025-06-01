// src/hooks/useKeyboardManager.ts - 优化版本
import { useEffect, useCallback, useRef } from 'react';
import { useCommandStore } from '../stores/useCommandStore';

// 快捷键配置类型
interface KeyBinding {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  description: string;
  action: () => void;
  context?: 'global' | 'command' | 'viewer' | 'editor';
  preventDefault?: boolean;
  when?: () => boolean; // 新增：条件函数，更灵活的控制
}

// 键盘管理器配置
interface KeyboardManagerOptions {
  enableGlobalShortcuts?: boolean;
  debugMode?: boolean;
}

export const useKeyboardManager = (options: KeyboardManagerOptions = {}) => {
  const { enableGlobalShortcuts = true, debugMode = false } = options;
  
  // 获取必要的 store 状态
  const currentContext = useCommandStore((state) => 
    state.currentCommandName ? 'command' : 'global'
  );
  
  // 存储键绑定
  const keyBindings = useRef<KeyBinding[]>([]);
  
  // 注册键绑定
  const registerKeyBinding = useCallback((binding: KeyBinding) => {
    keyBindings.current.push(binding);
    
    if (debugMode) {
      console.log(`⌨️ 注册快捷键: ${binding.key}`, binding);
    }
    
    // 返回取消注册的函数
    return () => {
      keyBindings.current = keyBindings.current.filter(b => b !== binding);
    };
  }, [debugMode]);
  
  // 检查修饰键
  const checkModifiers = useCallback((event: KeyboardEvent, binding: KeyBinding) => {
    return (
      (binding.ctrl === undefined || binding.ctrl === event.ctrlKey) &&
      (binding.alt === undefined || binding.alt === event.altKey) &&
      (binding.shift === undefined || binding.shift === event.shiftKey) &&
      (binding.meta === undefined || binding.meta === event.metaKey)
    );
  }, []);
  
  // 处理键盘事件
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // 忽略在某些元素中的键盘事件（如 textarea）
    const target = event.target as HTMLElement;
    if (target.tagName === 'TEXTAREA' && !target.hasAttribute('data-command-input')) {
      return;
    }
    
    // 查找匹配的键绑定
    const matchingBindings = keyBindings.current.filter(binding => {
      // 检查键名
      if (binding.key.toLowerCase() !== event.key.toLowerCase()) {
        return false;
      }
      
      // 检查修饰键
      if (!checkModifiers(event, binding)) {
        return false;
      }
      
      // 检查条件函数
      if (binding.when && !binding.when()) {
        return false;
      }
      
      // 检查上下文
      if (binding.context && binding.context !== 'global') {
        if (binding.context !== currentContext) {
          return false;
        }
      }
      
      return true;
    });
    
    // 执行匹配的键绑定
    if (matchingBindings.length > 0) {
      if (debugMode) {
        console.log(`⌨️ 触发快捷键:`, matchingBindings);
      }
      
      // 按优先级执行（特定上下文 > 全局）
      const sortedBindings = matchingBindings.sort((a, b) => {
        if (a.context === 'global' && b.context !== 'global') return 1;
        if (a.context !== 'global' && b.context === 'global') return -1;
        return 0;
      });
      
      const binding = sortedBindings[0];
      
      if (binding.preventDefault !== false) {
        event.preventDefault();
      }
      
      binding.action();
    }
  }, [currentContext, checkModifiers, debugMode]);
  
  // 设置全局键盘监听
  useEffect(() => {
    if (!enableGlobalShortcuts) return;
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enableGlobalShortcuts]);
  
  // 聚焦管理 - 增强版
  const focusTarget = useCallback((selector: string, options?: {
    delay?: number;
    retries?: number;
    retryDelay?: number;
    onSuccess?: () => void;
    onFailure?: () => void;
  }) => {
    const { 
      delay = 0, 
      retries = 3, 
      retryDelay = 50,
      onSuccess,
      onFailure 
    } = options || {};
    
    let attemptCount = 0;
    
    const tryFocus = () => {
      const element = document.querySelector(selector) as HTMLElement;
      
      if (element) {
        element.focus();
        
        // 验证焦点确实设置成功
        setTimeout(() => {
          if (document.activeElement === element) {
            if (debugMode) {
              console.log(`🎯 聚焦成功: ${selector}`);
            }
            onSuccess?.();
          }
        }, 10);
        
        return true;
      }
      
      attemptCount++;
      if (attemptCount < retries) {
        setTimeout(tryFocus, retryDelay);
      } else {
        if (debugMode) {
          console.warn(`⚠️ 聚焦失败: ${selector}`);
        }
        onFailure?.();
      }
      
      return false;
    };
    
    if (delay > 0) {
      setTimeout(tryFocus, delay);
    } else {
      tryFocus();
    }
  }, [debugMode]);
  
  // 批量注册快捷键
  const registerKeyBindings = useCallback((bindings: KeyBinding[]) => {
    const unsubscribers = bindings.map(binding => registerKeyBinding(binding));
    
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [registerKeyBinding]);
  
  return {
    registerKeyBinding,
    registerKeyBindings,
    focusTarget,
    currentContext,
  };
};

// 预定义的快捷键常量
export const KEYS = {
  ESCAPE: 'Escape',
  ENTER: 'Enter',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  TAB: 'Tab',
  SPACE: ' ',
  BACKSPACE: 'Backspace',
  DELETE: 'Delete',
  // 添加更多常用键
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
} as const;

// 导出类型
export type { KeyBinding, KeyboardManagerOptions };