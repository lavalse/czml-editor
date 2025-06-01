// src/providers/UnifiedInputProvider.tsx
import { createContext, useContext, ReactNode, useEffect, useRef } from 'react';
import { useKeyboardManager, KEYS, type KeyBinding } from '../hooks/useKeyboardManager';
import { useMouseManager, MOUSE_BUTTON, type MouseBinding } from '../hooks/useMouseManager';
import { useCommandStore } from '../stores/useCommandStore';

// 统一的输入上下文
interface UnifiedInputContextType {
  // 键盘功能
  registerKeyBinding: (binding: KeyBinding) => () => void;
  focusTarget: (selector: string, options?: any) => void;
  focusCommandInput: () => void;
  
  // 鼠标功能
  registerMouseBinding: (binding: MouseBinding) => () => void;
  getMouseState: () => any;
  
  // 组合功能
  registerDragHandler: (options: DragHandlerOptions) => () => void;
  registerClickHandler: (options: ClickHandlerOptions) => () => void;
  showInputHelp: () => void;
}

// 拖拽处理器选项
interface DragHandlerOptions {
  target?: string;
  button?: number;
  onStart?: (event: MouseEvent) => void;
  onMove?: (event: MouseEvent, delta: { x: number; y: number }) => void;
  onEnd?: (event: MouseEvent) => void;
  threshold?: number;
  context?: string;
}

// 点击处理器选项
interface ClickHandlerOptions {
  target?: string;
  button?: number;
  modifiers?: {
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
  };
  onClick: (event: MouseEvent) => void;
  onDoubleClick?: (event: MouseEvent) => void;
  context?: string;
}

const UnifiedInputContext = createContext<UnifiedInputContextType | null>(null);

export const useUnifiedInput = () => {
  const context = useContext(UnifiedInputContext);
  if (!context) {
    throw new Error('useUnifiedInput must be used within UnifiedInputProvider');
  }
  return context;
};

interface Props {
  children: ReactNode;
  debugMode?: boolean;
}

export const UnifiedInputProvider = ({ children, debugMode = false }: Props) => {
  const keyboard = useKeyboardManager({ debugMode });
  const mouse = useMouseManager({ debugMode });
  const dragHandlers = useRef<Map<string, DragHandlerOptions>>(new Map());
  
  // 设置全局键盘快捷键
  useEffect(() => {
    const unsubscribers: (() => void)[] = [];
    
    // 全局快捷键配置
    const globalShortcuts: KeyBinding[] = [
      {
        key: KEYS.ESCAPE,
        description: '取消当前操作',
        context: 'global',
        action: () => {
          const store = useCommandStore.getState();
          store.setCommandInput('');
          keyboard.focusTarget('input[data-command-input="true"]');
        }
      },
      {
        key: 'k',
        ctrl: true,
        description: '聚焦命令输入',
        context: 'global',
        action: () => {
          keyboard.focusTarget('input[data-command-input="true"]');
        }
      },
      {
        key: '/',
        description: '快速命令',
        context: 'global',
        action: () => {
          keyboard.focusTarget('input[data-command-input="true"]');
          const store = useCommandStore.getState();
          store.setCommandInput('/');
        }
      },
      {
        key: 'h',
        ctrl: true,
        description: '显示帮助',
        context: 'global',
        action: () => {
          showInputHelp();
        }
      }
    ];
    
    globalShortcuts.forEach(shortcut => {
      unsubscribers.push(keyboard.registerKeyBinding(shortcut));
    });
    
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [keyboard]);
  
  // 设置全局鼠标交互
  useEffect(() => {
    const unsubscribers: (() => void)[] = [];
    
    // 右键菜单拦截（用于地图交互）
    unsubscribers.push(
      mouse.registerMouseBinding({
        type: 'contextmenu',
        target: '.cesium-widget',
        description: '完成坐标输入',
        preventDefault: true,
        action: (event) => {
          // 这里可以触发自定义的右键菜单或操作
          console.log('右键点击地图');
        }
      })
    );
    
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [mouse]);
  
  // 注册拖拽处理器
  const registerDragHandler = (options: DragHandlerOptions) => {
    const key = `drag-${Date.now()}`;
    dragHandlers.current.set(key, options);
    
    const unsubscribers: (() => void)[] = [];
    let dragStartPos: { x: number; y: number } | null = null;
    
    // 鼠标按下
    unsubscribers.push(
      mouse.registerMouseBinding({
        type: 'mousedown',
        button: options.button ?? MOUSE_BUTTON.LEFT,
        target: options.target,
        description: `拖拽开始 - ${options.context || 'default'}`,
        action: (event) => {
          dragStartPos = { x: event.clientX, y: event.clientY };
          options.onStart?.(event);
        }
      })
    );
    
    // 鼠标移动
    unsubscribers.push(
      mouse.registerMouseBinding({
        type: 'mousemove',
        description: `拖拽移动 - ${options.context || 'default'}`,
        action: (event) => {
          if (dragStartPos && mouse.getMouseState().isPressed) {
            const delta = {
              x: event.clientX - dragStartPos.x,
              y: event.clientY - dragStartPos.y
            };
            
            const distance = Math.sqrt(delta.x * delta.x + delta.y * delta.y);
            if (distance > (options.threshold || 5)) {
              options.onMove?.(event, delta);
            }
          }
        }
      })
    );
    
    // 鼠标释放
    unsubscribers.push(
      mouse.registerMouseBinding({
        type: 'mouseup',
        description: `拖拽结束 - ${options.context || 'default'}`,
        action: (event) => {
          if (dragStartPos) {
            options.onEnd?.(event);
            dragStartPos = null;
          }
        }
      })
    );
    
    return () => {
      dragHandlers.current.delete(key);
      unsubscribers.forEach(unsub => unsub());
    };
  };
  
  // 注册点击处理器
  const registerClickHandler = (options: ClickHandlerOptions) => {
    const unsubscribers: (() => void)[] = [];
    
    // 单击
    unsubscribers.push(
      mouse.registerMouseBinding({
        type: 'click',
        button: options.button ?? MOUSE_BUTTON.LEFT,
        target: options.target,
        ctrl: options.modifiers?.ctrl,
        alt: options.modifiers?.alt,
        shift: options.modifiers?.shift,
        description: `点击 - ${options.context || 'default'}`,
        action: options.onClick
      })
    );
    
    // 双击
    if (options.onDoubleClick) {
      unsubscribers.push(
        mouse.registerMouseBinding({
          type: 'dblclick',
          button: options.button ?? MOUSE_BUTTON.LEFT,
          target: options.target,
          description: `双击 - ${options.context || 'default'}`,
          action: options.onDoubleClick
        })
      );
    }
    
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  };
  
  // 显示输入帮助
  const showInputHelp = () => {
    console.log(`
╔══════════════════════════════════════╗
║         统一输入系统帮助             ║
╠══════════════════════════════════════╣
║ 键盘快捷键:                          ║
║   ESC         - 取消当前操作         ║
║   Ctrl+K      - 聚焦命令输入         ║
║   /           - 快速命令             ║
║   Ctrl+H      - 显示此帮助           ║
║   ↑/↓        - 浏览命令历史         ║
║                                      ║
║ 鼠标操作:                            ║
║   左键单击    - 选择实体/坐标        ║
║   右键单击    - 完成坐标输入         ║
║   左键拖拽    - 平移视图             ║
║   Ctrl+拖拽   - 旋转视图             ║
║   滚轮        - 缩放视图             ║
╚══════════════════════════════════════╝
    `);
  };
  
  // 快捷方法：聚焦命令输入
  const focusCommandInput = () => {
    keyboard.focusTarget('input[data-command-input="true"]', {
      delay: 100,
      retries: 5
    });
  };
  
  const value: UnifiedInputContextType = {
    // 键盘功能
    registerKeyBinding: keyboard.registerKeyBinding,
    focusTarget: keyboard.focusTarget,
    focusCommandInput,
    
    // 鼠标功能
    registerMouseBinding: mouse.registerMouseBinding,
    getMouseState: mouse.getMouseState,
    
    // 组合功能
    registerDragHandler,
    registerClickHandler,
    showInputHelp
  };
  
  return (
    <UnifiedInputContext.Provider value={value}>
      {children}
    </UnifiedInputContext.Provider>
  );
};