# WebGL Fire Ember Particle System

A highly configurable WebGL-based particle system that simulates fire embers with interactive controls, built for prototyping and eventual integration into React applications.

## Features

- **WebGL Rendering**: High-performance particle rendering using raw WebGL
- **Fire Ember Physics**: Realistic ember behavior with upward drift and fading
- **Perlin Noise**: 3D noise field affecting particle movement
- **Child Particle Spawning**: Particles can spawn new particles during their lifecycle
- **Interactive Controls**: Mouse interactions to spawn and influence particles
- **Real-time Configuration**: Live parameter tweaking with sliders and inputs
- **Dark/Light Themes**: Full theme support for UI and rendering
- **Export/Import**: Save and load particle configurations as JSON
- **Extensible Force System**: Pluggable force types (radial, suction, directional)

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/spark-particles.git
cd spark-particles
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Open your browser and navigate to the local development URL (usually `http://localhost:5173`)

### Usage

#### Mouse Interactions
- **Click**: Spawn new particles at mouse position
- **Mouse Move**: Apply force to nearby particles (configurable force type)

#### Control Panel
The right-side control panel allows real-time adjustment of:

- **Particle Behavior**: Spawn rate, lifetime, upward force
- **Child Spawning**: Probability, force multipliers, spawn limits
- **Perlin Noise**: Scale, strength, speed, complexity
- **Mouse Interaction**: Force type, strength, radius, falloff
- **Visual Effects**: Glow intensity, bloom effects
- **Configuration**: Export/import settings, reset to defaults

### Building for Production

```bash
npm run build
```

## Architecture

The system is built with a modular architecture for easy maintenance and extension:

```
src/
├── components/
│   ├── ParticleSystem/          # Core particle logic
│   ├── UI/                      # User interface components
│   ├── Config/                  # Configuration management
│   └── ParticleCanvas.js        # Main canvas component
├── shaders/                     # GLSL shader files
└── assets/                      # Static assets
```

## Performance

Optimized for different performance levels with automatic fallbacks:
- Supports 100-2000+ particles depending on hardware
- Automatic WebGL instancing with graceful fallback
- Configurable quality settings

## Deployment

This project is set up for automatic deployment to GitHub Pages:

- **Live Demo**: [https://cameronfoxly.github.io/spark-particles/](https://cameronfoxly.github.io/spark-particles/)
- **Auto Deploy**: Pushes to `main` branch automatically trigger deployment
- **Manual Deploy**: Can be triggered from GitHub Actions tab

### GitHub Pages Setup (One-time)
1. Go to repository Settings → Pages
2. Set Source to "GitHub Actions"
3. The workflow handles the rest automatically

## Browser Support

- **Modern browsers**: Full WebGL support with instanced rendering
- **Older browsers**: Fallback rendering mode
- **Mobile**: Touch-optimized interactions

---

*See PRD.md for detailed technical specifications and development phases.*
