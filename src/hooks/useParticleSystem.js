import { useRef, useEffect, useState } from 'react';
import { WebGLRenderer } from '../components/ParticleSystem/WebGLRenderer.js';
import { ParticleManager } from '../components/ParticleSystem/ParticleManager.js';
import { ConfigManager } from '../components/Config/ConfigManager.js';
import sparkleUrl from '../assets/sparkle.svg';

export const useParticleSystem = ({ settings, onSettingsChange, onReady }) => {
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

  // Additional effect to ensure canvas is resized after DOM is ready
  useEffect(() => {
    if (isInitialized && canvasRef.current) {
      // Use requestAnimationFrame to ensure DOM layout is complete
      requestAnimationFrame(() => {
        resizeCanvas();
      });
    }
  }, [isInitialized]);

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
      await rendererRef.current.loadSVGAsTexture(sparkleUrl);

      // Initial canvas size setup
      resizeCanvas();
      
      // Settings change handler
      const handleSettingsChange = (newSettings) => {
        if (particleManagerRef.current) {
          particleManagerRef.current.updateSettings(newSettings);
        }
        onSettingsChange?.(newSettings);
      };

      // Set up settings change listener
      configManagerRef.current.onSettingsChange = handleSettingsChange;

      // Initialize settings in parent component
      const initialSettings = configManagerRef.current.getSettings();
      onSettingsChange?.(initialSettings);

      setIsInitialized(true);
      setError(null);
      
      // Start render loop
      startRenderLoop();
      
      // Notify parent component
      onReady?.({
        particleManager: particleManagerRef.current,
        renderer: rendererRef.current,
        configManager: configManagerRef.current
      });

    } catch (err) {
      setError(err.message);
      setIsInitialized(false);
    }
  };

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const container = canvas.parentElement;
    if (!container) return;
    
    const { width, height } = container.getBoundingClientRect();
    
    // Set canvas display size
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    
    // Set canvas internal size with device pixel ratio for crisp rendering
    const ratio = window.devicePixelRatio || 1;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    
    // Update WebGL viewport
    if (rendererRef.current) {
      rendererRef.current.resize();
    }
    
    if (particleManagerRef.current) {
      particleManagerRef.current.setCanvasSize(width, height);
    }
  };

  const startRenderLoop = () => {
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
    if (!isInitialized) return;

    const handleResize = () => {
      // Add a small delay to ensure layout has completed
      setTimeout(() => {
        resizeCanvas();
      }, 10);
    };

    window.addEventListener('resize', handleResize);
    
    // Also use ResizeObserver to watch the canvas container
    let resizeObserver;
    if (canvasRef.current?.parentElement) {
      resizeObserver = new ResizeObserver(() => {
        // Add a small delay to ensure layout has completed
        setTimeout(() => {
          resizeCanvas();
        }, 10);
      });
      resizeObserver.observe(canvasRef.current.parentElement);
    }

    // Trigger initial resize with a delay to ensure proper sizing
    setTimeout(() => {
      resizeCanvas();
    }, 50);

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver?.disconnect();
    };
  }, [isInitialized]);

  // Settings update effect
  useEffect(() => {
    if (settings && particleManagerRef.current) {
      // Update the particle manager with new settings
      particleManagerRef.current.updateSettings(settings);
    }
  }, [settings]);

  return {
    canvasRef,
    isInitialized,
    error,
    statusInfo,
    handleMouseMove,
    handleMouseClick
  };
};
