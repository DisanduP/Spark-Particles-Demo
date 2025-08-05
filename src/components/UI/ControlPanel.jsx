import React, { useState } from 'react';
import './ControlPanel.css';

export const ControlPanel = ({ settings, onSettingChange, configManager }) => {
  const [isVisible, setIsVisible] = useState(true);
  const handleSliderChange = (path, value) => {
    onSettingChange(path, parseFloat(value));
  };

  const handleSelectChange = (path, value) => {
    onSettingChange(path, value);
  };

  const handleExport = () => {
    if (configManager) {
      const json = configManager.exportToJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `particle-config-${new Date().getTime()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (file && configManager) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const success = configManager.loadFromJSON(e.target.result);
        if (!success) {
          alert('Failed to load configuration file');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleReset = () => {
    if (configManager && confirm('Reset all settings to defaults?')) {
      configManager.resetToDefaults();
    }
  };

  if (!settings) return null;

  return (
    <>
      <div className={`control-panel ${settings.theme.mode} ${isVisible ? 'visible' : 'hidden'}`}>
        <div className="control-header">
          <h3>Particle Controls</h3>
          <div className="control-actions">
            <button onClick={() => onSettingChange('theme.mode', settings.theme.mode === 'dark' ? 'light' : 'dark')}>
              {settings.theme.mode === 'dark' ? '☀️' : '🌙'}
            </button>
            <button 
              className="hide-button" 
              onClick={() => setIsVisible(false)}
              title="Hide controls"
            >
              ✕
            </button>
          </div>
        </div>

      <div className="control-sections">
        {/* Particle Behavior */}
        <section>
          <h4>Particle Behavior</h4>
          
          <div className="control-group">
            <label>Max Particles: {settings.particles.maxCount}</label>
            <input
              type="range"
              min="50"
              max="2000"
              value={settings.particles.maxCount}
              onChange={(e) => handleSliderChange('particles.maxCount', e.target.value)}
            />
          </div>

          <div className="control-group">
            <label>Spawn Rate: {settings.particles.spawnRate}/s</label>
            <input
              type="range"
              min="1"
              max="200"
              value={settings.particles.spawnRate}
              onChange={(e) => handleSliderChange('particles.spawnRate', e.target.value)}
            />
          </div>

          <div className="control-group">
            <label>Lifetime Min: {settings.particles.lifetime.min.toFixed(1)}s</label>
            <input
              type="range"
              min="0.5"
              max="10"
              step="0.1"
              value={settings.particles.lifetime.min}
              onChange={(e) => handleSliderChange('particles.lifetime.min', e.target.value)}
            />
          </div>

          <div className="control-group">
            <label>Lifetime Max: {settings.particles.lifetime.max.toFixed(1)}s</label>
            <input
              type="range"
              min="0.5"
              max="10"
              step="0.1"
              value={settings.particles.lifetime.max}
              onChange={(e) => handleSliderChange('particles.lifetime.max', e.target.value)}
            />
          </div>

          <div className="control-group">
            <label>Upward Force: {settings.particles.upwardForce.toFixed(2)}</label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.01"
              value={settings.particles.upwardForce}
              onChange={(e) => handleSliderChange('particles.upwardForce', e.target.value)}
            />
          </div>
        </section>

        {/* Child Spawning */}
        <section>
          <h4>Child Spawning</h4>
          
          <div className="control-group">
            <label>Spawn Probability: {(settings.childSpawning.probability * 1000).toFixed(1)}/1000</label>
            <input
              type="range"
              min="0"
              max="0.01"
              step="0.0001"
              value={settings.childSpawning.probability}
              onChange={(e) => handleSliderChange('childSpawning.probability', e.target.value)}
            />
          </div>

          <div className="control-group">
            <label>Force Multiplier: {settings.childSpawning.forceMultiplier.target.toFixed(2)}</label>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={settings.childSpawning.forceMultiplier.target}
              onChange={(e) => handleSliderChange('childSpawning.forceMultiplier.target', e.target.value)}
            />
          </div>

          <div className="control-group">
            <label>Random Range: {settings.childSpawning.forceMultiplier.randomRange.toFixed(2)}</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.childSpawning.forceMultiplier.randomRange}
              onChange={(e) => handleSliderChange('childSpawning.forceMultiplier.randomRange', e.target.value)}
            />
          </div>
        </section>

        {/* Perlin Noise */}
        <section>
          <h4>Perlin Noise</h4>
          
          <div className="control-group">
            <label>Scale: {settings.perlinNoise.scale.toFixed(4)}</label>
            <input
              type="range"
              min="0.001"
              max="0.02"
              step="0.0001"
              value={settings.perlinNoise.scale}
              onChange={(e) => handleSliderChange('perlinNoise.scale', e.target.value)}
            />
          </div>

          <div className="control-group">
            <label>Horizontal Strength: {settings.perlinNoise.strength.horizontal.toFixed(2)}</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={settings.perlinNoise.strength.horizontal}
              onChange={(e) => handleSliderChange('perlinNoise.strength.horizontal', e.target.value)}
            />
          </div>

          <div className="control-group">
            <label>Vertical Strength: {settings.perlinNoise.strength.vertical.toFixed(2)}</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={settings.perlinNoise.strength.vertical}
              onChange={(e) => handleSliderChange('perlinNoise.strength.vertical', e.target.value)}
            />
          </div>

          <div className="control-group">
            <label>Speed: {settings.perlinNoise.speed.toFixed(1)}</label>
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.1"
              value={settings.perlinNoise.speed}
              onChange={(e) => handleSliderChange('perlinNoise.speed', e.target.value)}
            />
          </div>
        </section>

        {/* Mouse Interaction */}
        <section>
          <h4>Mouse Interaction</h4>
          
          <div className="control-group">
            <label>Force Type</label>
            <select
              value={settings.mouseInteraction.forceType}
              onChange={(e) => handleSelectChange('mouseInteraction.forceType', e.target.value)}
            >
              <option value="radial">Radial Push</option>
              <option value="suction">Suction</option>
              <option value="directional">Directional</option>
            </select>
          </div>

          <div className="control-group">
            <label>Force Strength: {settings.mouseInteraction.strength.toFixed(0)}</label>
            <input
              type="range"
              min="0"
              max="500"
              value={settings.mouseInteraction.strength}
              onChange={(e) => handleSliderChange('mouseInteraction.strength', e.target.value)}
            />
          </div>

          <div className="control-group">
            <label>Influence Radius: {settings.mouseInteraction.radius.toFixed(0)}px</label>
            <input
              type="range"
              min="20"
              max="300"
              value={settings.mouseInteraction.radius}
              onChange={(e) => handleSliderChange('mouseInteraction.radius', e.target.value)}
            />
          </div>

          <div className="control-group">
            <label>Click Spawn Count: {settings.mouseInteraction.clickSpawnCount}</label>
            <input
              type="range"
              min="1"
              max="20"
              value={settings.mouseInteraction.clickSpawnCount}
              onChange={(e) => handleSliderChange('mouseInteraction.clickSpawnCount', e.target.value)}
            />
          </div>
        </section>

        {/* Visual Effects */}
        <section>
          <h4>Visual Effects</h4>
          
          <div className="control-group">
            <label>
              <input
                type="checkbox"
                checked={settings.visual.useTexture}
                onChange={(e) => onSettingChange('visual.useTexture', e.target.checked)}
              />
              Use Sparkle Texture
            </label>
          </div>
          
          <div className="control-group">
            <label>Glow Intensity: {settings.visual.glow.intensity.toFixed(1)}</label>
            <input
              type="range"
              min="0"
              max="3"
              step="0.1"
              value={settings.visual.glow.intensity}
              onChange={(e) => handleSliderChange('visual.glow.intensity', e.target.value)}
            />
          </div>
        </section>

        {/* Config Management */}
        <section>
          <h4>Configuration</h4>
          
          <div className="config-buttons">
            <button onClick={handleExport}>Export Config</button>
            <label className="file-input-label">
              Import Config
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                style={{ display: 'none' }}
              />
            </label>
            <button onClick={handleReset} className="reset-button">Reset to Defaults</button>
          </div>
        </section>
      </div>
    </div>
    
    {/* Show tab when panel is hidden */}
    {!isVisible && (
      <div 
        className={`control-tab ${settings.theme.mode}`}
        onClick={() => setIsVisible(true)}
        title="Show controls"
      >
        <span>⚙️</span>
      </div>
    )}
  </>
  );
};

export default ControlPanel;
