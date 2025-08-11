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
    // Calculate spawn rate based on canvas width
    // Base ratio: 25 particles/second for 1200px width
    const baseRatio = 25 / 1200; // particles per second per pixel width
    const baseSpawnRate = this.canvasWidth * baseRatio;
    
    // Apply the UI spawn rate setting as a multiplier
    const effectiveSpawnRate = baseSpawnRate * this.settings.particles.spawnRate;
    
    const spawnInterval = 1.0 / effectiveSpawnRate;
    
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
      case 'follow':
        this.applyFollowForce(mouseX, mouseY, forceSettings, mouseVelocity);
        break;
      case 'boids':
        this.applyBoidsForce(mouseX, mouseY, forceSettings);
        break;
    }
  }

  applyBoidsForce(mouseX, mouseY, forceSettings) {
    const { radius, falloffCurve, boids } = forceSettings;
    const speedLimit = Math.max(0, boids?.speedLimit ?? 200); // px/s

    if (speedLimit <= 0) return;

    // Neighborhood parameters derived from radius
    const neighborRadius = Math.max(10, radius * 0.5);
    const separationRadius = Math.max(5, neighborRadius * 0.5);

    // Steering weights from settings
    const wSeparation = Math.max(0, boids?.weights?.separation ?? 1.5);
    const wAlignment = Math.max(0, boids?.weights?.alignment ?? 1.0);
    const wCohesion = Math.max(0, boids?.weights?.cohesion ?? 1.2); // toward mouse target

    const maxVel = speedLimit / 60; // convert px/s to px/frame
    const maxSteer = maxVel * 0.15; // steering cap per frame

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Influence only within radius of mouse
      const dxm = p.x - mouseX;
      const dym = p.y - mouseY;
      const distToMouse = Math.sqrt(dxm * dxm + dym * dym);
      if (distToMouse <= 0 || distToMouse > radius) continue;

      // Falloff factor by distance to mouse
      const normalizedDistance = distToMouse / radius;
      const falloff = Math.pow(1 - normalizedDistance, falloffCurve);

      // Accumulators
      let sepX = 0, sepY = 0; // separation
      let alignX = 0, alignY = 0; // alignment (sum of neighbor velocities)
      let alignCount = 0;

      // Find neighbors
      for (let j = 0; j < this.particles.length; j++) {
        if (i === j) continue;
        const n = this.particles[j];

        const dx = n.x - p.x;
        const dy = n.y - p.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d === 0 || d > neighborRadius) continue;

        // Alignment: average velocities
        alignX += n.vx;
        alignY += n.vy;
        alignCount++;

        // Separation: push away if too close
        if (d < separationRadius) {
          const inv = 1 / d;
          // Stronger push when closer
          const strength = (separationRadius - d) / separationRadius;
          sepX -= (dx * inv) * strength;
          sepY -= (dy * inv) * strength;
        }
      }

      // Desired velocity components (px/frame)
      let desiredSepX = 0, desiredSepY = 0;
      if (sepX !== 0 || sepY !== 0) {
        const mag = Math.sqrt(sepX * sepX + sepY * sepY) || 1;
        desiredSepX = (sepX / mag) * maxVel;
        desiredSepY = (sepY / mag) * maxVel;
      }

      let desiredAlignX = 0, desiredAlignY = 0;
      if (alignCount > 0) {
        const avgVX = alignX / alignCount;
        const avgVY = alignY / alignCount;
        const mag = Math.sqrt(avgVX * avgVX + avgVY * avgVY);
        if (mag > 0) {
          desiredAlignX = (avgVX / mag) * maxVel;
          desiredAlignY = (avgVY / mag) * maxVel;
        }
      }

      // Cohesion toward mouse target
      let desiredCohX = 0, desiredCohY = 0;
      const toMouseX = -dxm;
      const toMouseY = -dym;
      const toMag = Math.sqrt(toMouseX * toMouseX + toMouseY * toMouseY);
      if (toMag > 0) {
        desiredCohX = (toMouseX / toMag) * maxVel;
        desiredCohY = (toMouseY / toMag) * maxVel;
      }

      // Current velocity
      const vx = p.vx;
      const vy = p.vy;

      // Steering forces = desired - current
      let steerX = 0;
      let steerY = 0;

      steerX += (desiredSepX - vx) * wSeparation;
      steerY += (desiredSepY - vy) * wSeparation;

      steerX += (desiredAlignX - vx) * wAlignment;
      steerY += (desiredAlignY - vy) * wAlignment;

      steerX += (desiredCohX - vx) * wCohesion;
      steerY += (desiredCohY - vy) * wCohesion;

      // Apply falloff
      steerX *= falloff;
      steerY *= falloff;

      // Limit steer
      const steerMag = Math.sqrt(steerX * steerX + steerY * steerY);
      if (steerMag > maxSteer && steerMag > 0) {
        const s = maxSteer / steerMag;
        steerX *= s;
        steerY *= s;
      }

      p.applyForce(steerX, steerY);

      // Enforce speed limit within influence
      const sp = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (sp > maxVel && sp > 0) {
        const s = maxVel / sp;
        p.vx *= s;
        p.vy *= s;
      }
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

  applyFollowForce(mouseX, mouseY, forceSettings, mouseVelocity) {
    // No force when stationary; particles keep moving from accumulated velocity
    if (!mouseVelocity || mouseVelocity.speed <= 0) return;

    const { strength, radius, falloffCurve, follow } = forceSettings;
    const spread = Math.max(0, Math.min(1, follow?.spread ?? 1));
    const followStrength = Math.max(0, follow?.strength ?? 1);
    const suctionStrength = Math.max(0, follow?.suctionStrength ?? 0);

    // Mouse direction and speed
    const speed = mouseVelocity.speed;
    const dirX = speed > 0 ? mouseVelocity.x / speed : 0;
    const dirY = speed > 0 ? mouseVelocity.y / speed : 0;

    // Force magnitude capped at mouse speed, scaled by strength and followStrength
    const baseFollowMag = Math.min(speed * strength, speed) * followStrength * 0.01; // scale to match existing forces

    for (const particle of this.particles) {
      const dx = particle.x - mouseX;
      const dy = particle.y - mouseY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance <= 0 || distance > radius) continue;

      // Falloff by distance
      const normalizedDistance = distance / radius;
      const falloff = Math.pow(1 - normalizedDistance, falloffCurve);

      // Direction from mouse to particle (radial)
      const radialDirX = dx / distance;
      const radialDirY = dy / distance;

      // We want particles primarily behind the motion (opposite the movement direction)
      const backwardDirX = -dirX;
      const backwardDirY = -dirY;
      const alignmentBehind = Math.max(0, radialDirX * backwardDirX + radialDirY * backwardDirY);
      const spreadWeight = spread + (1 - spread) * alignmentBehind;

      // Follow component (moves along mouse direction)
      const followForceX = dirX * baseFollowMag * falloff * spreadWeight;
      const followForceY = dirY * baseFollowMag * falloff * spreadWeight;

      // Suction component (pulls toward mouse like suction mode)
      let suctionForceX = 0, suctionForceY = 0;
      if (suctionStrength > 0) {
        const suctionMag = suctionStrength * falloff * 0.01;
        const toMouseX = -radialDirX; // (mouseX - particle.x) / distance
        const toMouseY = -radialDirY; // (mouseY - particle.y) / distance
        suctionForceX = toMouseX * suctionMag;
        suctionForceY = toMouseY * suctionMag;
      }

      particle.applyForce(followForceX + suctionForceX, followForceY + suctionForceY);
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

  // Apply repelling force for the sparkle overlay area
  applyOverlayRepulsion(overlayBounds, repulsionSettings) {
    if (!repulsionSettings.enabled) return;
    
    const { forceMultiplier, paddingPixels, falloffCurve } = repulsionSettings;
    
    // Calculate repulsion area with padding
    const repulsionArea = {
      left: overlayBounds.left - paddingPixels,
      right: overlayBounds.right + paddingPixels,
      top: overlayBounds.top - paddingPixels,
      bottom: overlayBounds.bottom + paddingPixels
    };
    
    // Calculate center of the repulsion area
    const centerX = (repulsionArea.left + repulsionArea.right) / 2;
    const centerY = (repulsionArea.top + repulsionArea.bottom) / 2;
    
    // Calculate the maximum distance from center to edge (for force falloff)
    const maxRadius = Math.max(
      Math.abs(repulsionArea.right - centerX),
      Math.abs(repulsionArea.bottom - centerY)
    );

    for (const particle of this.particles) {
      // Check if particle is inside the repulsion area
      if (particle.x >= repulsionArea.left && particle.x <= repulsionArea.right &&
          particle.y >= repulsionArea.top && particle.y <= repulsionArea.bottom) {
        
        // Calculate distance from center
        const dx = particle.x - centerX;
        const dy = particle.y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
          // Calculate force with falloff (stronger at center, weaker at edges)
          const normalizedDistance = Math.min(distance / maxRadius, 1.0);
          const falloff = Math.pow(1 - normalizedDistance, falloffCurve);
          const forceMagnitude = forceMultiplier * falloff;
          
          // Apply radial force (push away from center)
          const forceX = (dx / distance) * forceMagnitude;
          const forceY = (dy / distance) * forceMagnitude;
          
          // Apply the force to the particle (scaled down for smooth movement)
          particle.applyForce(forceX * 0.02, forceY * 0.02);
        }
      }
    }
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
