import React, { useState, useRef } from 'react';
import ParticleCanvas from './components/ParticleCanvas';
import ControlPanel from './components/UI/ControlPanel';
import './App.css';

function App() {
  const [settings, setSettings] = useState(null);
  const configManagerRef = useRef(null);

  const handleSettingsChange = (newSettings) => {
    setSettings(newSettings);
  };

  const handleSettingChange = (path, value) => {
    if (configManagerRef.current) {
      configManagerRef.current.updateSetting(path, value);
    }
  };

  const handleCanvasReady = (canvas, configManager) => {
    configManagerRef.current = configManager;
  };

  return (
    <div className="app">
      <div className="canvas-container">
        <ParticleCanvas 
          onSettingsChange={handleSettingsChange}
          onReady={handleCanvasReady}
        />
      </div>
      
      {settings && (
        <ControlPanel
          settings={settings}
          onSettingChange={handleSettingChange}
          configManager={configManagerRef.current}
        />
      )}
      
      <div className="info-overlay">
        <h1>WebGL Fire Ember Particles</h1>
        <p>Click to spawn particles • Move mouse to interact</p>
      </div>
    </div>
  );
}

export default App;
