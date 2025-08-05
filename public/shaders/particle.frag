precision mediump float;

varying float v_life;
varying float v_alpha;
varying vec2 v_uv;

uniform vec3 u_color;
uniform float u_glowIntensity;
uniform bool u_isDarkMode;
uniform sampler2D u_texture;
uniform bool u_useTexture;

float sparkleShape(vec2 uv) {
  vec2 center = uv - 0.5;
  float dist = length(center);
  float angle = atan(center.y, center.x);
  float rays = abs(sin(angle * 2.0)) * 0.3 + 0.7;
  float star = smoothstep(0.4 * rays, 0.2 * rays, dist);
  float glow = exp(-dist * 8.0) * 0.5;
  return max(star, glow);
}

void main() {
  float shape;
  
  if (u_useTexture) {
    vec4 texColor = texture2D(u_texture, v_uv);
    // Use the alpha channel directly for the shape
    shape = texColor.a;
  } else {
    shape = sparkleShape(v_uv);
  }
  
  vec3 hotColor = vec3(1.0, 0.8, 0.2);
  vec3 warmColor = vec3(1.0, 0.4, 0.1);
  vec3 coolColor = vec3(0.8, 0.2, 0.0);
  
  vec3 color;
  if (v_life > 0.7) {
    color = mix(coolColor, warmColor, (v_life - 0.7) / 0.3);
  } else {
    color = mix(warmColor, hotColor, v_life / 0.7);
  }
  
  if (!u_isDarkMode) {
    color = color * 0.8 + vec3(0.2);
  }
  
  color = mix(color, u_color, 0.3);
  
  float finalAlpha = shape * v_alpha;
  color += vec3(u_glowIntensity * 0.3) * shape;
  
  gl_FragColor = vec4(color, finalAlpha);
}
