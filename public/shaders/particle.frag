precision mediump float;
precision mediump int;

varying float v_life;
varying float v_alpha;
varying vec2 v_uv;
varying vec3 v_color;
varying float v_glowIntensity;
varying float v_bloomIntensity;
varying float v_trailLength;

uniform vec3 u_color;
uniform float u_glowIntensity;
uniform bool u_isDarkMode;
uniform sampler2D u_texture;
uniform bool u_useTexture;
uniform vec3 u_bloomSettings; // [falloffDistance, colorShift, enabled]
uniform vec2 u_trailSettings; // [colorShift, enabled]
uniform int u_renderPass; // 0 = main particles, 1 = bloom pass

float sparkleShape(vec2 uv) {
  vec2 center = uv - 0.5;
  float dist = length(center);
  float angle = atan(center.y, center.x);
  float rays = abs(sin(angle * 2.0)) * 0.3 + 0.7;
  float star = smoothstep(0.4 * rays, 0.2 * rays, dist);
  float glow = exp(-dist * 8.0) * 0.5;
  return max(star, glow);
}

// Cool down color by reducing red/warm tones
vec3 coolColor(vec3 color, float amount) {
  // Reduce red, slightly increase blue for cooler tone
  vec3 cooled = color;
  cooled.r *= (1.0 - amount * 0.8);
  cooled.g *= (1.0 - amount * 0.3);
  cooled.b *= (1.0 + amount * 0.2);
  return cooled;
}

// Create bloom effect with smooth falloff for larger quads
float bloomEffectLarge(vec2 uv, float falloffDistance, float intensity) {
  vec2 center = uv - 0.5;
  float dist = length(center);
  
  // Smooth falloff that extends beyond the quad bounds
  // Use a more gradual exponential decay for smoother edges
  float bloom = exp(-dist * falloffDistance * 0.5) * intensity;
  
  // Add a secondary, wider glow for ultra-smooth outer falloff
  float outerGlow = exp(-dist * falloffDistance * 0.15) * intensity * 0.3;
  
  return bloom + outerGlow;
}

// Create bloom effect with falloff
float bloomEffect(vec2 uv, float falloffDistance, float intensity) {
  vec2 center = uv - 0.5;
  float dist = length(center);
  float bloom = exp(-dist * falloffDistance) * intensity;
  return bloom;
}

void main() {
  // Bloom pass - render only the bloom effect on larger quads
  if (u_renderPass == 1) {
    if (u_bloomSettings.z > 0.5 && v_bloomIntensity > 0.0) { // enabled and has bloom
      float bloom = bloomEffectLarge(v_uv, u_bloomSettings.x, v_bloomIntensity);
      vec3 bloomColor = coolColor(v_color, u_bloomSettings.y);
      
      // Use additive blending for bloom effect
      gl_FragColor = vec4(bloomColor * bloom * 0.4, bloom * 0.2);
    } else {
      discard; // Don't render particles without bloom in bloom pass
    }
    return;
  }
  
  // Main particle pass
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
  
  // Apply trail effect if enabled (this would be better handled in a separate render pass)
  if (u_trailSettings.y > 0.5 && v_trailLength > 0.0) { // enabled and has trail
    // Trail effect is mainly handled by rendering multiple particles at trail positions
    // Here we just apply the color cooling for trail segments
    vec3 trailColor = coolColor(v_color, u_trailSettings.x);
    color = mix(color, trailColor, v_trailLength * 0.1);
  }
  
  gl_FragColor = vec4(color, finalAlpha);
}
