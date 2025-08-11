import React, { useState, useRef, useCallback } from 'react';
import ParticleCanvas from './components/ParticleCanvas';
import ControlPanel from './components/UI/ControlPanel';
import SparkleOverlay from './components/UI/SparkleOverlay';
import './App.css';

function App() {
  const [settings, setSettings] = useState(null);
  const configManagerRef = useRef(null);

  const handleSettingsChange = useCallback((newSettings) => {
    setSettings(newSettings);
  }, []);

  const handleSettingChange = useCallback((path, value) => {
    if (configManagerRef.current) {
      configManagerRef.current.updateSetting(path, value);
    }
  }, []);

  const handleCanvasReady = useCallback((canvas, configManager) => {
    configManagerRef.current = configManager;
  }, []);

  return (
    <div className={`app ${settings?.theme?.mode || 'dark'}`}>
      <div className="canvas-wrapper">
        <div className="canvas-container">
          <ParticleCanvas 
            onSettingsChange={handleSettingsChange}
            onReady={handleCanvasReady}
            settings={settings}
          />
          <SparkleOverlay />
        </div>
      </div>
      
      {settings && (
        <ControlPanel
          settings={settings}
          onSettingChange={handleSettingChange}
          configManager={configManagerRef.current}
        />
      )}
      

    </div>
  );
}

export default App;
