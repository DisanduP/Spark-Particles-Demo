attribute vec2 a_position;
attribute vec2 a_particlePos;
attribute float a_size;
attribute float a_life;
attribute float a_maxLife;
attribute vec3 a_color;
attribute float a_rotation;
attribute float a_opacity;
attribute float a_glowIntensity;
attribute float a_bloomIntensity;
attribute float a_trailLength;

uniform vec2 u_resolution;
uniform mat3 u_transform;

// For non-instanced fallback
uniform vec2 u_particlePos;
uniform float u_particleSize;
uniform float u_particleLife;
uniform float u_particleMaxLife;
uniform vec3 u_particleColor;
uniform float u_particleRotation;
uniform float u_particleOpacity;
uniform float u_particleGlowIntensity;
uniform float u_particleBloomIntensity;
uniform float u_particleTrailLength;

varying float v_life;
varying float v_alpha;
varying vec2 v_uv;
varying vec3 v_color;
varying float v_glowIntensity;
varying float v_bloomIntensity;
varying float v_trailLength;

void main() {
  // Use instanced attributes if available, otherwise use uniforms
  vec2 particlePos = a_particlePos != vec2(0.0) ? a_particlePos : u_particlePos;
  float size = a_size != 0.0 ? a_size : u_particleSize;
  float life = a_life != 0.0 ? a_life : u_particleLife;
  float maxLife = a_maxLife != 0.0 ? a_maxLife : u_particleMaxLife;
  vec3 color = a_color != vec3(0.0) ? a_color : u_particleColor;
  float rotation = a_rotation != 0.0 ? a_rotation : u_particleRotation;
  float opacity = a_opacity != 0.0 ? a_opacity : u_particleOpacity;
  // For glow intensity, always use attribute if instanced rendering, otherwise use uniform
  float glowIntensity = a_glowIntensity >= 0.0 ? a_glowIntensity : u_particleGlowIntensity;
  float bloomIntensity = a_bloomIntensity >= 0.0 ? a_bloomIntensity : u_particleBloomIntensity;
  float trailLength = a_trailLength >= 0.0 ? a_trailLength : u_particleTrailLength;
  
  // Pass color and effect intensities to fragment shader
  v_color = color;
  v_glowIntensity = glowIntensity;
  v_bloomIntensity = bloomIntensity;
  v_trailLength = trailLength;
  
  // Use the opacity from gradient instead of calculating based on lifecycle
  v_life = life / maxLife;
  v_alpha = opacity;
  
  // UV coordinates for the particle quad
  v_uv = a_position * 0.5 + 0.5;
  
  // Apply rotation to the vertex position
  float cos_r = cos(rotation);
  float sin_r = sin(rotation);
  vec2 rotatedPos = vec2(
    a_position.x * cos_r - a_position.y * sin_r,
    a_position.x * sin_r + a_position.y * cos_r
  );
  
  // Use constant size (no lifecycle scaling)
  float sizeScale = 1.0;
  
  // Convert particle position to clip space coordinates (-1 to 1)
  vec2 clipPos = (particlePos / u_resolution) * 2.0 - 1.0;
  clipPos.y = -clipPos.y; // Flip Y to match screen coordinates
  
  // Calculate particle offset in pixels, then convert to clip space
  vec2 particleOffset = rotatedPos * size * sizeScale;
  
  // Convert pixel offset to clip space, maintaining aspect ratio
  vec2 clipOffset;
  clipOffset.x = (particleOffset.x / u_resolution.x) * 2.0;
  clipOffset.y = (particleOffset.y / u_resolution.y) * 2.0;
  
  gl_Position = vec4(clipPos + clipOffset, 0.0, 1.0);
}
