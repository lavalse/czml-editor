// src/hooks/useMouseManager.ts
import { useEffect, useCallback, useRef } from 'react';

// 鼠标事件类型
type MouseEventType = 'click' | 'dblclick' | 'contextmenu' | 'mousedown' | 'mouseup' | 'mousemove' | 'wheel';

// 鼠标按钮
export const MOUSE_BUTTON = {
  LEFT: 0,
  MIDDLE: 1,
  RIGHT: 2,
} as const;

// 鼠标绑定配置
interface MouseBinding {
  type: MouseEventType;
  button?: number;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  description: string;
  action: (event: MouseEvent) => void;
  context?: 'global' | 'viewer' | 'editor' | 'command';
  target?: string; // CSS 选择器，用于特定元素
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

// 手势识别配置
interface GestureConfig {
  enablePan?: boolean;
  enablePinch?: boolean;
  enableRotate?: boolean;
  threshold?: number;
}

interface MouseManagerOptions {
  enableGlobalMouse?: boolean;
  debugMode?: boolean;
  gesture?: GestureConfig;
}

export const useMouseManager = (options: MouseManagerOptions = {}) => {
  const { enableGlobalMouse = true, debugMode = false, gesture = {} } = options;
  
  // 存储鼠标绑定
  const mouseBindings = useRef<MouseBinding[]>([]);
  
  // 鼠标状态
  const mouseState = useRef({
    position: { x: 0, y: 0 },
    isPressed: false,
    pressedButton: -1,
    dragStart: null as { x: number; y: number } | null,
    isDragging: false,
  });
  
  // 手势状态
  const gestureState = useRef({
    isPinching: false,
    initialDistance: 0,
    isRotating: false,
    initialAngle: 0,
  });
  
  // 注册鼠标绑定
  const registerMouseBinding = useCallback((binding: MouseBinding) => {
    mouseBindings.current.push(binding);
    
    if (debugMode) {
      console.log(`🖱️ 注册鼠标事件: ${binding.type}`, binding);
    }
    
    return () => {
      mouseBindings.current = mouseBindings.current.filter(b => b !== binding);
    };
  }, [debugMode]);
  
  // 检查修饰键
  const checkModifiers = useCallback((event: MouseEvent, binding: MouseBinding) => {
    return (
      (binding.ctrl === undefined || binding.ctrl === event.ctrlKey) &&
      (binding.alt === undefined || binding.alt === event.altKey) &&
      (binding.shift === undefined || binding.shift === event.shiftKey) &&
      (binding.meta === undefined || binding.meta === event.metaKey)
    );
  }, []);
  
  // 检查目标元素
  const checkTarget = useCallback((event: MouseEvent, binding: MouseBinding) => {
    if (!binding.target) return true;
    
    const target = event.target as HTMLElement;
    return target.matches(binding.target) || target.closest(binding.target) !== null;
  }, []);
  
  // 处理鼠标事件
  const handleMouseEvent = useCallback((event: MouseEvent, eventType: MouseEventType) => {
    // 更新鼠标位置
    mouseState.current.position = { x: event.clientX, y: event.clientY };
    
    // 查找匹配的绑定
    const matchingBindings = mouseBindings.current.filter(binding => {
      if (binding.type !== eventType) return false;
      if (binding.button !== undefined && binding.button !== event.button) return false;
      if (!checkModifiers(event, binding)) return false;
      if (!checkTarget(event, binding)) return false;
      
      return true;
    });
    
    // 执行匹配的绑定
    if (matchingBindings.length > 0) {
      if (debugMode) {
        console.log(`🖱️ 触发鼠标事件:`, eventType, matchingBindings);
      }
      
      // 按优先级执行（特定目标 > 全局）
      const sortedBindings = matchingBindings.sort((a, b) => {
        if (a.target && !b.target) return -1;
        if (!a.target && b.target) return 1;
        return 0;
      });
      
      for (const binding of sortedBindings) {
        if (binding.preventDefault !== false) {
          event.preventDefault();
        }
        if (binding.stopPropagation) {
          event.stopPropagation();
        }
        
        binding.action(event);
        
        // 如果设置了 stopPropagation，不执行后续绑定
        if (binding.stopPropagation) break;
      }
    }
  }, [checkModifiers, checkTarget, debugMode]);
  
  // 拖拽支持
  const handleMouseDown = useCallback((event: MouseEvent) => {
    mouseState.current.isPressed = true;
    mouseState.current.pressedButton = event.button;
    mouseState.current.dragStart = { x: event.clientX, y: event.clientY };
    
    handleMouseEvent(event, 'mousedown');
  }, [handleMouseEvent]);
  
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (mouseState.current.isPressed && mouseState.current.dragStart) {
      const dx = event.clientX - mouseState.current.dragStart.x;
      const dy = event.clientY - mouseState.current.dragStart.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (!mouseState.current.isDragging && distance > (gesture.threshold || 5)) {
        mouseState.current.isDragging = true;
        
        if (debugMode) {
          console.log('🖱️ 开始拖拽');
        }
      }
    }
    
    handleMouseEvent(event, 'mousemove');
  }, [handleMouseEvent, gesture.threshold, debugMode]);
  
  const handleMouseUp = useCallback((event: MouseEvent) => {
    if (mouseState.current.isDragging && debugMode) {
      console.log('🖱️ 结束拖拽');
    }
    
    mouseState.current.isPressed = false;
    mouseState.current.pressedButton = -1;
    mouseState.current.dragStart = null;
    mouseState.current.isDragging = false;
    
    handleMouseEvent(event, 'mouseup');
  }, [handleMouseEvent, debugMode]);
  
  // 设置全局鼠标监听
  useEffect(() => {
    if (!enableGlobalMouse) return;
    
    const handlers = {
      click: (e: MouseEvent) => handleMouseEvent(e, 'click'),
      dblclick: (e: MouseEvent) => handleMouseEvent(e, 'dblclick'),
      contextmenu: (e: MouseEvent) => handleMouseEvent(e, 'contextmenu'),
      mousedown: handleMouseDown,
      mouseup: handleMouseUp,
      mousemove: handleMouseMove,
      wheel: (e: MouseEvent) => handleMouseEvent(e as any, 'wheel'),
    };
    
    Object.entries(handlers).forEach(([event, handler]) => {
      window.addEventListener(event, handler as any);
    });
    
    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        window.removeEventListener(event, handler as any);
      });
    };
  }, [enableGlobalMouse, handleMouseEvent, handleMouseDown, handleMouseUp, handleMouseMove]);
  
  // 获取当前鼠标状态
  const getMouseState = useCallback(() => ({
    ...mouseState.current,
    position: { ...mouseState.current.position },
    dragStart: mouseState.current.dragStart ? { ...mouseState.current.dragStart } : null,
  }), []);
  
  // 触发自定义鼠标事件
  const triggerMouseEvent = useCallback((target: Element | string, eventType: MouseEventType, options?: MouseEventInit) => {
    const element = typeof target === 'string' ? document.querySelector(target) : target;
    if (!element) return;
    
    const event = new MouseEvent(eventType, {
      bubbles: true,
      cancelable: true,
      ...options,
    });
    
    element.dispatchEvent(event);
  }, []);
  
  return {
    registerMouseBinding,
    getMouseState,
    triggerMouseEvent,
  };
};

// 导出类型
export type { MouseBinding, MouseEventType, GestureConfig };