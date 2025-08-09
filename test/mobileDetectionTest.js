/**
 * Test file for mobile detection functionality
 * Run this in browser console to test mobile detection
 */

import { isMobileDevice, isTouchDevice, getDeviceType, getViewportInfo } from '../src/utils/mobileDetection.js';

console.log('=== Mobile Detection Test ===');
console.log('isMobileDevice():', isMobileDevice());
console.log('isTouchDevice():', isTouchDevice());
console.log('getDeviceType():', getDeviceType());
console.log('getViewportInfo():', getViewportInfo());
console.log('User Agent:', navigator.userAgent);
console.log('Screen dimensions:', window.screen.width + 'x' + window.screen.height);
console.log('Viewport dimensions:', window.innerWidth + 'x' + window.innerHeight);
console.log('Touch points supported:', navigator.maxTouchPoints);

// Test different scenarios
console.log('\n=== Testing Scenarios ===');

// Simulate different user agents
const testUserAgents = [
  'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
  'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
  'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
];

testUserAgents.forEach((ua, index) => {
  // Note: This is just for demonstration - actual user agent can't be changed
  console.log(`Test ${index + 1}: ${ua.includes('iPhone') ? 'iPhone' : ua.includes('iPad') ? 'iPad' : ua.includes('Android') ? 'Android' : 'Desktop'}`);
});

export { isMobileDevice, isTouchDevice, getDeviceType, getViewportInfo };
