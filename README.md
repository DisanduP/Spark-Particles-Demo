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

#### Mouse & Touch Interactions
- **Click/Tap**: Spawn new particles at cursor/finger position
- **Mouse Move/Touch Drag**: Apply force to nearby particles (configurable force type)
- **Multi-touch**: Support for multiple simultaneous touch points on mobile devices

#### Control Panel
The right-side control panel allows real-time adjustment of:

- **Particle Behavior**: Spawn rate (with separate mobile settings), lifetime, upward force
- **Child Spawning**: Probability, force multipliers, spawn limits
- **Perlin Noise**: Scale, strength, speed, complexity
- **Mouse Interaction**: Force type (Radial Push, Suction, Directional, Sweep), strength, radius, falloff
- **Overlay Repulsion**: Keep particles away from loading text/animation area
- **Visual Effects**: Glow intensity, bloom effects
- **Configuration**: Export/import settings, reset to defaults
