import React, { useState } from 'react';
import './ControlPanel.css';

// Reusable component for color input
const ColorInput = ({ label, value, path, onChange }) => {
  const handleColorChange = (e) => {
    onChange(path, e.target.value);
  };

  return (
    <div className="control-group">
      <label>{label}:</label>
      <div className="color-input-container">
        <input
          type="color"
          value={value}
          onChange={handleColorChange}
          className="color-input"
        />
        <span className="color-value">{value}</span>
      </div>
    </div>
  );
};

// Reusable component for slider with text input
const SliderInput = ({ label, value, min, max, step, path, onChange, formatDisplay }) => {
  const [textValue, setTextValue] = useState(value.toString());
  const [isEditing, setIsEditing] = useState(false);

  const handleSliderChange = (e) => {
    const newValue = parseFloat(e.target.value);
    setTextValue(newValue.toString());
    onChange(path, newValue);
  };

  const handleTextChange = (e) => {
    setTextValue(e.target.value);
  };

  const handleTextSubmit = (e) => {
    if (e.key === 'Enter' || e.type === 'blur') {
      const numValue = parseFloat(textValue);
      if (!isNaN(numValue)) {
        onChange(path, numValue);
      } else {
        // Reset to current value if invalid
        setTextValue(value.toString());
      }
      setIsEditing(false);
    }
  };

  const handleTextFocus = () => {
    setIsEditing(true);
  };

  // Update text value when prop value changes (from external sources)
  React.useEffect(() => {
    if (!isEditing) {
      setTextValue(value.toString());
    }
  }, [value, isEditing]);

  const displayValue = formatDisplay ? formatDisplay(value) : value;

  return (
    <div className="control-group">
      <div className="slider-input-header">
        <label>{label}: {displayValue}</label>
        <input
          type="text"
          className="value-input"
          value={textValue}
          onChange={handleTextChange}
          onKeyDown={handleTextSubmit}
          onBlur={handleTextSubmit}
          onFocus={handleTextFocus}
          title="Click to edit value directly"
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={Math.min(Math.max(value, min), max)} // Clamp to slider range for display
        onChange={handleSliderChange}
      />
    </div>
  );
};

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
          
          <SliderInput
            label="Max Particles"
            value={settings.particles.maxCount}
            min={50}
            max={2000}
            step={1}
            path="particles.maxCount"
            onChange={handleSliderChange}
          />

          <SliderInput
            label="Spawn Rate"
            value={settings.particles.spawnRate}
            min={1}
            max={200}
            step={1}
            path="particles.spawnRate"
            onChange={handleSliderChange}
            formatDisplay={(val) => `${val}/s`}
          />

          <SliderInput
            label="Lifetime Min"
            value={settings.particles.lifetime.min}
            min={0.5}
            max={10}
            step={0.1}
            path="particles.lifetime.min"
            onChange={handleSliderChange}
            formatDisplay={(val) => `${val.toFixed(1)}s`}
          />

          <SliderInput
            label="Lifetime Max"
            value={settings.particles.lifetime.max}
            min={0.5}
            max={10}
            step={0.1}
            path="particles.lifetime.max"
            onChange={handleSliderChange}
            formatDisplay={(val) => `${val.toFixed(1)}s`}
          />

          <SliderInput
            label="Upward Force"
            value={settings.particles.upwardForce}
            min={0}
            max={2}
            step={0.01}
            path="particles.upwardForce"
            onChange={handleSliderChange}
            formatDisplay={(val) => val.toFixed(2)}
          />
        </section>

        {/* Spawn Area */}
        <section>
          <h4>Spawn Area</h4>
          
          <SliderInput
            label="Spawn X Min"
            value={settings.particles.spawnArea.x.min}
            min={0}
            max={1}
            step={0.01}
            path="particles.spawnArea.x.min"
            onChange={handleSliderChange}
            formatDisplay={(val) => `${(val * 100).toFixed(0)}%`}
          />

          <SliderInput
            label="Spawn X Max"
            value={settings.particles.spawnArea.x.max}
            min={0}
            max={1}
            step={0.01}
            path="particles.spawnArea.x.max"
            onChange={handleSliderChange}
            formatDisplay={(val) => `${(val * 100).toFixed(0)}%`}
          />

          <SliderInput
            label="Spawn Y Min"
            value={settings.particles.spawnArea.y.min}
            min={0}
            max={1}
            step={0.01}
            path="particles.spawnArea.y.min"
            onChange={handleSliderChange}
            formatDisplay={(val) => `${(val * 100).toFixed(0)}%`}
          />

          <SliderInput
            label="Spawn Y Max"
            value={settings.particles.spawnArea.y.max}
            min={0}
            max={1}
            step={0.01}
            path="particles.spawnArea.y.max"
            onChange={handleSliderChange}
            formatDisplay={(val) => `${(val * 100).toFixed(0)}%`}
          />
        </section>

        {/* Particle Appearance */}
        <section>
          <h4>Particle Appearance</h4>
          
          <ColorInput
            label="Particle Color 1"
            value={settings.visual.colors.color1}
            path="visual.colors.color1"
            onChange={handleSelectChange}
          />
          
          <ColorInput
            label="Particle Color 2"
            value={settings.visual.colors.color2}
            path="visual.colors.color2"
            onChange={handleSelectChange}
          />
          
          <ColorInput
            label="Particle Color 3"
            value={settings.visual.colors.color3}
            path="visual.colors.color3"
            onChange={handleSelectChange}
          />

          <SliderInput
            label="Max Particle Size"
            value={settings.particles.size.base}
            min={2}
            max={50}
            step={0.5}
            path="particles.size.base"
            onChange={handleSliderChange}
            formatDisplay={(val) => `${val.toFixed(1)}px`}
          />

          <SliderInput
            label="Size Randomness"
            value={settings.particles.size.randomVariation}
            min={0}
            max={1}
            step={0.01}
            path="particles.size.randomVariation"
            onChange={handleSliderChange}
            formatDisplay={(val) => `${(val * 100).toFixed(0)}%`}
          />

          <SliderInput
            label="Rotation Speed"
            value={settings.particles.rotation.speed}
            min={0}
            max={10}
            step={0.1}
            path="particles.rotation.speed"
            onChange={handleSliderChange}
            formatDisplay={(val) => `${val.toFixed(1)} rad/s`}
          />

          <SliderInput
            label="Rotation Randomness"
            value={settings.particles.rotation.randomVariation}
            min={0}
            max={1}
            step={0.01}
            path="particles.rotation.randomVariation"
            onChange={handleSliderChange}
            formatDisplay={(val) => `${(val * 100).toFixed(0)}%`}
          />
        </section>

        {/* Child Spawning */}
        <section>
          <h4>Child Spawning</h4>
          
          <SliderInput
            label="Spawn Probability"
            value={settings.childSpawning.probability}
            min={0}
            max={0.01}
            step={0.0001}
            path="childSpawning.probability"
            onChange={handleSliderChange}
            formatDisplay={(val) => `${(val * 1000).toFixed(1)}/1000`}
          />

          <SliderInput
            label="Force Multiplier"
            value={settings.childSpawning.forceMultiplier.target}
            min={0.5}
            max={3}
            step={0.1}
            path="childSpawning.forceMultiplier.target"
            onChange={handleSliderChange}
            formatDisplay={(val) => val.toFixed(2)}
          />

          <SliderInput
            label="Random Range"
            value={settings.childSpawning.forceMultiplier.randomRange}
            min={0}
            max={1}
            step={0.05}
            path="childSpawning.forceMultiplier.randomRange"
            onChange={handleSliderChange}
            formatDisplay={(val) => val.toFixed(2)}
          />
        </section>

        {/* Perlin Noise */}
        <section>
          <h4>Perlin Noise</h4>
          
          <SliderInput
            label="Scale"
            value={settings.perlinNoise.scale}
            min={0.001}
            max={0.02}
            step={0.0001}
            path="perlinNoise.scale"
            onChange={handleSliderChange}
            formatDisplay={(val) => val.toFixed(4)}
          />

          <SliderInput
            label="Horizontal Strength"
            value={settings.perlinNoise.strength.horizontal}
            min={0}
            max={1}
            step={0.01}
            path="perlinNoise.strength.horizontal"
            onChange={handleSliderChange}
            formatDisplay={(val) => val.toFixed(2)}
          />

          <SliderInput
            label="Vertical Strength"
            value={settings.perlinNoise.strength.vertical}
            min={0}
            max={1}
            step={0.01}
            path="perlinNoise.strength.vertical"
            onChange={handleSliderChange}
            formatDisplay={(val) => val.toFixed(2)}
          />

          <SliderInput
            label="Speed"
            value={settings.perlinNoise.speed}
            min={0.1}
            max={2}
            step={0.1}
            path="perlinNoise.speed"
            onChange={handleSliderChange}
            formatDisplay={(val) => val.toFixed(1)}
          />
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

          <SliderInput
            label="Force Strength"
            value={settings.mouseInteraction.strength}
            min={0}
            max={500}
            step={1}
            path="mouseInteraction.strength"
            onChange={handleSliderChange}
            formatDisplay={(val) => val.toFixed(0)}
          />

          <SliderInput
            label="Influence Radius"
            value={settings.mouseInteraction.radius}
            min={20}
            max={300}
            step={1}
            path="mouseInteraction.radius"
            onChange={handleSliderChange}
            formatDisplay={(val) => `${val.toFixed(0)}px`}
          />

          <SliderInput
            label="Click Spawn Count"
            value={settings.mouseInteraction.clickSpawnCount}
            min={1}
            max={20}
            step={1}
            path="mouseInteraction.clickSpawnCount"
            onChange={handleSliderChange}
          />
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
          
          <SliderInput
            label="Glow Intensity"
            value={settings.visual.glow.intensity}
            min={0}
            max={3}
            step={0.1}
            path="visual.glow.intensity"
            onChange={handleSliderChange}
            formatDisplay={(val) => val.toFixed(1)}
          />
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
