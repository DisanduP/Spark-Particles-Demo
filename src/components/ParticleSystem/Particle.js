import { getRandomGradient, sampleGradient, sampleOpacityGradient, rgbToHex } from '../../utils/gradientUtils.js';

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
    // Calculate size: base size minus random variation amount
    const sizeVariation = settings.particles.size.base * settings.particles.size.randomVariation;
    this.size = settings.particles.size.base - (Math.random() * sizeVariation);
    this.initialSize = this.size;
    
    // Gradient selection - randomly pick one of the three gradients
    this.gradient = getRandomGradient(settings.visual.gradients);
    // Start with initial color from gradient
    this.color = rgbToHex(sampleGradient(this.gradient, 0));
    // Start with initial opacity from opacity gradient
    this.opacity = sampleOpacityGradient(settings.visual.opacityGradient, 0);
    
    // Rotation properties
    const rotationVariation = settings.particles.rotation.speed * settings.particles.rotation.randomVariation;
    this.rotationSpeed = settings.particles.rotation.speed - (Math.random() * rotationVariation);
    // Add some random direction to rotation (clockwise or counterclockwise)
    if (Math.random() < 0.5) {
      this.rotationSpeed *= -1;
    }
    this.rotation = Math.random() * Math.PI * 2; // Start at random rotation
    
    // Child spawning
    this.childrenSpawned = 0;
    this.maxChildren = settings.childSpawning.maxChildrenPerParticle;
    
    // Physics
    this.mass = 1.0;
    
    // Speed tracking for glow effects
    this.speed = 0;
    this.speedBasedGlow = 0;
    this.speedBasedBloom = 0;
    this.noiseOffset = Math.random() * 1000; // Unique noise offset for this particle
    
    // Trail tracking
    this.trailPositions = []; // Array of {x, y, alpha} positions for trail rendering
    this.speedBasedTrailLength = 0;
  }

  update(deltaTime, settings, noiseField) {
    // Update lifecycle
    this.life += deltaTime;
    
    if (this.isDead()) {
      return null;
    }

    // Apply Perlin noise force first so it's affected by drag
    if (noiseField) {
      const noiseForce = noiseField.getForceAt(
        this.x, 
        this.y, 
        this.life + this.noiseOffset
      );
      
      this.vx += noiseForce.x * settings.perlinNoise.strength.horizontal * deltaTime;
      this.vy += noiseForce.y * settings.perlinNoise.strength.vertical * deltaTime;
    }
    
    // Apply velocity drag (friction) as exponential decay
    const drag = Math.max(0, settings?.particles?.drag ?? 0);
    if (drag > 0) {
      const damp = Math.exp(-drag * deltaTime);
      this.vx *= damp;
      this.vy *= damp;
    }
    
    // Apply upward force AFTER drag so it isn't diminished by friction
    this.vy -= settings.particles.upwardForce * deltaTime;
    
    // Update position
    this.x += this.vx * deltaTime * 60; // Scale for 60fps equivalent
    this.y += this.vy * deltaTime * 60;
    
    // Calculate current speed for glow effects
    this.speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy) * 60; // Scale to match position scaling
    
    // Calculate speed-based glow intensity
    if (settings.visual.glow.speedBased.enabled && this.speed > settings.visual.glow.speedBased.minSpeedThreshold) {
      // Normalize speed above threshold (0 = threshold, 1 = very fast)
      const normalizedSpeed = Math.min((this.speed - settings.visual.glow.speedBased.minSpeedThreshold) / 200, 1.0);
      this.speedBasedGlow = normalizedSpeed * settings.visual.glow.speedBased.maxIntensity;
    } else {
      this.speedBasedGlow = 0;
    }
    
    // Calculate speed-based bloom intensity
    if (settings.visual.bloom.speedBased.enabled && this.speed > settings.visual.bloom.speedBased.minSpeedThreshold) {
      const normalizedSpeed = Math.min((this.speed - settings.visual.bloom.speedBased.minSpeedThreshold) / 200, 1.0);
      this.speedBasedBloom = normalizedSpeed * settings.visual.bloom.speedBased.maxIntensity;
    } else {
      this.speedBasedBloom = 0;
    }
    
    // Calculate speed-based trail length and update trail positions
    if (settings.visual.trails.speedBased.enabled && this.speed > settings.visual.trails.speedBased.minSpeedThreshold) {
      const normalizedSpeed = Math.min((this.speed - settings.visual.trails.speedBased.minSpeedThreshold) / 200, 1.0);
      this.speedBasedTrailLength = Math.floor(normalizedSpeed * settings.visual.trails.speedBased.maxLength * settings.visual.trails.speedBased.lengthMultiplier);
      
      // Add current position to trail
      this.trailPositions.unshift({ x: this.x, y: this.y, alpha: 1.0 });
      
      // Trim trail to desired length
      if (this.trailPositions.length > this.speedBasedTrailLength) {
        this.trailPositions = this.trailPositions.slice(0, this.speedBasedTrailLength);
      }
      
      // Update trail alphas (fade over distance)
      for (let i = 0; i < this.trailPositions.length; i++) {
        const normalizedPosition = i / this.trailPositions.length; // 0 to 1
        const falloffExponent = settings.visual.trails.speedBased.opacityFalloff || 1.0;
        this.trailPositions[i].alpha = 1.0 - Math.pow(normalizedPosition, falloffExponent);
      }
    } else {
      this.speedBasedTrailLength = 0;
      this.trailPositions = [];
    }
    
    // Calculate lifecycle ratio for gradients
    const lifeRatio = this.life / this.maxLife;
    
    // Update color based on gradient and lifecycle
    this.color = rgbToHex(sampleGradient(this.gradient, lifeRatio));
    
    // Update opacity based on opacity gradient and lifecycle
    this.opacity = sampleOpacityGradient(settings.visual.opacityGradient, lifeRatio);
    
    // Update size based on opacity: 0% opacity = 0 size, 100% opacity = initial size
    this.size = this.initialSize * this.opacity;
    
    // Update rotation
    this.rotation += this.rotationSpeed * deltaTime;
    
    return this;
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

  // Check if particle is within screen bounds (with margin)
  isOnScreen(width, height, margin = 100) {
    return this.x > -margin && 
           this.x < width + margin && 
           this.y > -margin && 
           this.y < height + margin;
  }
}
