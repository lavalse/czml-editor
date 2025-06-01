// src/components/CzmlEditor.tsx
import { useState, useCallback, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { safeParseCzml } from '../utils/json';
import { useCzmlStore } from '../stores/useCzmlStore';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

const CzmlEditor = ({ value, onChange }: Props) => {
  const [localValue, setLocalValue] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const editorRef = useRef<any>(null);
  
  const updateFromText = useCzmlStore((state) => state.updateFromText);

  // 同步外部值变化（当 CZML 通过命令系统更新时）
  useEffect(() => {
    // 只有当外部值确实改变时才更新
    if (value !== localValue && !isDirty) {
      setLocalValue(value);
    }
  }, [value, isDirty, localValue]);

  // 设置全局键盘监听，阻止 Ctrl+S
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // 如果焦点在编辑器内，阻止浏览器默认的 Ctrl+S
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        const activeElement = document.activeElement;
        const isInEditor = activeElement?.closest('.monaco-editor');
        if (isInEditor) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown, true);
    };
  }, []);

  // 处理编辑器内容变化
  const handleEditorChange = useCallback((newValue: string | undefined) => {
    if (newValue === undefined) return;
    
    setLocalValue(newValue);
    setIsDirty(newValue !== value);
    
    // 实时验证 JSON 格式
    try {
      JSON.parse(newValue);
      setError(null);
    } catch (e) {
      setError(`JSON 格式错误: ${e instanceof Error ? e.message : '未知错误'}`);
    }
  }, [value]);

  // 保存更改
  const handleSave = useCallback(() => {
    const parsed = safeParseCzml(localValue);
    
    if (!parsed) {
      setError('CZML 格式无效：必须是一个数组');
      return;
    }

    // 验证基本的 CZML 结构
    if (parsed.length === 0) {
      setError('CZML 数组不能为空');
      return;
    }

    // 检查是否有 document 对象
    const hasDocument = parsed.some(entity => entity.id === 'document');
    if (!hasDocument) {
      console.warn('警告：缺少 document 对象');
    }

    // 使用 updateFromText 更新 store
    const success = updateFromText(localValue);
    
    if (success) {
      // 通知父组件
      onChange(localValue);
      setIsDirty(false);
      setError(null);
      
      // 显示成功反馈
      const successMsg = document.createElement('div');
      successMsg.textContent = '✓ 保存成功';
      successMsg.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4caf50;
        color: white;
        padding: 12px 20px;
        border-radius: 4px;
        font-family: monospace;
        z-index: 10000;
        animation: fadeInOut 2s ease-in-out;
      `;
      document.body.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 2000);
    } else {
      setError('保存失败：无法更新 CZML');
    }
  }, [localValue, updateFromText, onChange]);

  // 格式化 JSON
  const handleFormat = useCallback(() => {
    try {
      const parsed = JSON.parse(localValue);
      const formatted = JSON.stringify(parsed, null, 2);
      setLocalValue(formatted);
      
      // 如果有编辑器实例，设置格式化后的值
      if (editorRef.current) {
        editorRef.current.setValue(formatted);
      }
      
      setError(null);
    } catch (e) {
      setError('无法格式化：JSON 格式错误');
    }
  }, [localValue]);

  // 重置到原始值
  const handleReset = useCallback(() => {
    setLocalValue(value);
    setIsDirty(false);
    setError(null);
    
    if (editorRef.current) {
      editorRef.current.setValue(value);
    }
  }, [value]);

  // Monaco Editor 配置
  const editorOptions = {
    minimap: { enabled: false },
    fontSize: 14,
    lineNumbers: 'on' as const,
    scrollBeyondLastLine: false,
    automaticLayout: true,
    tabSize: 2,
    wordWrap: 'on' as const,
    theme: 'vs-dark',
    formatOnPaste: true,
    formatOnType: true,
    suggestOnTriggerCharacters: true,
    quickSuggestions: {
      other: true,
      comments: false,
      strings: true
    },
    scrollbar: {
      vertical: 'visible' as const,
      horizontal: 'visible' as const,
      useShadows: false,
      verticalScrollbarSize: 10,
      horizontalScrollbarSize: 10
    }
  };

  // 键盘快捷键处理
  const handleEditorMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    
    // Ctrl+S 保存
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
      () => {
        handleSave();
      }
    );
    
    // Ctrl+Shift+F 格式化
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF,
      () => {
        handleFormat();
      }
    );
    
    // 阻止浏览器默认的 Ctrl+S 行为
    editor.onKeyDown((e: any) => {
      if ((e.ctrlKey || e.metaKey) && e.keyCode === monaco.KeyCode.KeyS) {
        e.preventDefault();
        e.stopPropagation();
      }
    });
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      position: 'relative'
    }}>
      {/* 工具栏 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        borderBottom: '1px solid #333',
        background: '#1e1e1e',
        minHeight: '40px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{
            fontSize: '13px',
            color: '#888',
            fontFamily: 'monospace'
          }}>
            CZML 编辑器
          </span>
          {isDirty && (
            <span style={{
              fontSize: '11px',
              color: '#ff9800',
              background: 'rgba(255, 152, 0, 0.1)',
              padding: '2px 8px',
              borderRadius: '3px',
              fontFamily: 'monospace'
            }}>
              已修改
            </span>
          )}
        </div>
        
        <div style={{
          display: 'flex',
          gap: '8px'
        }}>
          <button
            onClick={handleFormat}
            style={{
              padding: '4px 12px',
              fontSize: '12px',
              background: '#2d2d2d',
              color: '#ccc',
              border: '1px solid #444',
              borderRadius: '3px',
              cursor: 'pointer',
              fontFamily: 'monospace',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#3d3d3d';
              e.currentTarget.style.borderColor = '#555';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#2d2d2d';
              e.currentTarget.style.borderColor = '#444';
            }}
          >
            格式化
          </button>
          
          <button
            onClick={handleReset}
            disabled={!isDirty}
            style={{
              padding: '4px 12px',
              fontSize: '12px',
              background: isDirty ? '#2d2d2d' : '#1a1a1a',
              color: isDirty ? '#ccc' : '#666',
              border: `1px solid ${isDirty ? '#444' : '#333'}`,
              borderRadius: '3px',
              cursor: isDirty ? 'pointer' : 'not-allowed',
              fontFamily: 'monospace',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (isDirty) {
                e.currentTarget.style.background = '#3d3d3d';
                e.currentTarget.style.borderColor = '#555';
              }
            }}
            onMouseLeave={(e) => {
              if (isDirty) {
                e.currentTarget.style.background = '#2d2d2d';
                e.currentTarget.style.borderColor = '#444';
              }
            }}
          >
            重置
          </button>
          
          <button
            onClick={handleSave}
            disabled={!isDirty || !!error}
            style={{
              padding: '4px 16px',
              fontSize: '12px',
              background: isDirty && !error ? '#4caf50' : '#1a1a1a',
              color: isDirty && !error ? '#fff' : '#666',
              border: `1px solid ${isDirty && !error ? '#4caf50' : '#333'}`,
              borderRadius: '3px',
              cursor: isDirty && !error ? 'pointer' : 'not-allowed',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (isDirty && !error) {
                e.currentTarget.style.background = '#5cbf60';
                e.currentTarget.style.borderColor = '#5cbf60';
              }
            }}
            onMouseLeave={(e) => {
              if (isDirty && !error) {
                e.currentTarget.style.background = '#4caf50';
                e.currentTarget.style.borderColor = '#4caf50';
              }
            }}
          >
            保存
          </button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div style={{
          padding: '8px 12px',
          background: 'rgba(244, 67, 54, 0.1)',
          borderBottom: '1px solid rgba(244, 67, 54, 0.3)',
          color: '#ff6b6b',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Monaco Editor */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Editor
          height="100%"
          defaultLanguage="json"
          value={localValue}
          onChange={handleEditorChange}
          onMount={handleEditorMount}
          options={editorOptions}
          theme="vs-dark"
        />
      </div>

      {/* 添加淡入淡出动画 */}
      <style>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateY(-10px); }
          20% { opacity: 1; transform: translateY(0); }
          80% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
};

export default CzmlEditor;