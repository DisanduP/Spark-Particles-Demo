// Simplified Perlin noise implementation
export class PerlinNoise {
  constructor(settings) {
    this.settings = settings;
    this.permutation = this.generatePermutation();
    this.gradients = this.generateGradients();
  }

  generatePermutation() {
    const p = [];
    for (let i = 0; i < 256; i++) {
      p[i] = i;
    }
    
    // Shuffle array
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    
    // Duplicate for wrapping
    return p.concat(p);
  }

  generateGradients() {
    const gradients = [];
    for (let i = 0; i < 256; i++) {
      const angle = Math.random() * Math.PI * 2;
      gradients[i] = {
        x: Math.cos(angle),
        y: Math.sin(angle),
        z: (Math.random() - 0.5) * 2
      };
    }
    return gradients;
  }

  fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  lerp(a, b, t) {
    return a + t * (b - a);
  }

  dot3d(gradient, x, y, z) {
    return gradient.x * x + gradient.y * y + gradient.z * z;
  }

  noise3d(x, y, z) {
    // Scale input
    x *= this.settings.perlinNoise.scale;
    y *= this.settings.perlinNoise.scale;
    z *= this.settings.perlinNoise.scale;

    // Find unit cube containing point
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;

    // Find relative position in cube
    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);

    // Compute fade curves
    const u = this.fade(x);
    const v = this.fade(y);
    const w = this.fade(z);

    // Hash coordinates of cube corners
    const A = this.permutation[X] + Y;
    const AA = this.permutation[A] + Z;
    const AB = this.permutation[A + 1] + Z;
    const B = this.permutation[X + 1] + Y;
    const BA = this.permutation[B] + Z;
    const BB = this.permutation[B + 1] + Z;

    // Blend results from 8 corners
    return this.lerp(
      this.lerp(
        this.lerp(
          this.dot3d(this.gradients[this.permutation[AA]], x, y, z),
          this.dot3d(this.gradients[this.permutation[BA]], x - 1, y, z),
          u
        ),
        this.lerp(
          this.dot3d(this.gradients[this.permutation[AB]], x, y - 1, z),
          this.dot3d(this.gradients[this.permutation[BB]], x - 1, y - 1, z),
          u
        ),
        v
      ),
      this.lerp(
        this.lerp(
          this.dot3d(this.gradients[this.permutation[AA + 1]], x, y, z - 1),
          this.dot3d(this.gradients[this.permutation[BA + 1]], x - 1, y, z - 1),
          u
        ),
        this.lerp(
          this.dot3d(this.gradients[this.permutation[AB + 1]], x, y - 1, z - 1),
          this.dot3d(this.gradients[this.permutation[BB + 1]], x - 1, y - 1, z - 1),
          u
        ),
        v
      ),
      w
    );
  }

  // Generate layered noise with octaves
  octaveNoise(x, y, z, octaves = 4) {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      value += this.noise3d(x * frequency, y * frequency, z * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }

    return value / maxValue;
  }

  // Get force vector at a position
  getForceAt(x, y, time) {
    const octaves = this.settings.perlinNoise.octaves;
    const speed = this.settings.perlinNoise.speed;
    
    // Sample noise at slightly offset positions for force vector
    const offset = 0.01;
    const timeScaled = time * speed;
    
    const noiseX = this.octaveNoise(x + offset, y, timeScaled, octaves) - 
                   this.octaveNoise(x - offset, y, timeScaled, octaves);
    const noiseY = this.octaveNoise(x, y + offset, timeScaled, octaves) - 
                   this.octaveNoise(x, y - offset, timeScaled, octaves);
    
    return {
      x: noiseX / (2 * offset),
      y: noiseY / (2 * offset)
    };
  }

  // Update settings
  updateSettings(newSettings) {
    this.settings = newSettings;
  }

  // Visualize noise field (for debugging)
  getNoiseGrid(width, height, time, resolution = 20) {
    const grid = [];
    const stepX = width / resolution;
    const stepY = height / resolution;
    
    for (let y = 0; y < height; y += stepY) {
      for (let x = 0; x < width; x += stepX) {
        const force = this.getForceAt(x, y, time);
        grid.push({
          x,
          y,
          fx: force.x * 50, // Scale for visualization
          fy: force.y * 50
        });
      }
    }
    
    return grid;
  }
}
