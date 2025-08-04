attribute vec2 a_position;
attribute vec2 a_particlePos;
attribute float a_size;
attribute float a_life;
attribute float a_maxLife;

uniform vec2 u_resolution;
uniform mat3 u_transform;

varying float v_life;
varying float v_alpha;
varying vec2 v_uv;

void main() {
  // Calculate lifecycle alpha
  v_life = a_life / a_maxLife;
  v_alpha = smoothstep(0.0, 0.1, v_life) * (1.0 - smoothstep(0.7, 1.0, v_life));
  
  // UV coordinates for the particle quad
  v_uv = a_position * 0.5 + 0.5;
  
  // Scale the particle based on size and lifecycle
  float sizeScale = mix(0.3, 1.0, 1.0 - v_life); // Start smaller, grow, then shrink
  vec2 scaledPos = a_position * a_size * sizeScale;
  
  // Position in world space
  vec2 worldPos = a_particlePos + scaledPos;
  
  // Transform to clip space
  vec3 transformed = u_transform * vec3(worldPos, 1.0);
  vec2 clipSpace = ((transformed.xy / u_resolution) * 2.0 - 1.0) * vec2(1, -1);
  
  gl_Position = vec4(clipSpace, 0.0, 1.0);
}
