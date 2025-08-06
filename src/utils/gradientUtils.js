/**
 * Utility functions for working with color gradients
 */

/**
 * Convert hex color to RGB object
 * @param {string} hex - Hex color string (e.g., '#ff0000')
 * @returns {object} RGB object with r, g, b properties (0-1 range)
 */
export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : { r: 1, g: 1, b: 1 };
}

/**
 * Convert RGB object to hex string
 * @param {object} rgb - RGB object with r, g, b properties (0-1 range)
 * @returns {string} Hex color string
 */
export function rgbToHex(rgb) {
  const toHex = (c) => {
    const hex = Math.round(c * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

/**
 * Interpolate between two colors
 * @param {object} color1 - RGB object
 * @param {object} color2 - RGB object  
 * @param {number} t - Interpolation factor (0-1)
 * @returns {object} Interpolated RGB color
 */
export function interpolateColor(color1, color2, t) {
  return {
    r: color1.r + (color2.r - color1.r) * t,
    g: color1.g + (color2.g - color1.g) * t,
    b: color1.b + (color2.b - color1.b) * t
  };
}

/**
 * Sample a color from a gradient at a specific position
 * @param {Array} gradient - Array of gradient stops {position, color}
 * @param {number} position - Position along gradient (0-1)
 * @returns {object} RGB color object
 */
export function sampleGradient(gradient, position) {
  // Clamp position to 0-1 range
  position = Math.max(0, Math.min(1, position));
  
  // Sort gradient stops by position (just in case)
  const sortedStops = [...gradient].sort((a, b) => a.position - b.position);
  
  // Handle edge cases
  if (position <= sortedStops[0].position) {
    return hexToRgb(sortedStops[0].color);
  }
  if (position >= sortedStops[sortedStops.length - 1].position) {
    return hexToRgb(sortedStops[sortedStops.length - 1].color);
  }
  
  // Find the two stops we're between
  let leftStop = sortedStops[0];
  let rightStop = sortedStops[1];
  
  for (let i = 0; i < sortedStops.length - 1; i++) {
    if (position >= sortedStops[i].position && position <= sortedStops[i + 1].position) {
      leftStop = sortedStops[i];
      rightStop = sortedStops[i + 1];
      break;
    }
  }
  
  // Calculate interpolation factor
  const range = rightStop.position - leftStop.position;
  const t = range === 0 ? 0 : (position - leftStop.position) / range;
  
  // Interpolate between the two colors
  const leftColor = hexToRgb(leftStop.color);
  const rightColor = hexToRgb(rightStop.color);
  
  return interpolateColor(leftColor, rightColor, t);
}

/**
 * Get a random gradient from the available gradients
 * @param {object} gradients - Gradients object from settings
 * @returns {Array} Random gradient array
 */
export function getRandomGradient(gradients) {
  const gradientKeys = Object.keys(gradients);
  const randomKey = gradientKeys[Math.floor(Math.random() * gradientKeys.length)];
  return gradients[randomKey];
}

/**
 * Sample an opacity value from an opacity gradient at a specific position
 * @param {Array} opacityGradient - Array of opacity stops {position, opacity}
 * @param {number} position - Position along gradient (0-1)
 * @returns {number} Opacity value (0-1)
 */
export function sampleOpacityGradient(opacityGradient, position) {
  // Clamp position to 0-1 range
  position = Math.max(0, Math.min(1, position));
  
  // Sort opacity stops by position (just in case)
  const sortedStops = [...opacityGradient].sort((a, b) => a.position - b.position);
  
  // Handle edge cases
  if (position <= sortedStops[0].position) {
    return sortedStops[0].opacity;
  }
  if (position >= sortedStops[sortedStops.length - 1].position) {
    return sortedStops[sortedStops.length - 1].opacity;
  }
  
  // Find the two stops we're between
  let leftStop = sortedStops[0];
  let rightStop = sortedStops[1];
  
  for (let i = 0; i < sortedStops.length - 1; i++) {
    if (position >= sortedStops[i].position && position <= sortedStops[i + 1].position) {
      leftStop = sortedStops[i];
      rightStop = sortedStops[i + 1];
      break;
    }
  }
  
  // Calculate interpolation factor
  const range = rightStop.position - leftStop.position;
  const t = range === 0 ? 0 : (position - leftStop.position) / range;
  
  // Interpolate between the two opacity values
  return leftStop.opacity + (rightStop.opacity - leftStop.opacity) * t;
}
