export const DEFAULT_SETTINGS = {
  version: "1.0",
  
  particles: {
    maxCount: 1000,
    spawnRate: 50, // particles per second
    lifetime: {
      min: 2.0,
      max: 5.0
    },
    size: {
      min: 8.0,
      max: 16.0
    },
    upwardForce: 0.5,
    spawnArea: {
      x: { min: 0.1, max: 0.9 }, // percentage of screen width
      y: { min: 0.7, max: 0.9 }  // percentage of screen height (bottom area)
    }
  },

  childSpawning: {
    probability: 0.002, // per frame probability
    forceMultiplier: {
      target: 1.2,
      randomRange: 0.3
    },
    maxChildrenPerParticle: 3
  },

  perlinNoise: {
    scale: 0.008,
    strength: {
      horizontal: 0.3,
      vertical: 0.1
    },
    speed: 0.5,
    octaves: 3
  },

  mouseInteraction: {
    forceType: 'radial', // 'radial', 'directional', 'suction'
    strength: 150.0,
    radius: 100.0,
    falloffCurve: 2.0,
    clickSpawnCount: 5
  },

  visual: {
    bloom: {
      intensity: 1.5,
      radius: 8.0
    },
    trails: {
      length: 20,
      fadeRate: 0.95
    },
    glow: {
      radius: 12.0,
      intensity: 0.8
    }
  },

  theme: {
    mode: 'dark', // 'dark' or 'light'
    backgroundColor: {
      dark: '#0a0a0a',
      light: '#f5f5f5'
    },
    uiPanelOpacity: 0.9
  }
};

export const PERFORMANCE_PRESETS = {
  low: {
    maxParticles: 200,
    trailLength: 10,
    bloomQuality: 'low'
  },
  medium: {
    maxParticles: 500,
    trailLength: 15,
    bloomQuality: 'medium'
  },
  high: {
    maxParticles: 1000,
    trailLength: 20,
    bloomQuality: 'high'
  },
  ultra: {
    maxParticles: 2000,
    trailLength: 30,
    bloomQuality: 'ultra'
  }
};
