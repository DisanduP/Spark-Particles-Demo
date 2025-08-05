import React, { useRef, useEffect, useState } from 'react';
import { WebGLRenderer } from './ParticleSystem/WebGLRenderer.js';
import { ParticleManager } from './ParticleSystem/ParticleManager.js';
import { ConfigManager } from './Config/ConfigManager.js';

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

      // Load shaders from files
      const basePath = import.meta.env.BASE_URL;
      // Ensure basePath ends with / for proper concatenation
      const normalizedBasePath = basePath.endsWith('/') ? basePath : basePath + '/';
      await rendererRef.current.loadShadersFromFiles(
        `${normalizedBasePath}shaders/particle.vert`,
        `${normalizedBasePath}shaders/particle.frag`
      );

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

  // Expose config manager to parent - only run once when initialized
  const hasCalledCallbacksRef = useRef(false);
  
  useEffect(() => {
    if (isInitialized && configManagerRef.current && !hasCalledCallbacksRef.current) {
      hasCalledCallbacksRef.current = true;
      
      // Only call onSettingsChange if it hasn't been called yet
      if (onSettingsChange) {
        onSettingsChange(configManagerRef.current.getSettings());
      }
      
      // Also call onReady if provided
      if (onReady) {
        onReady(canvasRef.current, configManagerRef.current);
      }
    }
  }, [isInitialized, onSettingsChange, onReady]); // Include callbacks but prevent multiple calls with ref

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
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
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
      {/* Debug overlay */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '5px 10px',
        borderRadius: '4px',
        fontSize: '12px',
        fontFamily: 'monospace',
        pointerEvents: 'none'
      }}>
        Renderer: WebGL | Shaders: Files | 
        Particles: {particleManagerRef.current?.particles?.length || 0}
      </div>
    </div>
  );
};

export default ParticleCanvas;
