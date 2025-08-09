/**
 * Utility functions for detecting mobile devices and touch capabilities
 */

/**
 * Detects if the current device is mobile based on multiple factors
 * @returns {boolean} True if device is detected as mobile
 */
export const isMobileDevice = () => {
  // Check user agent for mobile indicators
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
  
  // Check screen size (mobile typically < 768px width)
  const screenWidth = window.screen.width;
  const isSmallScreen = screenWidth < 768;
  
  // Check touch capability
  const hasTouchCapability = 'ontouchstart' in window || 
                           navigator.maxTouchPoints > 0 || 
                           navigator.msMaxTouchPoints > 0;
  
  // Check if device has mobile-like characteristics
  const isMobileUA = mobileRegex.test(userAgent);
  
  // Consider it mobile if:
  // 1. User agent indicates mobile, OR
  // 2. Small screen AND touch capability
  return isMobileUA || (isSmallScreen && hasTouchCapability);
};

/**
 * Detects if the device has touch capability
 * @returns {boolean} True if device supports touch
 */
export const isTouchDevice = () => {
  return 'ontouchstart' in window || 
         navigator.maxTouchPoints > 0 || 
         navigator.msMaxTouchPoints > 0;
};

/**
 * Gets the current device type
 * @returns {string} 'mobile', 'tablet', or 'desktop'
 */
export const getDeviceType = () => {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const screenWidth = window.screen.width;
  
  // Check for specific mobile patterns
  if (/android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
    return 'mobile';
  }
  
  // Check for tablet patterns (iPad, Android tablets)
  if (/ipad|android/i.test(userAgent) && screenWidth >= 768) {
    return 'tablet';
  }
  
  // Check screen size for responsive detection
  if (screenWidth < 768) {
    return 'mobile';
  } else if (screenWidth < 1024) {
    return 'tablet';
  }
  
  return 'desktop';
};

/**
 * Gets viewport information
 * @returns {object} Object with width, height, and orientation
 */
export const getViewportInfo = () => {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
  };
};
