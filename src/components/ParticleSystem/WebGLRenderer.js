import { hexToRgb } from '../../utils/gradientUtils.js';

export class WebGLRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    
    // Create WebGL context with specific attributes to control HDR behavior
    const contextAttributes = {
      alpha: true,
      depth: false,
      stencil: false,
      antialias: true,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      powerPreference: 'default',
      // Explicitly request standard color space to prevent HDR behavior
      colorSpace: 'srgb'
    };
    
    this.gl = canvas.getContext('webgl', contextAttributes) || 
              canvas.getContext('experimental-webgl', contextAttributes);
    
    if (!this.gl) {
      throw new Error('WebGL not supported');
    }

    this.program = null;
    this.buffers = {};
    this.uniforms = {};
    this.attributes = {};
    this.texture = null;
    
    // Check for instanced rendering support
    this.instancedArraysExt = this.gl.getExtension('ANGLE_instanced_arrays');
    if (!this.instancedArraysExt) {
      console.warn('Instanced rendering not supported, using fallback');
    }
    
    this.initGL();
  }

  initGL() {
    const gl = this.gl;
    
    // Enable blending for transparency
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
    // Set initial viewport
    this.resize();
  }

  async loadShaders(vertexShaderSource, fragmentShaderSource) {
    const gl = this.gl;
    
    // Create and compile shaders
    const vertexShader = this.compileShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    // Create and link program
    this.program = gl.createProgram();
    gl.attachShader(this.program, vertexShader);
    gl.attachShader(this.program, fragmentShader);
    gl.linkProgram(this.program);
    
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      throw new Error('Failed to link shader program: ' + gl.getProgramInfoLog(this.program));
    }
    
    // Get uniform and attribute locations
    this.getLocations();
    
    // Setup buffers
    this.setupBuffers();
  }

  async loadShadersFromFiles(vertexPath, fragmentPath) {
    const { loadShaderFiles } = await import('../../utils/shaderLoader.js');
    const { vertexSource, fragmentSource } = await loadShaderFiles(vertexPath, fragmentPath);
    return this.loadShaders(vertexSource, fragmentSource);
  }

  compileShader(type, source) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error('Failed to compile shader: ' + gl.getShaderInfoLog(shader));
    }
    
    return shader;
  }

  async loadSVGAsTexture(svgPath) {
    const gl = this.gl;
    
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
            // Create a canvas to render the SVG at a very high resolution
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const size = 1024; // Much higher resolution for ultra-smooth edges
            canvas.width = size;
            canvas.height = size;
            
            // Clear to transparent
            ctx.clearRect(0, 0, size, size);
            
            // Enable maximum quality rendering
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            // Scale up the context for better rasterization
            const scale = 4; // Render at 4x size internally
            ctx.scale(scale, scale);
            
            // Draw the SVG image at the scaled size
            ctx.drawImage(img, 0, 0, size / scale, size / scale);
            
            // Reset scale for texture creation
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            
            // Create texture directly from high-res canvas
            const texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            
            // Upload canvas data directly
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
            
            // Enable mipmapping for even smoother scaling
            gl.generateMipmap(gl.TEXTURE_2D);
            
            // Set texture parameters for maximum quality
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            
            // Unbind texture
            gl.bindTexture(gl.TEXTURE_2D, null);
            
            this.texture = texture;
            
            // Clean up blob URL
            URL.revokeObjectURL(url);
            
            resolve(texture);
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
      console.error('Failed to load SVG as texture:', error);
      throw error;
    }
  }

  getLocations() {
    const gl = this.gl;
    
    // Attributes
    this.attributes = {
      position: gl.getAttribLocation(this.program, 'a_position'),
      particlePos: gl.getAttribLocation(this.program, 'a_particlePos'),
      size: gl.getAttribLocation(this.program, 'a_size'),
      life: gl.getAttribLocation(this.program, 'a_life'),
      maxLife: gl.getAttribLocation(this.program, 'a_maxLife'),
      color: gl.getAttribLocation(this.program, 'a_color'),
      rotation: gl.getAttribLocation(this.program, 'a_rotation'),
      opacity: gl.getAttribLocation(this.program, 'a_opacity'),
      glowIntensity: gl.getAttribLocation(this.program, 'a_glowIntensity'),
      bloomIntensity: gl.getAttribLocation(this.program, 'a_bloomIntensity'),
      trailLength: gl.getAttribLocation(this.program, 'a_trailLength')
    };
    
    // Uniforms
    this.uniforms = {
      resolution: gl.getUniformLocation(this.program, 'u_resolution'),
      transform: gl.getUniformLocation(this.program, 'u_transform'),
      color: gl.getUniformLocation(this.program, 'u_color'),
      glowIntensity: gl.getUniformLocation(this.program, 'u_glowIntensity'),
      isDarkMode: gl.getUniformLocation(this.program, 'u_isDarkMode'),
      texture: gl.getUniformLocation(this.program, 'u_texture'),
      useTexture: gl.getUniformLocation(this.program, 'u_useTexture'),
      bloomSettings: gl.getUniformLocation(this.program, 'u_bloomSettings'), // [falloffDistance, colorShift, enabled]
      trailSettings: gl.getUniformLocation(this.program, 'u_trailSettings'), // [colorShift, enabled]
      renderPass: gl.getUniformLocation(this.program, 'u_renderPass'), // 0 = main, 1 = bloom
      bloomSizeMultiplier: gl.getUniformLocation(this.program, 'u_bloomSizeMultiplier'), // How much bigger bloom quads should be
            // For non-instanced fallback
      particlePos: gl.getUniformLocation(this.program, 'u_particlePos'),
      particleSize: gl.getUniformLocation(this.program, 'u_particleSize'),
      particleLife: gl.getUniformLocation(this.program, 'u_particleLife'),
      particleMaxLife: gl.getUniformLocation(this.program, 'u_particleMaxLife'),
      particleColor: gl.getUniformLocation(this.program, 'u_particleColor'),
      particleRotation: gl.getUniformLocation(this.program, 'u_particleRotation'),
      particleOpacity: gl.getUniformLocation(this.program, 'u_particleOpacity'),
      particleGlowIntensity: gl.getUniformLocation(this.program, 'u_particleGlowIntensity'),
      particleBloomIntensity: gl.getUniformLocation(this.program, 'u_particleBloomIntensity'),
      particleTrailLength: gl.getUniformLocation(this.program, 'u_particleTrailLength')
    };
  }

  setupBuffers() {
    const gl = this.gl;
    
    // Quad vertices for particle sprite
    const quadVertices = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1, -1,
       1,  1,
      -1,  1
    ]);
    
    // Static vertex buffer for quad
    this.buffers.position = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.position);
    gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);
    
    // Dynamic buffers for particle data
    this.buffers.particlePos = gl.createBuffer();
    this.buffers.size = gl.createBuffer();
    this.buffers.life = gl.createBuffer();
    this.buffers.maxLife = gl.createBuffer();
    this.buffers.color = gl.createBuffer();
    this.buffers.rotation = gl.createBuffer();
    this.buffers.opacity = gl.createBuffer();
    this.buffers.glowIntensity = gl.createBuffer();
    this.buffers.bloomIntensity = gl.createBuffer();
    this.buffers.trailLength = gl.createBuffer();
  }

  updateParticleData(particles) {
    const gl = this.gl;
    const particleCount = particles.length;
    
    if (particleCount === 0 || !this.buffers.particlePos) return;
    
    // Prepare data arrays
    const positions = new Float32Array(particleCount * 2);
    const sizes = new Float32Array(particleCount);
    const lives = new Float32Array(particleCount);
    const maxLives = new Float32Array(particleCount);
    const colors = new Float32Array(particleCount * 3); // RGB values
    const rotations = new Float32Array(particleCount);
    const opacities = new Float32Array(particleCount);
    const glowIntensities = new Float32Array(particleCount);
    const bloomIntensities = new Float32Array(particleCount);
    const trailLengths = new Float32Array(particleCount);
    
    // Fill arrays with particle data
    for (let i = 0; i < particleCount; i++) {
      const particle = particles[i];
      positions[i * 2] = particle.x;
      positions[i * 2 + 1] = particle.y;
      sizes[i] = particle.size;
      lives[i] = particle.life;
      maxLives[i] = particle.maxLife;
      rotations[i] = particle.rotation;
      opacities[i] = particle.opacity;
      glowIntensities[i] = particle.speedBasedGlow;
      bloomIntensities[i] = particle.speedBasedBloom;
      trailLengths[i] = particle.speedBasedTrailLength;
      
      // Convert hex color to RGB
      const rgb = hexToRgb(particle.color);
      colors[i * 3] = rgb.r;
      colors[i * 3 + 1] = rgb.g;
      colors[i * 3 + 2] = rgb.b;
    }
    
    // Update buffers
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.particlePos);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.size);
    gl.bufferData(gl.ARRAY_BUFFER, sizes, gl.DYNAMIC_DRAW);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.life);
    gl.bufferData(gl.ARRAY_BUFFER, lives, gl.DYNAMIC_DRAW);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.maxLife);
    gl.bufferData(gl.ARRAY_BUFFER, maxLives, gl.DYNAMIC_DRAW);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.color);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.DYNAMIC_DRAW);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.rotation);
    gl.bufferData(gl.ARRAY_BUFFER, rotations, gl.DYNAMIC_DRAW);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.opacity);
    gl.bufferData(gl.ARRAY_BUFFER, opacities, gl.DYNAMIC_DRAW);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.glowIntensity);
    gl.bufferData(gl.ARRAY_BUFFER, glowIntensities, gl.DYNAMIC_DRAW);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.bloomIntensity);
    gl.bufferData(gl.ARRAY_BUFFER, bloomIntensities, gl.DYNAMIC_DRAW);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.trailLength);
    gl.bufferData(gl.ARRAY_BUFFER, trailLengths, gl.DYNAMIC_DRAW);
  }

  render(particles, settings) {
    const gl = this.gl;
    
    if (!this.program || particles.length === 0) return;
    
    // Clear canvas
    const bgColor = settings.theme.mode === 'dark'
      ? hexToRgb(settings.theme.backgroundColor.dark)
      : hexToRgb(settings.theme.backgroundColor.light);
    gl.clearColor(bgColor.r, bgColor.g, bgColor.b, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    // Use shader program
    gl.useProgram(this.program);
    
    // Set common uniforms
    gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
    gl.uniformMatrix3fv(this.uniforms.transform, false, [1, 0, 0, 0, 1, 0, 0, 0, 1]);
    gl.uniform3f(this.uniforms.color, 1.0, 0.8, 0.3); // Default ember color
    
    // Adjust glow intensity based on theme mode
    const glowIntensity = settings.theme.mode === 'dark' 
      ? settings.visual.glow.intensity 
      : Math.min(settings.visual.glow.intensity, 0.3);
    gl.uniform1f(this.uniforms.glowIntensity, glowIntensity);
    
    gl.uniform1i(this.uniforms.isDarkMode, settings.theme.mode === 'dark' ? 1 : 0);
    
    // Set bloom settings [falloffDistance, colorShift, enabled]
    if (this.uniforms.bloomSettings) {
      const bloomEnabled = settings.visual.bloom.speedBased.enabled ? 1.0 : 0.0;
      gl.uniform3f(this.uniforms.bloomSettings, 
        settings.visual.bloom.speedBased.falloffDistance,
        settings.visual.bloom.speedBased.colorShift,
        bloomEnabled
      );
    }
    
    // Set trail settings [colorShift, enabled]
    if (this.uniforms.trailSettings) {
      const trailEnabled = settings.visual.trails.speedBased.enabled ? 1.0 : 0.0;
      gl.uniform2f(this.uniforms.trailSettings,
        settings.visual.trails.speedBased.colorShift,
        trailEnabled
      );
    }
    
    // Set fallback uniforms for non-instanced rendering
    if (this.uniforms.particleGlowIntensity) {
      gl.uniform1f(this.uniforms.particleGlowIntensity, 0.0);
    }
    if (this.uniforms.particleBloomIntensity) {
      gl.uniform1f(this.uniforms.particleBloomIntensity, 0.0);
    }
    if (this.uniforms.particleTrailLength) {
      gl.uniform1f(this.uniforms.particleTrailLength, 0.0);
    }
    
    // Set texture uniforms
    const useTexture = settings.visual?.useTexture || false;
    gl.uniform1i(this.uniforms.useTexture, useTexture ? 1 : 0);
    
    if (useTexture && this.texture) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.uniform1i(this.uniforms.texture, 0);
    }
    
    // Create expanded particle list with trails rendered behind main particles
    let expandedParticles = [];
    let mainParticles = [];
    
    // First, add all trail particles (render behind)
    for (let particle of particles) {
      if (settings.visual.trails.speedBased.enabled && particle.trailPositions && particle.trailPositions.length > 1) {
        const spacing = Math.max(1, settings.visual.trails.speedBased.spacing || 1);
        
        for (let i = 0; i < particle.trailPositions.length - 1; i++) {
          const currentPos = particle.trailPositions[i];
          const nextPos = particle.trailPositions[i + 1];
          
          // Interpolate between current and next position based on spacing
          for (let j = 0; j < spacing; j++) {
            const t = j / spacing; // Interpolation factor (0 to 1)
            const interpX = currentPos.x + (nextPos.x - currentPos.x) * t;
            const interpY = currentPos.y + (nextPos.y - currentPos.y) * t;
            const interpAlpha = currentPos.alpha + (nextPos.alpha - currentPos.alpha) * t;
            
            const trailParticle = {
              ...particle,
              x: interpX,
              y: interpY,
              opacity: particle.opacity * interpAlpha * 0.7, // Fade trail
              speedBasedGlow: particle.speedBasedGlow * interpAlpha * 0.5, // Reduce trail glow
              speedBasedBloom: 0, // No bloom for trails to prevent double rendering
              speedBasedTrailLength: (i + t) / particle.trailPositions.length // Use as trail position indicator
            };
            expandedParticles.push(trailParticle);
          }
        }
      }
      // Keep main particles separate for bloom pass
      mainParticles.push(particle);
    }
    
    // Then, add all main particles (render on top)
    for (let particle of mainParticles) {
      expandedParticles.push(particle);
    }
    
    // PASS 1: Render bloom effects (larger quads, additive blending) - ONLY main particles
    const bloomEnabled = settings.visual.bloom.speedBased.enabled;
    if (bloomEnabled) {
      // Enable additive blending for bloom effects in both modes
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      
      // Set bloom pass uniforms
      gl.uniform1i(this.uniforms.renderPass, 1); // bloom pass
      gl.uniform1f(this.uniforms.bloomSizeMultiplier, settings.visual.bloom.sizeMultiplier || 3.0);
      
      // Update particle data with ONLY main particles for bloom pass
      this.updateParticleData(mainParticles);
      
      // Render bloom
      if (this.instancedArraysExt) {
        this.setupInstancedRendering();
        this.instancedArraysExt.drawArraysInstancedANGLE(gl.TRIANGLES, 0, 6, mainParticles.length);
      } else {
        this.setupBasicRendering();
        for (let i = 0; i < mainParticles.length; i++) {
          this.updateSingleParticle(mainParticles[i]);
          gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
      }
      
      // Reset blending for main pass
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }
    
    // PASS 2: Render all particles (trails + main) with normal blending
    gl.uniform1i(this.uniforms.renderPass, 0); // main pass
    gl.uniform1f(this.uniforms.bloomSizeMultiplier, 1.0); // Normal size
    
    // Update particle data with expanded list (trails + main)
    this.updateParticleData(expandedParticles);
    
    // Render all particles
    if (this.instancedArraysExt) {
      this.setupInstancedRendering();
      this.instancedArraysExt.drawArraysInstancedANGLE(gl.TRIANGLES, 0, 6, expandedParticles.length);
    } else {
      this.setupBasicRendering();
      for (let i = 0; i < expandedParticles.length; i++) {
        this.updateSingleParticle(expandedParticles[i]);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
    }
  }

  setupInstancedRendering() {
    const gl = this.gl;
    
    // Vertex positions (quad)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.position);
    gl.enableVertexAttribArray(this.attributes.position);
    gl.vertexAttribPointer(this.attributes.position, 2, gl.FLOAT, false, 0, 0);
    
    // Particle positions (instanced)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.particlePos);
    gl.enableVertexAttribArray(this.attributes.particlePos);
    gl.vertexAttribPointer(this.attributes.particlePos, 2, gl.FLOAT, false, 0, 0);
    this.instancedArraysExt.vertexAttribDivisorANGLE(this.attributes.particlePos, 1);
    
    // Particle sizes (instanced)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.size);
    gl.enableVertexAttribArray(this.attributes.size);
    gl.vertexAttribPointer(this.attributes.size, 1, gl.FLOAT, false, 0, 0);
    this.instancedArraysExt.vertexAttribDivisorANGLE(this.attributes.size, 1);
    
    // Particle life (instanced)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.life);
    gl.enableVertexAttribArray(this.attributes.life);
    gl.vertexAttribPointer(this.attributes.life, 1, gl.FLOAT, false, 0, 0);
    this.instancedArraysExt.vertexAttribDivisorANGLE(this.attributes.life, 1);
    
    // Particle max life (instanced)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.maxLife);
    gl.enableVertexAttribArray(this.attributes.maxLife);
    gl.vertexAttribPointer(this.attributes.maxLife, 1, gl.FLOAT, false, 0, 0);
    this.instancedArraysExt.vertexAttribDivisorANGLE(this.attributes.maxLife, 1);
    
    // Particle colors (instanced)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.color);
    gl.enableVertexAttribArray(this.attributes.color);
    gl.vertexAttribPointer(this.attributes.color, 3, gl.FLOAT, false, 0, 0);
    this.instancedArraysExt.vertexAttribDivisorANGLE(this.attributes.color, 1);
    
    // Particle rotations (instanced)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.rotation);
    gl.enableVertexAttribArray(this.attributes.rotation);
    gl.vertexAttribPointer(this.attributes.rotation, 1, gl.FLOAT, false, 0, 0);
    this.instancedArraysExt.vertexAttribDivisorANGLE(this.attributes.rotation, 1);
    
    // Particle opacity (instanced)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.opacity);
    gl.enableVertexAttribArray(this.attributes.opacity);
    gl.vertexAttribPointer(this.attributes.opacity, 1, gl.FLOAT, false, 0, 0);
    this.instancedArraysExt.vertexAttribDivisorANGLE(this.attributes.opacity, 1);
    
    // Particle glow intensity (instanced)
    if (this.attributes.glowIntensity >= 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.glowIntensity);
      gl.enableVertexAttribArray(this.attributes.glowIntensity);
      gl.vertexAttribPointer(this.attributes.glowIntensity, 1, gl.FLOAT, false, 0, 0);
      this.instancedArraysExt.vertexAttribDivisorANGLE(this.attributes.glowIntensity, 1);
    }
    
    // Particle bloom intensity (instanced)
    if (this.attributes.bloomIntensity >= 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.bloomIntensity);
      gl.enableVertexAttribArray(this.attributes.bloomIntensity);
      gl.vertexAttribPointer(this.attributes.bloomIntensity, 1, gl.FLOAT, false, 0, 0);
      this.instancedArraysExt.vertexAttribDivisorANGLE(this.attributes.bloomIntensity, 1);
    }
    
    // Particle trail length (instanced)
    if (this.attributes.trailLength >= 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.trailLength);
      gl.enableVertexAttribArray(this.attributes.trailLength);
      gl.vertexAttribPointer(this.attributes.trailLength, 1, gl.FLOAT, false, 0, 0);
      this.instancedArraysExt.vertexAttribDivisorANGLE(this.attributes.trailLength, 1);
    }
  }

  setupBasicRendering() {
    const gl = this.gl;
    
    // Vertex positions (quad)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.position);
    gl.enableVertexAttribArray(this.attributes.position);
    gl.vertexAttribPointer(this.attributes.position, 2, gl.FLOAT, false, 0, 0);
  }

  updateSingleParticle(particle) {
    const gl = this.gl;
    
    // Update uniforms for this specific particle
    gl.uniform2f(this.uniforms.particlePos, particle.x, particle.y);
    gl.uniform1f(this.uniforms.particleSize, particle.size);
    gl.uniform1f(this.uniforms.particleLife, particle.life);
    gl.uniform1f(this.uniforms.particleMaxLife, particle.maxLife);
    gl.uniform1f(this.uniforms.particleRotation, particle.rotation);
    if (this.uniforms.particleOpacity) {
      gl.uniform1f(this.uniforms.particleOpacity, particle.opacity);
    }
    if (this.uniforms.particleGlowIntensity) {
      gl.uniform1f(this.uniforms.particleGlowIntensity, particle.speedBasedGlow);
    }
    if (this.uniforms.particleBloomIntensity) {
      gl.uniform1f(this.uniforms.particleBloomIntensity, particle.speedBasedBloom);
    }
    if (this.uniforms.particleTrailLength) {
      gl.uniform1f(this.uniforms.particleTrailLength, particle.speedBasedTrailLength);
    }
    
    // Set particle color
    const rgb = hexToRgb(particle.color);
    gl.uniform3f(this.uniforms.particleColor, rgb.r, rgb.g, rgb.b);
  }

  resize() {
    const gl = this.gl;
    
    // Always update viewport to match current canvas size
    // Don't modify canvas.width/height here - that's handled by the parent component
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  dispose() {
    const gl = this.gl;
    
    // Clean up buffers
    Object.values(this.buffers).forEach(buffer => {
      gl.deleteBuffer(buffer);
    });
    
    // Clean up texture
    if (this.texture) {
      gl.deleteTexture(this.texture);
      this.texture = null;
    }
    
    // Clean up program
    if (this.program) {
      gl.deleteProgram(this.program);
    }
  }
}
