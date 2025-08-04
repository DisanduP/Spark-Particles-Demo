export class Particle {
  constructor(x, y, settings) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 0.5; // Small random horizontal velocity
    this.vy = -Math.random() * 0.5 - 0.2;  // Upward velocity
    
    // Lifecycle
    this.life = 0;
    this.maxLife = settings.particles.lifetime.min + 
                   Math.random() * (settings.particles.lifetime.max - settings.particles.lifetime.min);
    
    // Visual properties
    this.size = settings.particles.size.min + 
                Math.random() * (settings.particles.size.max - settings.particles.size.min);
    this.initialSize = this.size;
    
    // Child spawning
    this.childrenSpawned = 0;
    this.maxChildren = settings.childSpawning.maxChildrenPerParticle;
    
    // Physics
    this.mass = 1.0;
    this.noiseOffset = Math.random() * 1000; // Unique noise offset for this particle
  }

  update(deltaTime, settings, noiseField) {
    // Update lifecycle
    this.life += deltaTime;
    
    if (this.isDead()) {
      return null;
    }

    // Apply upward force
    this.vy -= settings.particles.upwardForce * deltaTime;
    
    // Apply Perlin noise force
    if (noiseField) {
      const noiseForce = noiseField.getForceAt(
        this.x, 
        this.y, 
        this.life + this.noiseOffset
      );
      
      this.vx += noiseForce.x * settings.perlinNoise.strength.horizontal * deltaTime;
      this.vy += noiseForce.y * settings.perlinNoise.strength.vertical * deltaTime;
    }
    
    // Apply velocity damping
    this.vx *= 0.999;
    this.vy *= 0.999;
    
    // Update position
    this.x += this.vx * deltaTime * 60; // Scale for 60fps equivalent
    this.y += this.vy * deltaTime * 60;
    
    // Update size based on lifecycle
    const lifeRatio = this.life / this.maxLife;
    this.size = this.initialSize * this.getSizeMultiplier(lifeRatio);
    
    return this;
  }

  getSizeMultiplier(lifeRatio) {
    // Start small, grow quickly, then fade
    if (lifeRatio < 0.1) {
      return lifeRatio * 10; // Quick growth from 0 to 1
    } else if (lifeRatio < 0.7) {
      return 1.0; // Maintain size
    } else {
      return 1.0 - ((lifeRatio - 0.7) / 0.3); // Fade to 0
    }
  }

  applyForce(fx, fy) {
    this.vx += fx / this.mass;
    this.vy += fy / this.mass;
  }

  shouldSpawnChild(settings) {
    if (this.childrenSpawned >= this.maxChildren) {
      return false;
    }
    
    // Only spawn children during middle of lifecycle
    const lifeRatio = this.life / this.maxLife;
    if (lifeRatio < 0.2 || lifeRatio > 0.8) {
      return false;
    }
    
    return Math.random() < settings.childSpawning.probability;
  }

  spawnChild(settings) {
    if (!this.shouldSpawnChild(settings)) {
      return null;
    }
    
    this.childrenSpawned++;
    
    // Create child near parent with some offset
    const offset = 10 + Math.random() * 20;
    const angle = Math.random() * Math.PI * 2;
    const childX = this.x + Math.cos(angle) * offset;
    const childY = this.y + Math.sin(angle) * offset;
    
    const child = new Particle(childX, childY, settings);
    
    // Apply force multiplier to child
    const multiplier = settings.childSpawning.forceMultiplier.target +
                      (Math.random() - 0.5) * settings.childSpawning.forceMultiplier.randomRange;
    
    child.vx = this.vx * multiplier + (Math.random() - 0.5) * 0.3;
    child.vy = this.vy * multiplier - Math.random() * 0.2; // Extra upward boost
    
    return child;
  }

  isDead() {
    return this.life >= this.maxLife;
  }

  getAlpha() {
    const lifeRatio = this.life / this.maxLife;
    
    // Fade in quickly, then fade out slowly
    if (lifeRatio < 0.1) {
      return lifeRatio * 10; // Quick fade in
    } else if (lifeRatio < 0.7) {
      return 1.0; // Full opacity
    } else {
      return 1.0 - ((lifeRatio - 0.7) / 0.3); // Slow fade out
    }
  }

  // Check if particle is within screen bounds (with margin)
  isOnScreen(width, height, margin = 100) {
    return this.x > -margin && 
           this.x < width + margin && 
           this.y > -margin && 
           this.y < height + margin;
  }
}
