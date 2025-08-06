import React, { useRef, useEffect, useState } from 'react';
import { WebGLRenderer } from './ParticleSystem/WebGLRenderer.js';
import { ParticleManager } from './ParticleSystem/ParticleManager.js';
import { ConfigManager } from './Config/ConfigManager.js';
import sparkleUrl from '../assets/sparkle.svg';

export const ParticleCanvas = ({ onSettingsChange, onReady, settings }) => {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const particleManagerRef = useRef(null);
  const configManagerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastTimeRef = useRef(0);
  const fpsRef = useRef(60);
  const frameCountRef = useRef(0);
  const lastFpsUpdateRef = useRef(0);
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [statusInfo, setStatusInfo] = useState({
    renderer: 'WebGL',
    shaderMode: 'Files',
    particleCount: 0,
    maxParticles: 1000,
    fps: 60
  });

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

      // Load sparkle texture
      try {
        await rendererRef.current.loadSVGAsTexture(sparkleUrl);
      } catch (error) {
        console.warn('Failed to load sparkle texture, falling back to procedural rendering:', error);
        // Update settings to disable texture usage if loading failed
        const currentSettings = configManagerRef.current.getSettings();
        configManagerRef.current.updateSetting('visual.useTexture', false);
      }

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
    if (!container) return;

    const { width, height } = container.getBoundingClientRect();
    
    // Set canvas size
    canvas.width = width;
    canvas.height = height;
    
    if (rendererRef.current) {
      rendererRef.current.resize();
    }
    
    if (particleManagerRef.current) {
      particleManagerRef.current.setCanvasSize(width, height);
    }
  };  const startRenderLoop = () => {
    const render = (currentTime) => {
      const deltaTime = (currentTime - lastTimeRef.current) / 1000; // Convert to seconds
      lastTimeRef.current = currentTime;

      // Limit delta time to prevent large jumps
      const clampedDelta = Math.min(deltaTime, 1/30); // Max 30fps minimum

      // Update FPS calculation
      frameCountRef.current++;
      if (currentTime - lastFpsUpdateRef.current >= 250) { // Update FPS every 250ms for more responsiveness
        const fps = Math.round(frameCountRef.current / ((currentTime - lastFpsUpdateRef.current) / 1000));
        fpsRef.current = fps;
        frameCountRef.current = 0;
        lastFpsUpdateRef.current = currentTime;
      }

      if (particleManagerRef.current && rendererRef.current && configManagerRef.current) {
        // Update particles
        particleManagerRef.current.update(clampedDelta, currentTime / 1000);
        
        // Get current settings to determine shader mode
        const settings = configManagerRef.current.getSettings();
        const particles = particleManagerRef.current.getParticles();
        
        // Update status info
        setStatusInfo({
          renderer: rendererRef.current.instancedArraysExt ? 'WebGL (Instanced)' : 'WebGL (Basic)',
          shaderMode: settings.visual?.useTexture ? 'Files + Texture' : 'Files + Math',
          particleCount: particles.length,
          maxParticles: settings.particles.maxCount,
          fps: fpsRef.current
        });
        
        // Render
        rendererRef.current.render(particles, settings);
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    lastTimeRef.current = performance.now();
    lastFpsUpdateRef.current = performance.now();
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
    
    // Also use ResizeObserver to watch the canvas container
    const canvas = canvasRef.current;
    if (canvas && canvas.parentElement) {
      const resizeObserver = new ResizeObserver((entries) => {
        resizeCanvas();
      });
      
      resizeObserver.observe(canvas.parentElement);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        resizeObserver.disconnect();
      };
    }
    
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
      {/* Status Display */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        background: settings?.theme?.mode === 'light' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)',
        color: settings?.theme?.mode === 'light' ? '#333333' : 'white',
        padding: '8px 12px',
        borderRadius: '6px',
        fontSize: '12px',
        fontFamily: 'monospace',
        pointerEvents: 'none',
        lineHeight: '1.4',
        minWidth: '220px',
        border: settings?.theme?.mode === 'light' ? '1px solid rgba(0,0,0,0.1)' : 'none'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>System Status</div>
        <div>Renderer: {statusInfo.renderer}</div>
        <div>Shaders: {statusInfo.shaderMode}</div>
        <div>Particles: {statusInfo.particleCount} / {statusInfo.maxParticles}</div>
        <div>FPS: {statusInfo.fps}</div>
      </div>
    </div>
  );
};

export default ParticleCanvas;
