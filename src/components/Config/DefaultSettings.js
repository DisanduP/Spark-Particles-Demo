export const DEFAULT_SETTINGS = {
  version: "1.0",
  
  particles: {
    maxCount: 5000,
    spawnRate: 39, // particles per second
    lifetime: {
      min: 8.1,
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
    upwardForce: 1.95,
    drag: 1.7, // Global friction (velocity decay rate per second). 0 = none, higher = stops faster
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
    scale: 3,
    strength: {
      horizontal: 2,
      vertical: 1
    },
    speed: 1.5,
    octaves: 3
  },

  mouseInteraction: {
    forceType: 'follow', // 'radial', 'directional', 'suction', 'sweep', 'follow', 'boids'
    strength: 282,
    radius: 207,
    falloffCurve: 2,
    clickSpawnCount: 50,
    sweep: {
      speedMultiplier: 8,  // How much mouse speed affects force strength
      directionalSpread: 0.8 // How focused the directional force is (0 = tight beam, 1 = wide spread)
    },
    follow: {
      // Spread of the influence behind the mouse movement
      // 0 = only directly behind, 1 = all around the mouse
      spread: 0.3,
      // Multiplier applied to the computed follow force
      strength: 15,
      // Additional suction toward the mouse during follow
      suctionStrength: 4
    },
    boids: {
      // Maximum flocking speed (pixels per second) for particles influenced by Boids
      speedLimit: 330,
      // Steering weights
      weights: {
        separation: 0.7,
        alignment: 4.3,
        cohesion: 2.2
      }
    }
  },

  visual: {
    useTexture: true, // Use SVG texture instead of procedural shape
    bloom: {
      intensity: 1.5,
      radius: 8,
      speedBased: {
        enabled: false,
        falloffDistance: 7, // Falloff distance multiplier (relative to particle size)
        colorShift: 1, // How much to reduce red tones (0 = no shift, 1 = full shift to cooler)
        minSpeedThreshold: 135, // Minimum speed to start applying bloom
        maxIntensity: 20 // Maximum bloom intensity at high speeds
      }
    },
    trails: {
      length: 20,
      fadeRate: 0.95,
      speedBased: {
        enabled: true,
        lengthMultiplier: 0.8, // Trail length multiplier based on speed
        minSpeedThreshold: 70, // Minimum speed to start showing trails
        maxLength: 15, // Maximum trail length at high speeds
        colorShift: 10, // How much to cool the trail color (0 = same as particle, 1 = fully cooled)
        spacing: 4, // Number of particle duplications between trail positions for smoother trails
        opacityFalloff: 0.1 // How quickly opacity fades along trail (1.0 = linear, >1.0 = faster fade, <1.0 = slower fade)
      }
    },
    glow: {
      radius: 12,
      intensity: 0,
      speedBased: {
        enabled: true,
        maxIntensity: 10,
        minSpeedThreshold: 85 // Minimum speed to start applying glow
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
      { position: 0.01, opacity: 1 },
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
