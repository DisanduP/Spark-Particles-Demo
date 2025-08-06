export const DEFAULT_SETTINGS = {
  version: "1.0",
  
  particles: {
    maxCount: 2000,
    spawnRate: 39, // particles per second
    lifetime: {
      min: 3.3,
      max: 7.5
    },
    size: {
      base: 12.0,        // Base/maximum size of particles
      randomVariation: 0.5  // How much size can vary (0.0 = no variation, 1.0 = can be 0 to base size)
    },
    rotation: {
      speed: 2.0,        // Base rotation speed (radians per second)
      randomVariation: 0.8  // How much rotation speed can vary (0.0 = no variation, 1.0 = can be 0 to base speed)
    },
    upwardForce: 0.14,
    spawnArea: {
      x: { min: 0.0, max: 1.0 }, // percentage of screen width
      y: { min: 1.0, max: 1.2 }  // percentage of screen height (below bottom edge)
    }
  },

  childSpawning: {
    probability: 0.001, // per frame probability
    forceMultiplier: {
      target: 1.4,
      randomRange: 0.3
    },
    maxChildrenPerParticle: 3
  },

  perlinNoise: {
    scale: 0.02,
    strength: {
      horizontal: 1.0,
      vertical: 0.1
    },
    speed: 0.5,
    octaves: 3
  },

  mouseInteraction: {
    forceType: 'radial', // 'radial', 'directional', 'suction'
    strength: 86.0,
    radius: 113.0,
    falloffCurve: 2.0,
    clickSpawnCount: 16
  },

  visual: {
    useTexture: true, // Use SVG texture instead of procedural shape
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
      intensity: 0.0
    },
    gradients: {
      gradient1: [
        { position: 0, color: '#6800ff' },
        { position: 1, color: '#2500ff' }
      ],
      gradient2: [
        { position: 0, color: '#53d5fd' },
        { position: 1, color: '#4800ff' }
      ],
      gradient3: [
        { position: 0, color: '#3a88fe' },
        { position: 1, color: '#002e7a' }
      ]
    },
    opacityGradient: [
      { position: 0, opacity: 0 },
      { position: 0.09, opacity: 1 },
      { position: 0.4, opacity: 1 },
      { position: 1, opacity: 0 }
    ]
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
