precision mediump float;

varying float v_life;
varying float v_alpha;
varying vec2 v_uv;

uniform vec3 u_color;
uniform float u_glowIntensity;
uniform bool u_isDarkMode;

// Simple sparkle shape function
float sparkleShape(vec2 uv) {
  vec2 center = uv - 0.5;
  float dist = length(center);
  
  // Main star shape
  float angle = atan(center.y, center.x);
  float rays = abs(sin(angle * 4.0)) * 0.3 + 0.7;
  float star = smoothstep(0.4 * rays, 0.2 * rays, dist);
  
  // Central glow
  float glow = exp(-dist * 8.0) * 0.5;
  
  return max(star, glow);
}

void main() {
  float shape = sparkleShape(v_uv);
  
  // Color based on lifecycle (ember effect)
  vec3 hotColor = vec3(1.0, 0.8, 0.2);   // Yellow-orange
  vec3 warmColor = vec3(1.0, 0.4, 0.1);  // Orange-red
  vec3 coolColor = vec3(0.8, 0.2, 0.0);  // Dark red
  
  vec3 color;
  if (v_life > 0.7) {
    color = mix(coolColor, warmColor, (v_life - 0.7) / 0.3);
  } else {
    color = mix(warmColor, hotColor, v_life / 0.7);
  }
  
  // Apply theme-based adjustments
  if (!u_isDarkMode) {
    color = color * 0.8 + vec3(0.2); // Lighter for light mode
  }
  
  // Combine with user color tint
  color = mix(color, u_color, 0.3);
  
  // Apply glow effect
  float finalAlpha = shape * v_alpha;
  color += vec3(u_glowIntensity * 0.3) * shape;
  
  gl_FragColor = vec4(color, finalAlpha);
}
