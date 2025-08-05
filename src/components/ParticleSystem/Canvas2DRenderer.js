export class Canvas2DRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    if (!this.ctx) {
      throw new Error('Canvas 2D not supported');
    }

    this.texture = null;
    this.gradientCache = new Map();
    
    this.initContext();
  }

  initContext() {
    // Set context properties for best quality
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
  }

  async loadSVGAsTexture(svgPath) {
    try {
      // Fetch the SVG content
      const response = await fetch(svgPath);
      const svgText = await response.text();
      
      // Create an image element from the SVG
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      return new Promise((resolve, reject) => {
        img.onload = () => {
          try {
            // Create a high-resolution off-screen canvas for the texture
            const textureCanvas = document.createElement('canvas');
            const textureCtx = textureCanvas.getContext('2d');
            const size = 512; // High resolution for smooth scaling
            
            textureCanvas.width = size;
            textureCanvas.height = size;
            
            // Clear to transparent
            textureCtx.clearRect(0, 0, size, size);
            
            // Enable maximum quality rendering
            textureCtx.imageSmoothingEnabled = true;
            textureCtx.imageSmoothingQuality = 'high';
            
            // Draw the SVG image centered
            textureCtx.drawImage(img, 0, 0, size, size);
            
            this.texture = textureCanvas;
            
            // Clean up blob URL
            URL.revokeObjectURL(url);
            
            console.log('Canvas 2D texture created successfully from SVG');
            resolve(textureCanvas);
          } catch (error) {
            URL.revokeObjectURL(url);
            reject(error);
          }
        };
        
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error(`Failed to load SVG: ${svgPath}`));
        };
        
        // Create blob URL for the SVG
        const blob = new Blob([svgText], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        img.src = url;
      });
    } catch (error) {
      console.error('Failed to load SVG as Canvas 2D texture:', error);
      throw error;
    }
  }

  async loadShaders() {
    // Canvas 2D doesn't use shaders, but we maintain the interface
    return Promise.resolve();
  }

  async loadShadersFromFiles() {
    // Canvas 2D doesn't use shaders, but we maintain the interface
    return Promise.resolve();
  }

  getGradient(size, alpha, color = '#FFD700') {
    const key = `${size}_${alpha}_${color}`;
    
    if (this.gradientCache.has(key)) {
      return this.gradientCache.get(key);
    }

    // Parse hex color to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Create radial gradient for particle with the specified color
    const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, size);
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha})`); // Bright center
    gradient.addColorStop(0.3, `rgba(${Math.min(255, r + 20)}, ${Math.max(0, g - 20)}, ${Math.max(0, b - 20)}, ${alpha * 0.8})`); // Slightly modified
    gradient.addColorStop(0.7, `rgba(${Math.max(0, r - 50)}, ${Math.max(0, g - 50)}, ${Math.max(0, b - 50)}, ${alpha * 0.4})`); // Darker
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`); // Transparent edge with same color

    this.gradientCache.set(key, gradient);
    return gradient;
  }

  render(particles, settings) {
    const ctx = this.ctx;
    
    if (particles.length === 0) return;

    // Clear canvas
    const bgColor = settings.theme.mode === 'dark' 
      ? settings.theme.backgroundColor.dark
      : settings.theme.backgroundColor.light;
    
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Enable compositing for glow effect
    ctx.globalCompositeOperation = 'lighter';
    
    // Sort particles by size for better visual layering (smaller particles on top)
    const sortedParticles = [...particles].sort((a, b) => b.size - a.size);

    // Render each particle
    for (const particle of sortedParticles) {
      this.renderParticle(particle, settings);
    }

    // Reset composite operation
    ctx.globalCompositeOperation = 'source-over';
  }

  renderParticle(particle, settings) {
    const ctx = this.ctx;
    const alpha = particle.getAlpha();
    
    if (alpha <= 0) return;

    ctx.save();
    
    // Move to particle position
    ctx.translate(particle.x, particle.y);
    
    const useTexture = settings.visual?.useTexture && this.texture;
    
    if (useTexture) {
      // Render using SVG texture with color tinting
      ctx.globalAlpha = alpha;
      
      const size = particle.size * 2; // Make texture particles slightly larger
      
      // Add glow effect with particle color
      if (settings.visual.glow.intensity > 0) {
        const glowSize = size * (1 + settings.visual.glow.intensity);
        const glowGradient = this.getGradient(glowSize / 2, alpha * 0.3, particle.color);
        
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(0, 0, glowSize / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Apply color tinting to texture
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = particle.color;
      ctx.fillRect(-size / 2, -size / 2, size, size);
      ctx.globalCompositeOperation = 'destination-atop';
      
      // Draw the texture
      ctx.drawImage(
        this.texture,
        -size / 2, -size / 2,
        size, size
      );
    } else {
      // Render using procedural graphics with particle color
      const gradient = this.getGradient(particle.size, alpha, particle.color);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
      ctx.fill();
      
      // Add inner bright core with lighter version of particle color
      const hex = particle.color.replace('#', '');
      const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + 100);
      const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + 100);
      const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + 100);
      
      const coreGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, particle.size * 0.3);
      coreGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha})`);
      coreGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
      
      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(0, 0, particle.size * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }

  resize() {
    const displayWidth = this.canvas.clientWidth;
    const displayHeight = this.canvas.clientHeight;
    
    if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
      this.canvas.width = displayWidth;
      this.canvas.height = displayHeight;
      
      // Clear gradient cache when canvas size changes
      this.gradientCache.clear();
      
      // Reinitialize context properties
      this.initContext();
    }
  }

  dispose() {
    // Clear gradient cache
    this.gradientCache.clear();
    
    // Canvas 2D doesn't have resources to dispose like WebGL
    console.log('Canvas 2D renderer disposed');
  }

  // Getter for compatibility with WebGL renderer interface
  get instancedArraysExt() {
    return null; // Canvas 2D doesn't use instanced arrays
  }
}
