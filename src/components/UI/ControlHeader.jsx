import React from 'react';

export const ControlHeader = ({ settings, onSettingChange, onHide }) => {
  const handleThemeToggle = () => {
    onSettingChange('theme.mode', settings.theme.mode === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="control-header">
      <h3>Particle Controls</h3>
      <div className="control-actions">
        <button onClick={handleThemeToggle}>
          {settings.theme.mode === 'dark' ? '☀️' : '🌙'}
        </button>
        <button 
          className="hide-button" 
          onClick={onHide}
          title="Hide controls"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
