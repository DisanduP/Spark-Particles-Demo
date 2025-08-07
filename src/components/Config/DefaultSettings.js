export const DEFAULT_SETTINGS = {
  version: "1.0",
  
  particles: {
    maxCount: 2000,
    spawnRate: 39, // particles per second
    lifetime: {
      min: 5,
      max: 15
    },
    size: {
      base: 12,        // Base/maximum size of particles
      randomVariation: 0.5  // How much size can vary (0.0 = no variation, 1.0 = can be 0 to base size)
    },
    rotation: {
      speed: 2,        // Base rotation speed (radians per second)
      randomVariation: 0.8  // How much rotation speed can vary (0.0 = no variation, 1.0 = can be 0 to base speed)
    },
    upwardForce: 0.15,
    spawnArea: {
      x: { min: 0, max: 1 }, // percentage of screen width
      y: { min: 1, max: 1.2 }  // percentage of screen height (below bottom edge)
    }
  },

  childSpawning: {
    probability: 0, // per frame probability
    forceMultiplier: {
      target: 1.4,
      randomRange: 0.3
    },
    maxChildrenPerParticle: 3
  },

  perlinNoise: {
    scale: 2,
    strength: {
      horizontal: 1,
      vertical: 1
    },
    speed: 0.3,
    octaves: 3
  },

  mouseInteraction: {
    forceType: 'sweep', // 'radial', 'directional', 'suction', 'sweep'
    strength: 23,
    radius: 220,
    falloffCurve: 2,
    clickSpawnCount: 20,
    sweep: {
      speedMultiplier: 8,  // How much mouse speed affects force strength
      directionalSpread: 0.8 // How focused the directional force is (0 = tight beam, 1 = wide spread)
    }
  },

  visual: {
    useTexture: true, // Use SVG texture instead of procedural shape
    bloom: {
      intensity: 1.5,
      radius: 8
    },
    trails: {
      length: 20,
      fadeRate: 0.95
    },
    glow: {
      radius: 12,
      intensity: 0,
      speedBased: {
        enabled: true,
        maxIntensity: 2,
        minSpeedThreshold: 50 // Minimum speed to start applying glow
      }
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
