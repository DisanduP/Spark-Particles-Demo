precision mediump float;

varying float v_life;
varying float v_alpha;
varying vec2 v_uv;
varying vec3 v_color;
varying float v_glowIntensity;

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
    // Use luminance of RGB as alpha for white shapes on transparent background
    float luminance = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
    float rawShape = luminance * texColor.a;
    
    // Add subtle edge smoothing for ultra-smooth antialiasing
    shape = smoothstep(0.1, 0.9, rawShape);
  } else {
    shape = sparkleShape(v_uv);
  }
  
  // Use the per-particle color directly from gradient
  vec3 color = v_color;
  
  // Apply theme-based color adjustment only for light mode
  if (!u_isDarkMode) {
    // Slightly darken colors in light mode for better visibility
    color = color * 0.9;
  }
  
  float finalAlpha = shape * v_alpha;
  
  // Use per-particle glow intensity combined with global glow intensity
  float totalGlowIntensity = u_glowIntensity + v_glowIntensity;
  color += vec3(totalGlowIntensity * 0.3) * shape;
  
  gl_FragColor = vec4(color, finalAlpha);
}
