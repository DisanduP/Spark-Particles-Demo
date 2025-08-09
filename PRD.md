# WebGL Fire Ember Particle System - Product Requirements Document

## Project Overview
A WebGL-based particle system simulating fire embers with interactive controls, designed for prototyping and eventual integration into React applications.

## Core Features

### 1. Particle System
- **Rendering**: Raw WebGL implementation for performance
- **Capacity**: Support 100-10,000 particles simultaneously
- **Lifespan**: Particles start large and fade over customizable duration (2-10 seconds)
- **Appearance**: SVG-based sparkle design (easily swappable)

### 2. Physics & Movement
- **Base Movement**: Upward drift with configurable strength
- **Perlin Noise**: 3D noise field affecting both horizontal and vertical movement
- **Particle Spawning**: 
  - Random emission from lower screen area
  - Child particles inherit parent position with force multiplier
  - Configurable spawn rate and probability

### 3. Mouse Interactions
- **Click Spawning**: Create new particles at mouse position
- **Force System**: Extensible force architecture supporting:
  - Radial force (initial implementation)
  - Future: Directional, suction, vortex forces
- **Distance Falloff**: Configurable influence radius and strength

### 4. Visual Effects
- **Particle Trails**: Post-processing effect with fade
- **Bloom/Glow**: Individual particle glow + trail glow
- **Theme Support**: Dark/light mode compatibility

### 5. Control Interface
- **Real-time Sliders**: All physics parameters
- **Numerical Inputs**: Precise value entry
- **Force Type Selector**: Dropdown for mouse interaction modes
- **Theme Toggle**: Dark/light mode switcher
- **Export Function**: Save current settings to JSON config

## Technical Architecture

### Component Structure
```
src/
├── components/
│   ├── ParticleSystem/
│   │   ├── WebGLRenderer.js
│   │   ├── ParticleManager.js
│   │   ├── Particle.js
│   │   └── PerlinNoise.js
│   ├── UI/
│   │   ├── ControlPanel.jsx
│   │   ├── ControlHeader.jsx
│   │   ├── ControlSection.jsx
│   │   ├── ConfigManagement.jsx
│   │   ├── GradientEditor.jsx
│   │   └── OpacityGradientEditor.jsx
│   └── Config/
│       ├── DefaultSettings.js
│       └── ConfigManager.js
├── utils/
│   ├── gradientUtils.js
│   └── shaderLoader.js
├── shaders/
│   ├── particle.vert
│   └── particle.frag
└── assets/
    └── sparkle.svg
```

### Key Parameters for UI Controls

**Particle Behavior**
- Particle count limit
- Spawn rate (particles/second)
- Particle lifetime (min/max)
- Initial size (min/max)
- Upward drift force strength

**Child Particle Spawning**
- Spawn probability per frame
- Force multiplier (target ± random range)
- Max children per particle

**Perlin Noise**
- Scale (frequency)
- Strength (horizontal/vertical)
- Speed (time evolution)
- Octaves for complexity

**Mouse Interaction**
- Force strength
- Influence radius
- Distance falloff curve
- Click spawn count

**Visual Effects**
- Bloom intensity
- Trail length
- Trail fade rate
- Glow radius

**Theme**
- Dark/light mode toggle
- Background color
- UI panel opacity

### Export Configuration
JSON format with nested structure:
```json
{
  "version": "1.0",
  "timestamp": "2025-08-04T...",
  "particles": { ... },
  "physics": { ... },
  "visual": { ... },
  "interaction": { ... }
}
```

## Development Phases

**Phase 1**: Core particle system + basic physics
**Phase 2**: Perlin noise integration + child spawning
**Phase 3**: Mouse interactions + force system
**Phase 4**: Post-processing effects + trails
**Phase 5**: UI controls + theme system
**Phase 6**: Config export + React integration prep

## Success Criteria
- Smooth 60fps performance with 1000+ particles
- Intuitive real-time parameter tweaking
- Seamless theme switching
- Clean component architecture for React integration
- Exportable configurations for production use

## Technical Requirements
- Raw WebGL for particle rendering
- React for UI components and state management
- Modular architecture for easy integration
- GitHub Pages deployment capability
- Dark/light theme support
- JSON-based configuration export

## Notes
- Built for prototyping with easy transition to production
- Extensible force system for future enhancements
- Component-based architecture for maintainability
- Performance-focused with configurable quality settings
