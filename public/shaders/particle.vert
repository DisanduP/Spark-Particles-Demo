attribute vec2 a_position;
attribute vec2 a_particlePos;
attribute float a_size;
attribute float a_life;
attribute float a_maxLife;
attribute vec3 a_color;
attribute float a_rotation;

uniform vec2 u_resolution;
uniform mat3 u_transform;

// For non-instanced fallback
uniform vec2 u_particlePos;
uniform float u_particleSize;
uniform float u_particleLife;
uniform float u_particleMaxLife;
uniform vec3 u_particleColor;
uniform float u_particleRotation;

varying float v_life;
varying float v_alpha;
varying vec2 v_uv;
varying vec3 v_color;

void main() {
  // Use instanced attributes if available, otherwise use uniforms
  vec2 particlePos = a_particlePos != vec2(0.0) ? a_particlePos : u_particlePos;
  float size = a_size != 0.0 ? a_size : u_particleSize;
  float life = a_life != 0.0 ? a_life : u_particleLife;
  float maxLife = a_maxLife != 0.0 ? a_maxLife : u_particleMaxLife;
  vec3 color = a_color != vec3(0.0) ? a_color : u_particleColor;
  float rotation = a_rotation != 0.0 ? a_rotation : u_particleRotation;
  
  // Pass color to fragment shader
  v_color = color;
  
  // Calculate lifecycle alpha
  v_life = life / maxLife;
  v_alpha = smoothstep(0.0, 0.1, v_life) * (1.0 - smoothstep(0.7, 1.0, v_life));
  
  // UV coordinates for the particle quad
  v_uv = a_position * 0.5 + 0.5;
  
  // Apply rotation to the vertex position
  float cos_r = cos(rotation);
  float sin_r = sin(rotation);
  vec2 rotatedPos = vec2(
    a_position.x * cos_r - a_position.y * sin_r,
    a_position.x * sin_r + a_position.y * cos_r
  );
  
  // Scale the particle based on size and lifecycle
  float sizeScale = mix(0.3, 1.0, 1.0 - v_life);
  vec2 scaledPos = rotatedPos * size * sizeScale;
  
  // Position in world space
  vec2 worldPos = particlePos + scaledPos;
  
  // Transform to clip space
  vec3 transformed = u_transform * vec3(worldPos, 1.0);
  vec2 clipSpace = ((transformed.xy / u_resolution) * 2.0 - 1.0) * vec2(1, -1);
  
  gl_Position = vec4(clipSpace, 0.0, 1.0);
}
