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
  
  // Mouse velocity tracking
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const mouseVelocityRef = useRef({ x: 0, y: 0, speed: 0 });
  const isMouseInsideCanvasRef = useRef(false);
  
  // Track active touches for multi-touch support
  const activeTouchesRef = useRef(new Map());
  
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
        configManagerRef.current.updateSetting('visual.useTexture', false);
      }

      // Set up canvas size
      resizeCanvas();
      
            // Subscribe to config changes
      configManagerRef.current.subscribe((path, value, allSettings) => {
        // Notify parent component of settings changes
        if (onSettingsChange) {
          onSettingsChange(allSettings);
        }
      });

      // Start render loop
      startRenderLoop();
      
      setIsInitialized(true);
    } catch (err) {
      console.error('Failed to initialize particle system:', err);
      setError(err.message);
    }
    };

    initializeSystem();
    return cleanup;
  }, [onSettingsChange]);

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
        // Get current settings to determine shader mode
        const settings = configManagerRef.current.getSettings();
        
        // Update particle manager with current settings
        particleManagerRef.current.updateSettings(settings);
        
        // Update particles
        particleManagerRef.current.update(clampedDelta, currentTime / 1000);
        
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

  // Helper function to get pointer position from event
  const getPointerPosition = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Handle both mouse and touch events
    let clientX, clientY;
    
    if (event.touches && event.touches.length > 0) {
      // Touch event - use first touch
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else if (event.changedTouches && event.changedTouches.length > 0) {
      // Touch end event - use first changed touch
      clientX = event.changedTouches[0].clientX;
      clientY = event.changedTouches[0].clientY;
    } else {
      // Mouse event
      clientX = event.clientX;
      clientY = event.clientY;
    }
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  // Unified pointer move handler for both mouse and touch
  const handlePointerMove = (event) => {
    if (!particleManagerRef.current || !configManagerRef.current) return;

    const position = getPointerPosition(event);
    const { x: pointerX, y: pointerY } = position;

    // Only calculate velocity for mouse events, not touch events
    // Touch events handle their own velocity calculation
    if (event.type === 'mousemove') {
      // Only calculate velocity if mouse was already inside canvas
      if (isMouseInsideCanvasRef.current) {
        const lastPos = lastMousePosRef.current;
        const velocityX = pointerX - lastPos.x;
        const velocityY = pointerY - lastPos.y;
        const speed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
        
        // Update velocity tracking
        mouseVelocityRef.current = { x: velocityX, y: velocityY, speed };
      } else {
        // Reset velocity when mouse first enters canvas
        mouseVelocityRef.current = { x: 0, y: 0, speed: 0 };
        isMouseInsideCanvasRef.current = true;
      }
      
      // Always update last position for next frame
      lastMousePosRef.current = { x: pointerX, y: pointerY };

      const settings = configManagerRef.current.getSettings();
      particleManagerRef.current.applyForce(
        pointerX, 
        pointerY, 
        settings.mouseInteraction.forceType,
        settings.mouseInteraction,
        mouseVelocityRef.current
      );

      // Update spawn position if actively spawning
      particleManagerRef.current.updateMouseSpawnPosition(pointerX, pointerY);
    }
  };

  // Unified pointer down handler for both mouse and touch
  const handlePointerDown = (event) => {
    if (!particleManagerRef.current || !configManagerRef.current) return;

    // Prevent default touch behavior (scrolling, zooming)
    if (event.type === 'touchstart') {
      event.preventDefault();
    }

    const position = getPointerPosition(event);
    const { x: pointerX, y: pointerY } = position;

    // For mouse events, ensure we're tracking properly
    if (event.type === 'mousedown') {
      isMouseInsideCanvasRef.current = true;
      lastMousePosRef.current = { x: pointerX, y: pointerY };
      mouseVelocityRef.current = { x: 0, y: 0, speed: 0 };
    }

    // Start continuous spawning at pointer position
    particleManagerRef.current.startMouseSpawning(pointerX, pointerY);
  };

  // Unified pointer up handler for both mouse and touch
  const handlePointerUp = (event) => {
    if (!particleManagerRef.current) return;
    
    // Stop continuous spawning
    particleManagerRef.current.stopMouseSpawning();
  };

  // Mouse event handlers (delegating to unified handlers)
  const handleMouseMove = (event) => handlePointerMove(event);
  const handleMouseDown = (event) => handlePointerDown(event);
  const handleMouseUp = (event) => handlePointerUp(event);

  const handleMouseLeave = (event) => {
    if (!particleManagerRef.current) return;
    
    // Stop spawning when mouse leaves canvas
    particleManagerRef.current.stopMouseSpawning();
    
    // Reset mouse tracking state
    isMouseInsideCanvasRef.current = false;
    mouseVelocityRef.current = { x: 0, y: 0, speed: 0 };
  };

  const handleMouseEnter = (event) => {
    // Reset velocity when mouse enters canvas to prevent large velocity jumps
    mouseVelocityRef.current = { x: 0, y: 0, speed: 0 };
    isMouseInsideCanvasRef.current = false; // Will be set to true on first move
  };

  // Touch event handlers with multi-touch support
  const handleTouchStart = (event) => {
    if (!particleManagerRef.current || !configManagerRef.current) return;
    
    // Prevent default touch behavior (scrolling, zooming)
    event.preventDefault();
    
    // Handle all new touches
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const touchX = touch.clientX - rect.left;
      const touchY = touch.clientY - rect.top;
      
      // Store touch data with initial velocity of zero
      activeTouchesRef.current.set(touch.identifier, {
        x: touchX,
        y: touchY,
        lastX: touchX,
        lastY: touchY,
        startX: touchX, // Track starting position
        startY: touchY,
        hasMoved: false, // Track if this touch has actually moved
        isFirstMove: true // Flag to skip velocity calculation on first move
      });
    }
    
    // Check if we now have two or more fingers - start spawning at first finger's position
    if (activeTouchesRef.current.size >= 2) {
      // Get the first touch (chronologically first one added)
      const firstTouch = activeTouchesRef.current.values().next().value;
      if (firstTouch) {
        particleManagerRef.current.startMouseSpawning(firstTouch.x, firstTouch.y);
      }
    } else {
      // Single finger - stop any existing spawning
      particleManagerRef.current.stopMouseSpawning();
    }
  };

  const handleTouchMove = (event) => {
    if (!particleManagerRef.current || !configManagerRef.current) return;
    
    // Prevent default touch behavior (scrolling)
    event.preventDefault();
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const settings = configManagerRef.current.getSettings();
    
    // Handle all moving touches
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      const touchData = activeTouchesRef.current.get(touch.identifier);
      
      if (touchData) {
        const touchX = touch.clientX - rect.left;
        const touchY = touch.clientY - rect.top;
        
        // Check if this is actual movement (not just a tiny touch variation)
        const moveDistance = Math.sqrt(
          Math.pow(touchX - touchData.startX, 2) + 
          Math.pow(touchY - touchData.startY, 2)
        );
        
        // Only start applying forces if touch has moved significantly (more than 5 pixels)
        const isSignificantMove = moveDistance > 5;
        
        if (isSignificantMove) {
          touchData.hasMoved = true;
        }
        
        // Calculate touch velocity for force application
        let velocity = { x: 0, y: 0, speed: 0 };
        
        if (touchData.hasMoved && !touchData.isFirstMove) {
          const velocityX = touchX - touchData.lastX;
          const velocityY = touchY - touchData.lastY;
          const speed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
          velocity = { x: velocityX, y: velocityY, speed };
          
          // Apply force for this touch (works for both single and multi-touch)
          particleManagerRef.current.applyForce(
            touchX,
            touchY,
            settings.mouseInteraction.forceType,
            settings.mouseInteraction,
            velocity
          );
        }
        
        // Update stored touch data
        touchData.lastX = touchX;
        touchData.lastY = touchY;
        touchData.x = touchX;
        touchData.y = touchY;
        touchData.isFirstMove = false;
      }
    }
    
    // Update spawn position if we have 2+ fingers (always use first finger's position)
    if (activeTouchesRef.current.size >= 2) {
      const firstTouch = activeTouchesRef.current.values().next().value;
      if (firstTouch) {
        particleManagerRef.current.updateMouseSpawnPosition(firstTouch.x, firstTouch.y);
      }
    }
  };

  const handleTouchEnd = (event) => {
    if (!particleManagerRef.current) return;
    
    // Handle all ended touches
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      activeTouchesRef.current.delete(touch.identifier);
    }
    
    // Check touch count after removal
    if (activeTouchesRef.current.size >= 2) {
      // Still have 2+ fingers, keep spawning at first finger's position
      const firstTouch = activeTouchesRef.current.values().next().value;
      if (firstTouch) {
        // Make sure spawning is still active at the first finger's position
        particleManagerRef.current.updateMouseSpawnPosition(firstTouch.x, firstTouch.y);
      }
    } else {
      // Less than 2 fingers remaining, stop spawning
      particleManagerRef.current.stopMouseSpawning();
    }
  };

  const handleTouchCancel = (event) => {
    // Treat touch cancel the same as touch end
    handleTouchEnd(event);
  };

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      resizeCanvas();
    };

    // Global mouse up handler to ensure spawning stops even if mouse is released outside canvas
    const handleGlobalMouseUp = () => {
      if (particleManagerRef.current) {
        particleManagerRef.current.stopMouseSpawning();
      }
    };

    // Global touch end handler to ensure spawning stops even if touch is released outside canvas
    const handleGlobalTouchEnd = () => {
      if (particleManagerRef.current) {
        // Clear all active touches
        activeTouchesRef.current.clear();
        particleManagerRef.current.stopMouseSpawning();
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchend', handleGlobalTouchEnd);
    window.addEventListener('touchcancel', handleGlobalTouchEnd);
    
    // Also use ResizeObserver to watch the canvas container
    const canvas = canvasRef.current;
    if (canvas && canvas.parentElement) {
      const resizeObserver = new ResizeObserver(() => {
        resizeCanvas();
      });
      
      resizeObserver.observe(canvas.parentElement);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('mouseup', handleGlobalMouseUp);
        window.removeEventListener('touchend', handleGlobalTouchEnd);
        window.removeEventListener('touchcancel', handleGlobalTouchEnd);
        resizeObserver.disconnect();
      };
    }
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchend', handleGlobalTouchEnd);
      window.removeEventListener('touchcancel', handleGlobalTouchEnd);
    };
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
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: 'crosshair',
          touchAction: 'none', // Prevent default touch behaviors like scrolling
          WebkitTouchCallout: 'none', // Prevent iOS callout menu
          WebkitUserSelect: 'none', // Prevent text selection
          userSelect: 'none'
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
