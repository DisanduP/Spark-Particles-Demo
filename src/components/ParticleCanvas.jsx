import React, { useRef, useEffect, useState } from 'react';
import { WebGLRenderer } from './ParticleSystem/WebGLRenderer.js';
import { ParticleManager } from './ParticleSystem/ParticleManager.js';
import { ConfigManager } from './Config/ConfigManager.js';

// Shader sources as strings for now (we'll load from files later)
const vertexShaderSource = `
attribute vec2 a_position;
attribute vec2 a_particlePos;
attribute float a_size;
attribute float a_life;
attribute float a_maxLife;

uniform vec2 u_resolution;
uniform mat3 u_transform;

// For non-instanced fallback
uniform vec2 u_particlePos;
uniform float u_particleSize;
uniform float u_particleLife;
uniform float u_particleMaxLife;

varying float v_life;
varying float v_alpha;
varying vec2 v_uv;

void main() {
  // Use instanced attributes if available, otherwise use uniforms
  vec2 particlePos = a_particlePos != vec2(0.0) ? a_particlePos : u_particlePos;
  float size = a_size != 0.0 ? a_size : u_particleSize;
  float life = a_life != 0.0 ? a_life : u_particleLife;
  float maxLife = a_maxLife != 0.0 ? a_maxLife : u_particleMaxLife;
  
  // Calculate lifecycle alpha
  v_life = life / maxLife;
  v_alpha = smoothstep(0.0, 0.1, v_life) * (1.0 - smoothstep(0.7, 1.0, v_life));
  
  // UV coordinates for the particle quad
  v_uv = a_position * 0.5 + 0.5;
  
  // Scale the particle based on size and lifecycle
  float sizeScale = mix(0.3, 1.0, 1.0 - v_life);
  vec2 scaledPos = a_position * size * sizeScale;
  
  // Position in world space
  vec2 worldPos = particlePos + scaledPos;
  
  // Transform to clip space
  vec3 transformed = u_transform * vec3(worldPos, 1.0);
  vec2 clipSpace = ((transformed.xy / u_resolution) * 2.0 - 1.0) * vec2(1, -1);
  
  gl_Position = vec4(clipSpace, 0.0, 1.0);
}
`;

const fragmentShaderSource = `
precision mediump float;

varying float v_life;
varying float v_alpha;
varying vec2 v_uv;

uniform vec3 u_color;
uniform float u_glowIntensity;
uniform bool u_isDarkMode;

float sparkleShape(vec2 uv) {
  vec2 center = uv - 0.5;
  float dist = length(center);
  
  float angle = atan(center.y, center.x);
  float rays = abs(sin(angle * 4.0)) * 0.3 + 0.7;
  float star = smoothstep(0.4 * rays, 0.2 * rays, dist);
  
  float glow = exp(-dist * 8.0) * 0.5;
  
  return max(star, glow);
}

void main() {
  float shape = sparkleShape(v_uv);
  
  vec3 hotColor = vec3(1.0, 0.8, 0.2);
  vec3 warmColor = vec3(1.0, 0.4, 0.1);
  vec3 coolColor = vec3(0.8, 0.2, 0.0);
  
  vec3 color;
  if (v_life > 0.7) {
    color = mix(coolColor, warmColor, (v_life - 0.7) / 0.3);
  } else {
    color = mix(warmColor, hotColor, v_life / 0.7);
  }
  
  if (!u_isDarkMode) {
    color = color * 0.8 + vec3(0.2);
  }
  
  color = mix(color, u_color, 0.3);
  
  float finalAlpha = shape * v_alpha;
  color += vec3(u_glowIntensity * 0.3) * shape;
  
  gl_FragColor = vec4(color, finalAlpha);
}
`;

export const ParticleCanvas = ({ onSettingsChange, onReady }) => {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const particleManagerRef = useRef(null);
  const configManagerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastTimeRef = useRef(0);
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    initializeSystem();
    return cleanup;
  }, []);

  const initializeSystem = async () => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Initialize managers
      configManagerRef.current = new ConfigManager();
      const settings = configManagerRef.current.getSettings();
      
      particleManagerRef.current = new ParticleManager(settings);
      rendererRef.current = new WebGLRenderer(canvas);

      // Load shaders
      await rendererRef.current.loadShaders(vertexShaderSource, fragmentShaderSource);

      // Set up canvas size
      resizeCanvas();
      
      // Subscribe to settings changes
      if (onSettingsChange) {
        configManagerRef.current.subscribe((path, value, allSettings) => {
          particleManagerRef.current?.updateSettings(allSettings);
          onSettingsChange(allSettings);
        });
      }

      // Start render loop
      startRenderLoop();
      
      setIsInitialized(true);
    } catch (err) {
      console.error('Failed to initialize particle system:', err);
      setError(err.message);
    }
  };

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const container = canvas.parentElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    canvas.width = width;
    canvas.height = height;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    rendererRef.current?.resize();
    particleManagerRef.current?.setCanvasSize(width, height);
  };

  const startRenderLoop = () => {
    const render = (currentTime) => {
      const deltaTime = (currentTime - lastTimeRef.current) / 1000; // Convert to seconds
      lastTimeRef.current = currentTime;

      // Limit delta time to prevent large jumps
      const clampedDelta = Math.min(deltaTime, 1/30); // Max 30fps minimum

      if (particleManagerRef.current && rendererRef.current && configManagerRef.current) {
        // Update particles
        particleManagerRef.current.update(clampedDelta, currentTime / 1000);
        
        // Render
        const particles = particleManagerRef.current.getParticles();
        const settings = configManagerRef.current.getSettings();
        rendererRef.current.render(particles, settings);
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    lastTimeRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(render);
  };

  const cleanup = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    rendererRef.current?.dispose();
  };

  // Mouse event handlers
  const handleMouseMove = (event) => {
    if (!particleManagerRef.current || !configManagerRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const settings = configManagerRef.current.getSettings();
    particleManagerRef.current.applyForce(
      mouseX, 
      mouseY, 
      settings.mouseInteraction.forceType,
      settings.mouseInteraction
    );
  };

  const handleMouseClick = (event) => {
    if (!particleManagerRef.current || !configManagerRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const settings = configManagerRef.current.getSettings();
    particleManagerRef.current.spawnParticleAt(
      mouseX, 
      mouseY, 
      settings.mouseInteraction.clickSpawnCount
    );
  };

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      resizeCanvas();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Expose config manager to parent
  useEffect(() => {
    if (configManagerRef.current && onSettingsChange) {
      onSettingsChange(configManagerRef.current.getSettings());
      
      // Also call onReady if provided
      if (onReady) {
        onReady(canvasRef.current, configManagerRef.current);
      }
    }
  }, [isInitialized, onSettingsChange]);

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100%',
        background: '#ff000020',
        color: '#ff0000',
        padding: '20px',
        borderRadius: '8px'
      }}>
        <div>
          <h3>WebGL Error</h3>
          <p>{error}</p>
          <p style={{ fontSize: '0.9em', opacity: 0.8 }}>
            Your browser may not support WebGL or it may be disabled.
          </p>
        </div>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      onClick={handleMouseClick}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        cursor: 'crosshair'
      }}
    />
  );
};

export default ParticleCanvas;
