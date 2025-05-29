// src/components/Toolbar.tsx
import React from 'react';

interface ToolbarProps {
  currentMode: string;
  onModeChange: (mode: string) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ currentMode, onModeChange }) => {
  const modes = [
    { key: 'select', label: 'Select' },
    { key: 'point', label: 'Draw Point' },
    { key: 'polyline', label: 'Draw Polyline' },
  ];

  return (
    <div style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>
      {modes.map(mode => (
        <button
          key={mode.key}
          onClick={() => onModeChange(mode.key)}
          style={{
            marginRight: '5px',
            padding: '5px 10px',
            border: currentMode === mode.key ? '2px solid blue' : '1px solid #ccc',
            backgroundColor: currentMode === mode.key ? '#e0e0ff' : 'white',
          }}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
};

export default Toolbar;
