# Spark Particle Prototype

A playground for building a WebGL-based particle system that simulates fire embers with interactive controls, built for prototyping and eventual integration into React applications.

**Live Demo**: [https://cameronfoxly.github.io/spark-particles/](https://cameronfoxly.github.io/spark-particles/)

### Installation

1. Clone the repository

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

### Usage

#### Mouse Interactions
- **Click**: Spawn new particles at mouse position
- **Mouse Move**: Apply force to nearby particles (configurable force type)

#### Control Panel
The right-side control panel allows real-time adjustment of:

- **Particle Behavior**: Spawn rate, lifetime, upward force
- **Child Spawning**: Probability, force multipliers, spawn limits
- **Perlin Noise**: Scale, strength, speed, complexity
- **Mouse Interaction**: Force type (Radial Push, Suction, Directional, Sweep), strength, radius, falloff
- **Visual Effects**: Glow intensity, bloom effects
- **Configuration**: Export/import settings, reset to defaults

#### Mouse Force Types
- **Radial Push**: Pushes particles away from mouse position
- **Suction**: Pulls particles toward mouse position  
- **Directional**: Applies consistent directional force
- **Sweep**: Dynamic force based on mouse movement speed and direction

