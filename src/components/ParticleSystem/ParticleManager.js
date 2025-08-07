import { Particle } from './Particle.js';
import { PerlinNoise } from './PerlinNoise.js';

export class ParticleManager {
  constructor(settings) {
    this.particles = [];
    this.settings = settings;
    this.perlinNoise = new PerlinNoise(settings);
    
    this.lastSpawnTime = 0;
    this.timeAccumulator = 0;
    
    // Mouse spawning state
    this.mouseSpawnActive = false;
    this.mouseSpawnPosition = { x: 0, y: 0 };
    this.mouseSpawnAccumulator = 0;
    
    // Canvas dimensions for boundary checking
    this.canvasWidth = 800;
    this.canvasHeight = 600;
  }

  update(deltaTime) {
    this.timeAccumulator += deltaTime;
    this.mouseSpawnAccumulator += deltaTime;
    
    // Spawn new particles based on spawn rate
    this.spawnParticles();
    
    // Handle mouse spawning if active
    this.spawnMouseParticles();
    
    // Update existing particles
    this.updateParticles(deltaTime);
    
    // Clean up dead particles
    this.cleanupParticles();
    
    // Spawn child particles
    this.spawnChildParticles();
  }

  spawnParticles() {
    const spawnInterval = 1.0 / this.settings.particles.spawnRate;
    
    while (this.timeAccumulator >= spawnInterval && 
           this.particles.length < this.settings.particles.maxCount) {
      
      this.spawnRandomParticle();
      this.timeAccumulator -= spawnInterval;
    }
  }

  spawnMouseParticles() {
    if (!this.mouseSpawnActive) return;
    
    const spawnRate = this.settings.mouseInteraction.clickSpawnCount; // particles per second
    const spawnInterval = 1.0 / spawnRate;
    
    while (this.mouseSpawnAccumulator >= spawnInterval && 
           this.particles.length < this.settings.particles.maxCount) {
      
      this.spawnParticleAt(this.mouseSpawnPosition.x, this.mouseSpawnPosition.y, 1);
      this.mouseSpawnAccumulator -= spawnInterval;
    }
  }

  spawnRandomParticle() {
    const spawnArea = this.settings.particles.spawnArea;
    
    // Random position in spawn area
    const x = this.canvasWidth * (spawnArea.x.min + 
              Math.random() * (spawnArea.x.max - spawnArea.x.min));
    const y = this.canvasHeight * (spawnArea.y.min + 
              Math.random() * (spawnArea.y.max - spawnArea.y.min));
    
    const particle = new Particle(x, y, this.settings);
    this.particles.push(particle);
    
    return particle;
  }

  spawnParticleAt(x, y, count = 1) {
    const spawned = [];
    
    for (let i = 0; i < count && this.particles.length < this.settings.particles.maxCount; i++) {
      // Add some randomness around the spawn point
      const offsetX = (Math.random() - 0.5) * 20;
      const offsetY = (Math.random() - 0.5) * 20;
      
      const particle = new Particle(x + offsetX, y + offsetY, this.settings);
      
      // Give clicked particles a bit more initial upward velocity
      particle.vy -= 0.3;
      
      this.particles.push(particle);
      spawned.push(particle);
    }
    
    return spawned;
  }

  updateParticles(deltaTime) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      if (particle.update(deltaTime, this.settings, this.perlinNoise) === null) {
        // Particle died during update
        this.particles.splice(i, 1);
        continue;
      }
      
      // Remove particles that are way off screen
      if (!particle.isOnScreen(this.canvasWidth, this.canvasHeight, 200)) {
        this.particles.splice(i, 1);
      }
    }
  }

  cleanupParticles() {
    this.particles = this.particles.filter(particle => !particle.isDead());
  }

  spawnChildParticles() {
    const newParticles = [];
    
    for (const particle of this.particles) {
      const child = particle.spawnChild(this.settings);
      if (child && this.particles.length + newParticles.length < this.settings.particles.maxCount) {
        newParticles.push(child);
      }
    }
    
    this.particles.push(...newParticles);
  }

  applyMouseForce(mouseX, mouseY, forceSettings) {
    const { strength, radius, falloffCurve } = forceSettings;
    
    for (const particle of this.particles) {
      const dx = particle.x - mouseX;
      const dy = particle.y - mouseY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < radius && distance > 0) {
        // Calculate force magnitude with falloff
        const normalizedDistance = distance / radius;
        const falloff = Math.pow(1 - normalizedDistance, falloffCurve);
        const forceMagnitude = strength * falloff;
        
        // Apply radial force (push away from mouse)
        const forceX = (dx / distance) * forceMagnitude;
        const forceY = (dy / distance) * forceMagnitude;
        
        particle.applyForce(forceX * 0.01, forceY * 0.01); // Scale down force
      }
    }
  }

  // Handle different force types
  applyForce(mouseX, mouseY, forceType, forceSettings, mouseVelocity = null) {
    switch (forceType) {
      case 'radial':
        this.applyMouseForce(mouseX, mouseY, forceSettings);
        break;
      case 'suction':
        this.applySuctionForce(mouseX, mouseY, forceSettings);
        break;
      case 'directional':
        this.applyDirectionalForce(mouseX, mouseY, forceSettings);
        break;
      case 'sweep':
        this.applySweepForce(mouseX, mouseY, forceSettings, mouseVelocity);
        break;
    }
  }

  applySuctionForce(mouseX, mouseY, forceSettings) {
    const { strength, radius, falloffCurve } = forceSettings;
    
    for (const particle of this.particles) {
      const dx = mouseX - particle.x;
      const dy = mouseY - particle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < radius && distance > 0) {
        const normalizedDistance = distance / radius;
        const falloff = Math.pow(1 - normalizedDistance, falloffCurve);
        const forceMagnitude = strength * falloff;
        
        // Apply attractive force (pull toward mouse)
        const forceX = (dx / distance) * forceMagnitude;
        const forceY = (dy / distance) * forceMagnitude;
        
        particle.applyForce(forceX * 0.01, forceY * 0.01);
      }
    }
  }

  applyDirectionalForce(mouseX, mouseY, forceSettings) {
    // Apply force in a consistent direction from mouse position
    // This could be modified to use mouse movement direction
    const { strength, radius } = forceSettings;
    const forceDirection = { x: 1, y: 0 }; // Default rightward force
    
    for (const particle of this.particles) {
      const dx = particle.x - mouseX;
      const dy = particle.y - mouseY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < radius) {
        particle.applyForce(
          forceDirection.x * strength * 0.01,
          forceDirection.y * strength * 0.01
        );
      }
    }
  }

  applySweepForce(mouseX, mouseY, forceSettings, mouseVelocity) {
    if (!mouseVelocity || mouseVelocity.speed < 1) return; // Don't apply force if mouse isn't moving
    
    const { strength, radius, falloffCurve, sweep } = forceSettings;
    const { speedMultiplier, directionalSpread } = sweep;
    
    // Normalize mouse velocity direction
    const velocityMagnitude = mouseVelocity.speed;
    const velocityDirX = velocityMagnitude > 0 ? mouseVelocity.x / velocityMagnitude : 0;
    const velocityDirY = velocityMagnitude > 0 ? mouseVelocity.y / velocityMagnitude : 0;
    
    // Calculate speed-based force multiplier
    const speedBasedForce = velocityMagnitude * speedMultiplier;
    
    for (const particle of this.particles) {
      const dx = particle.x - mouseX;
      const dy = particle.y - mouseY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < radius && distance > 0) {
        // Calculate base radial force with falloff
        const normalizedDistance = distance / radius;
        const falloff = Math.pow(1 - normalizedDistance, falloffCurve);
        
        // Base radial force (push away from mouse)
        const radialDirX = dx / distance;
        const radialDirY = dy / distance;
        const radialForce = strength * falloff * 0.01;
        
        // Calculate directional alignment (how much particle direction aligns with mouse movement)
        const directionAlignment = Math.max(0, radialDirX * velocityDirX + radialDirY * velocityDirY);
        
        // Apply directional bias based on spread setting
        // directionalSpread: 0 = tight beam, 1 = wide spread
        const directionalInfluence = Math.pow(directionAlignment, 1 / (directionalSpread + 0.1));
        const directionalForce = speedBasedForce * directionalInfluence * falloff * 0.01;
        
        // Combine radial and directional forces
        const totalForceX = radialForce * radialDirX + directionalForce * velocityDirX;
        const totalForceY = radialForce * radialDirY + directionalForce * velocityDirY;
        
        particle.applyForce(totalForceX, totalForceY);
      }
    }
  }

  updateSettings(newSettings) {
    this.settings = newSettings;
    this.perlinNoise.updateSettings(newSettings);
  }

  startMouseSpawning(mouseX, mouseY) {
    this.mouseSpawnActive = true;
    this.mouseSpawnPosition = { x: mouseX, y: mouseY };
    this.mouseSpawnAccumulator = 0; // Reset accumulator to start spawning immediately
  }

  stopMouseSpawning() {
    this.mouseSpawnActive = false;
  }

  updateMouseSpawnPosition(mouseX, mouseY) {
    if (this.mouseSpawnActive) {
      this.mouseSpawnPosition = { x: mouseX, y: mouseY };
    }
  }

  setCanvasSize(width, height) {
    const oldWidth = this.canvasWidth;
    const oldHeight = this.canvasHeight;
    
    // Update canvas dimensions
    this.canvasWidth = width;
    this.canvasHeight = height;
    
    // Only rescale particles if we have a valid previous size and particles exist
    if (oldWidth > 0 && oldHeight > 0 && this.particles.length > 0) {
      const scaleX = width / oldWidth;
      const scaleY = height / oldHeight;
      
      // Use the average scale to maintain velocity characteristics better
      const avgScale = (scaleX + scaleY) / 2.0;
      
      // Rescale existing particle positions to maintain relative positioning
      for (const particle of this.particles) {
        particle.x *= scaleX;
        particle.y *= scaleY;
        
        // Scale velocity proportionally but more conservatively to maintain movement feel
        particle.vx *= avgScale;
        particle.vy *= avgScale;
      }
    }
  }

  getParticles() {
    return this.particles;
  }

  getParticleCount() {
    return this.particles.length;
  }

  clear() {
    this.particles = [];
  }
}
