import React, { useState } from 'react';
import './ControlPanel.css';
import { ConfigManagement } from './ConfigManagement.jsx';
import { ControlHeader } from './ControlHeader.jsx';
import { ControlSection } from './ControlSection.jsx';
import GradientEditor from './GradientEditor.jsx';
import OpacityGradientEditor from './OpacityGradientEditor.jsx';

// Reusable component for slider input with direct text editing

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
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  
  const handleSliderChange = (path, value) => {
    onSettingChange(path, parseFloat(value));
  };

  const handleSelectChange = (path, value) => {
    onSettingChange(path, value);
  };

  const handleGradientChange = (gradientKey, newGradient) => {
    onSettingChange(`visual.gradients.${gradientKey}`, newGradient);
  };

  const handleShowPanel = () => {
    setHasBeenVisible(true);
    setIsVisible(true);
  };

  if (!settings) return null;

  return (
    <>
      {/* Only render the panel after it has been shown at least once */}
      {hasBeenVisible && (
        <div className={`control-panel ${settings.theme.mode} ${isVisible ? 'visible' : 'hidden'}`}>
        <ControlHeader 
          settings={settings}
          onSettingChange={onSettingChange}
          onHide={() => setIsVisible(false)}
        />

      <div className="control-sections">
        {/* Particle Behavior */}
        <ControlSection title="Particle Behavior">
          
          <SliderInput
            label="Max Particles"
            value={settings.particles.maxCount}
            min={50}
            max={10000}
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
            max={3}
            step={0.01}
            path="particles.upwardForce"
            onChange={handleSliderChange}
            formatDisplay={(val) => val.toFixed(2)}
          />

          <SliderInput
            label="Drag (Friction)"
            value={settings.particles.drag ?? 0}
            min={0}
            max={5}
            step={0.01}
            path="particles.drag"
            onChange={handleSliderChange}
            formatDisplay={(val) => `${val.toFixed(2)}/s`}
          />
        </ControlSection>

        {/* Spawn Area */}
        <ControlSection title="Spawn Area">
          
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
        </ControlSection>

        {/* Particle Appearance */}
        <ControlSection title="Particle Color Gradients">
          
          <GradientEditor
            label="Gradient 1"
            gradient={settings.visual.gradients.gradient1}
            gradientKey="gradient1"
            onChange={handleGradientChange}
          />
          
          <GradientEditor
            label="Gradient 2"
            gradient={settings.visual.gradients.gradient2}
            gradientKey="gradient2"
            onChange={handleGradientChange}
          />
          
          <GradientEditor
            label="Gradient 3"
            gradient={settings.visual.gradients.gradient3}
            gradientKey="gradient3"
            onChange={handleGradientChange}
          />
        </ControlSection>

        {/* Opacity Gradient */}
        <ControlSection title="Particle Opacity">
          <OpacityGradientEditor
            label="Opacity Over Lifetime"
            gradient={settings.visual.opacityGradient}
            onChange={handleSelectChange}
          />
        </ControlSection>

        {/* Particle Size & Rotation */}
        <ControlSection title="Particle Size & Rotation">
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
        </ControlSection>

        {/* Child Spawning */}
        <ControlSection title="Child Spawning">
          
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
        </ControlSection>

        {/* Perlin Noise */}
        <ControlSection title="Perlin Noise">
          
          <SliderInput
            label="Scale"
            value={settings.perlinNoise.scale}
            min={0.01}
            max={10}
            step={0.01}
            path="perlinNoise.scale"
            onChange={handleSliderChange}
            formatDisplay={(val) => val.toFixed(2)}
          />

          <SliderInput
            label="Horizontal Strength"
            value={settings.perlinNoise.strength.horizontal}
            min={0}
            max={5}
            step={0.01}
            path="perlinNoise.strength.horizontal"
            onChange={handleSliderChange}
            formatDisplay={(val) => val.toFixed(2)}
          />

          <SliderInput
            label="Vertical Strength"
            value={settings.perlinNoise.strength.vertical}
            min={0}
            max={5}
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
        </ControlSection>

        {/* Mouse Interaction */}
        <ControlSection title="Mouse Interaction">
          
          <div className="control-group">
            <label>Force Type</label>
            <select
              value={settings.mouseInteraction.forceType}
              onChange={(e) => handleSelectChange('mouseInteraction.forceType', e.target.value)}
            >
              <option value="radial">Radial Push</option>
              <option value="suction">Suction</option>
              <option value="directional">Directional</option>
              <option value="sweep">Sweep</option>
              <option value="follow">Follow</option>
              <option value="boids">Boids</option>
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
            label="Mouse Spawn Rate"
            value={settings.mouseInteraction.clickSpawnCount}
            min={1}
            max={50}
            step={1}
            path="mouseInteraction.clickSpawnCount"
            onChange={handleSliderChange}
            formatDisplay={(val) => `${val}/sec`}
          />

          {/* Sweep-specific controls */}
          {settings.mouseInteraction.forceType === 'sweep' && (
            <>
              <SliderInput
                label="Speed Multiplier"
                value={settings.mouseInteraction.sweep.speedMultiplier}
                min={0.1}
                max={5.0}
                step={0.1}
                path="mouseInteraction.sweep.speedMultiplier"
                onChange={handleSliderChange}
                formatDisplay={(val) => val.toFixed(1)}
              />

              <SliderInput
                label="Directional Spread"
                value={settings.mouseInteraction.sweep.directionalSpread}
                min={0.0}
                max={1.0}
                step={0.1}
                path="mouseInteraction.sweep.directionalSpread"
                onChange={handleSliderChange}
                formatDisplay={(val) => val.toFixed(1)}
              />
            </>
          )}

          {/* Follow-specific controls */}
          {settings.mouseInteraction.forceType === 'follow' && (
            <>
              <SliderInput
                label="Follow Spread"
                value={settings.mouseInteraction.follow.spread}
                min={0.0}
                max={1.0}
                step={0.1}
                path="mouseInteraction.follow.spread"
                onChange={handleSliderChange}
                formatDisplay={(val) => val.toFixed(1)}
              />

              <SliderInput
                label="Follow Strength"
                value={settings.mouseInteraction.follow.strength}
                min={0.1}
                max={10.0}
                step={0.1}
                path="mouseInteraction.follow.strength"
                onChange={handleSliderChange}
                formatDisplay={(val) => val.toFixed(1)}
              />

              <SliderInput
                label="Suction Strength"
                value={settings.mouseInteraction.follow.suctionStrength}
                min={0}
                max={500}
                step={1}
                path="mouseInteraction.follow.suctionStrength"
                onChange={handleSliderChange}
                formatDisplay={(val) => val.toFixed(0)}
              />
            </>
          )}

          {/* Boids-specific controls */}
          {settings.mouseInteraction.forceType === 'boids' && (
            <>
              <SliderInput
                label="Flocking Speed Limit"
                value={settings.mouseInteraction.boids.speedLimit}
                min={20}
                max={600}
                step={5}
                path="mouseInteraction.boids.speedLimit"
                onChange={handleSliderChange}
                formatDisplay={(val) => `${val.toFixed(0)} px/s`}
              />

              <SliderInput
                label="Separation Weight"
                value={settings.mouseInteraction.boids.weights.separation}
                min={0}
                max={5}
                step={0.1}
                path="mouseInteraction.boids.weights.separation"
                onChange={handleSliderChange}
                formatDisplay={(val) => val.toFixed(1)}
              />

              <SliderInput
                label="Alignment Weight"
                value={settings.mouseInteraction.boids.weights.alignment}
                min={0}
                max={5}
                step={0.1}
                path="mouseInteraction.boids.weights.alignment"
                onChange={handleSliderChange}
                formatDisplay={(val) => val.toFixed(1)}
              />

              <SliderInput
                label="Cohesion Weight"
                value={settings.mouseInteraction.boids.weights.cohesion}
                min={0}
                max={5}
                step={0.1}
                path="mouseInteraction.boids.weights.cohesion"
                onChange={handleSliderChange}
                formatDisplay={(val) => val.toFixed(1)}
              />
            </>
          )}
        </ControlSection>

        {/* Visual Effects */}
        <ControlSection title="Visual Effects">
          
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
          
          <div style={{ marginTop: '15px' }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              <input
                type="checkbox"
                checked={settings.visual.glow.speedBased.enabled}
                onChange={(e) => onSettingChange('visual.glow.speedBased.enabled', e.target.checked)}
              />
              Speed-Based Glow
            </label>
          </div>
          
          {settings.visual.glow.speedBased.enabled && (
            <>
              <SliderInput
                label="Max Speed Glow Intensity"
                value={settings.visual.glow.speedBased.maxIntensity}
                min={0}
                max={5}
                step={0.1}
                path="visual.glow.speedBased.maxIntensity"
                onChange={handleSliderChange}
                formatDisplay={(val) => val.toFixed(1)}
              />
              
              <SliderInput
                label="Min Speed Threshold"
                value={settings.visual.glow.speedBased.minSpeedThreshold}
                min={0}
                max={200}
                step={5}
                path="visual.glow.speedBased.minSpeedThreshold"
                onChange={handleSliderChange}
                formatDisplay={(val) => `${val.toFixed(0)} px/s`}
              />
            </>
          )}
          
          <div style={{ marginTop: '15px' }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              <input
                type="checkbox"
                checked={settings.visual.bloom.speedBased.enabled}
                onChange={(e) => onSettingChange('visual.bloom.speedBased.enabled', e.target.checked)}
              />
              Speed-Based Bloom
            </label>
          </div>
          
          {settings.visual.bloom.speedBased.enabled && (
            <>
              <SliderInput
                label="Bloom Falloff Distance"
                value={settings.visual.bloom.speedBased.falloffDistance}
                min={5}
                max={50}
                step={1}
                path="visual.bloom.speedBased.falloffDistance"
                onChange={handleSliderChange}
                formatDisplay={(val) => `${val.toFixed(0)}x`}
              />
              
              <SliderInput
                label="Bloom Color Shift"
                value={settings.visual.bloom.speedBased.colorShift}
                min={0}
                max={1}
                step={0.05}
                path="visual.bloom.speedBased.colorShift"
                onChange={handleSliderChange}
                formatDisplay={(val) => val.toFixed(2)}
              />
              
              <SliderInput
                label="Max Bloom Intensity"
                value={settings.visual.bloom.speedBased.maxIntensity}
                min={0}
                max={3}
                step={0.1}
                path="visual.bloom.speedBased.maxIntensity"
                onChange={handleSliderChange}
                formatDisplay={(val) => val.toFixed(1)}
              />
              
              <SliderInput
                label="Bloom Speed Threshold"
                value={settings.visual.bloom.speedBased.minSpeedThreshold}
                min={0}
                max={200}
                step={5}
                path="visual.bloom.speedBased.minSpeedThreshold"
                onChange={handleSliderChange}
                formatDisplay={(val) => `${val.toFixed(0)} px/s`}
              />
            </>
          )}
          
          <div style={{ marginTop: '15px' }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              <input
                type="checkbox"
                checked={settings.visual.trails.speedBased.enabled}
                onChange={(e) => onSettingChange('visual.trails.speedBased.enabled', e.target.checked)}
              />
              Speed-Based Trails
            </label>
          </div>
          
          {settings.visual.trails.speedBased.enabled && (
            <>
              <SliderInput
                label="Trail Length Multiplier"
                value={settings.visual.trails.speedBased.lengthMultiplier}
                min={0.1}
                max={2}
                step={0.1}
                path="visual.trails.speedBased.lengthMultiplier"
                onChange={handleSliderChange}
                formatDisplay={(val) => `${val.toFixed(1)}x`}
              />
              
              <SliderInput
                label="Max Trail Length"
                value={settings.visual.trails.speedBased.maxLength}
                min={10}
                max={100}
                step={5}
                path="visual.trails.speedBased.maxLength"
                onChange={handleSliderChange}
                formatDisplay={(val) => `${val.toFixed(0)} segments`}
              />
              
              <SliderInput
                label="Trail Color Shift"
                value={settings.visual.trails.speedBased.colorShift}
                min={0}
                max={1}
                step={0.05}
                path="visual.trails.speedBased.colorShift"
                onChange={handleSliderChange}
                formatDisplay={(val) => val.toFixed(2)}
              />
              
              <SliderInput
                label="Trail Spacing"
                value={settings.visual.trails.speedBased.spacing}
                min={1}
                max={10}
                step={1}
                path="visual.trails.speedBased.spacing"
                onChange={handleSliderChange}
                formatDisplay={(val) => `${val.toFixed(0)} particles`}
              />
              
              <SliderInput
                label="Trail Opacity Falloff"
                value={settings.visual.trails.speedBased.opacityFalloff}
                min={0.5}
                max={4.0}
                step={0.1}
                path="visual.trails.speedBased.opacityFalloff"
                onChange={handleSliderChange}
                formatDisplay={(val) => `${val.toFixed(1)}x`}
              />
              
              <SliderInput
                label="Trail Speed Threshold"
                value={settings.visual.trails.speedBased.minSpeedThreshold}
                min={0}
                max={200}
                step={5}
                path="visual.trails.speedBased.minSpeedThreshold"
                onChange={handleSliderChange}
                formatDisplay={(val) => `${val.toFixed(0)} px/s`}
              />
            </>
          )}
        </ControlSection>

        {/* Config Management */}
        <ConfigManagement configManager={configManager} />
      </div>
    </div>
      )}
      
      {/* Show tab when panel is hidden */}
      {!isVisible && (
      <div 
        className={`control-tab ${settings.theme.mode}`}
        onClick={handleShowPanel}
        title="Show controls"
      >
        <span>⚙️</span>
      </div>
    )}
  </>
  );
};

export default ControlPanel;
