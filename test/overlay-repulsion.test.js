/**
 * Test for Overlay Repulsion Feature
 * This test validates that the overlay repulsion feature works correctly
 */

import { ParticleManager } from '../src/components/ParticleSystem/ParticleManager.js';
import { DEFAULT_SETTINGS } from '../src/components/Config/DefaultSettings.js';

describe('Overlay Repulsion', () => {
  let particleManager;
  let settings;

  beforeEach(() => {
    settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS)); // Deep clone
    particleManager = new ParticleManager(settings);
    particleManager.setCanvasSize(800, 600);
  });

  test('should have overlay repulsion settings in default config', () => {
    expect(settings.overlayRepulsion).toBeDefined();
    expect(settings.overlayRepulsion.enabled).toBe(true);
    expect(settings.overlayRepulsion.forceMultiplier).toBe(1.0);
    expect(settings.overlayRepulsion.paddingPixels).toBe(20);
    expect(settings.overlayRepulsion.falloffCurve).toBe(2);
  });

  test('should apply repulsion force to particles in overlay area', () => {
    // Add a particle in the center of the overlay area
    const centerX = 400;
    const centerY = 300;
    
    // Create a particle at the center
    particleManager.particles.push({
      x: centerX,
      y: centerY,
      vx: 0,
      vy: 0,
      applyForce: jest.fn()
    });

    // Define overlay bounds
    const overlayBounds = {
      left: centerX - 100,
      right: centerX + 100,
      top: centerY - 40,
      bottom: centerY + 40
    };

    // Apply overlay repulsion
    particleManager.applyOverlayRepulsion(overlayBounds, settings.overlayRepulsion);

    // Check that applyForce was called on the particle
    expect(particleManager.particles[0].applyForce).toHaveBeenCalled();
    
    // Get the force arguments
    const forceArgs = particleManager.particles[0].applyForce.mock.calls[0];
    
    // Force should be zero at the exact center (no preferred direction)
    expect(Math.abs(forceArgs[0])).toBeLessThan(0.001); // fx should be near 0
    expect(Math.abs(forceArgs[1])).toBeLessThan(0.001); // fy should be near 0
  });

  test('should not apply force to particles outside overlay area', () => {
    // Add a particle outside the overlay area
    particleManager.particles.push({
      x: 50,  // Far left
      y: 50,  // Far top
      vx: 0,
      vy: 0,
      applyForce: jest.fn()
    });

    // Define overlay bounds (center area)
    const overlayBounds = {
      left: 300,
      right: 500,
      top: 250,
      bottom: 350
    };

    // Apply overlay repulsion
    particleManager.applyOverlayRepulsion(overlayBounds, settings.overlayRepulsion);

    // Check that applyForce was NOT called on the particle
    expect(particleManager.particles[0].applyForce).not.toHaveBeenCalled();
  });

  test('should not apply force when overlay repulsion is disabled', () => {
    // Disable overlay repulsion
    settings.overlayRepulsion.enabled = false;

    // Add a particle in the overlay area
    particleManager.particles.push({
      x: 400,
      y: 300,
      vx: 0,
      vy: 0,
      applyForce: jest.fn()
    });

    // Define overlay bounds
    const overlayBounds = {
      left: 300,
      right: 500,
      top: 250,
      bottom: 350
    };

    // Apply overlay repulsion
    particleManager.applyOverlayRepulsion(overlayBounds, settings.overlayRepulsion);

    // Check that applyForce was NOT called
    expect(particleManager.particles[0].applyForce).not.toHaveBeenCalled();
  });

  test('should apply stronger force with higher force multiplier', () => {
    // Create two identical particles
    const particle1 = {
      x: 350,  // Slightly off-center
      y: 300,
      vx: 0,
      vy: 0,
      applyForce: jest.fn()
    };

    const particle2 = {
      x: 350,  // Same position
      y: 300,
      vx: 0,
      vy: 0,
      applyForce: jest.fn()
    };

    const overlayBounds = {
      left: 300,
      right: 500,
      top: 250,
      bottom: 350
    };

    // Test with normal force multiplier
    particleManager.particles = [particle1];
    particleManager.applyOverlayRepulsion(overlayBounds, settings.overlayRepulsion);
    const normalForce = particle1.applyForce.mock.calls[0];

    // Test with higher force multiplier
    settings.overlayRepulsion.forceMultiplier = 2.0;
    particleManager.particles = [particle2];
    particleManager.applyOverlayRepulsion(overlayBounds, settings.overlayRepulsion);
    const strongerForce = particle2.applyForce.mock.calls[0];

    // Stronger force should be approximately double
    expect(Math.abs(strongerForce[0])).toBeGreaterThan(Math.abs(normalForce[0]));
    expect(Math.abs(strongerForce[1])).toBeGreaterThan(Math.abs(normalForce[1]));
  });
});
