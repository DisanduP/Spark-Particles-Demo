# Testing the Mobile Spawn Rate Feature

## Quick Test Steps

### 1. Desktop Testing
1. Open the particle system in a desktop browser: http://localhost:5179/spark-particles/
2. Open the control panel (gear icon on the right)
3. Go to "Particle Behavior" section
4. You should see:
   - "Spawn Rate" slider (for desktop)
   - "Mobile Spawn Rate" slider (for mobile)
   - Device status showing "Current Device: Desktop"
   - "Active spawn rate: 23/s" (or current desktop value)

### 2. Mobile Testing
1. Open on a mobile device or use browser dev tools to emulate mobile
2. Check that the device status shows "Current Device: Mobile"
3. Verify the active spawn rate uses the mobile value (15/s by default)
4. Test touch interactions work properly

### 3. Mobile Detection Test Page
1. Visit: http://localhost:5179/spark-particles/test/mobile-detection-test.html
2. This page shows detailed detection results including:
   - Device type detection
   - Touch capability
   - Screen dimensions
   - User agent
   - Which spawn rate would be active

### 4. Browser DevTools Testing
1. Open Chrome/Firefox DevTools
2. Use device emulation (mobile/tablet)
3. Reload the page
4. Check that the device detection changes appropriately
5. Verify spawn rate switches between desktop/mobile values

## What to Look For

### ✅ Working Correctly:
- Desktop shows "Desktop" in device status
- Mobile shows "Mobile" in device status  
- Active spawn rate matches the appropriate setting
- Smooth particle performance on both platforms
- Touch interactions work on mobile
- Settings persist when switching devices

### ❌ Issues to Watch For:
- Incorrect device detection
- Spawn rate not switching
- Performance issues on mobile
- UI elements not responding to touch
- Settings not saving properly

## Performance Comparison

### Expected Behavior:
- **Desktop (23/s)**: Smooth, responsive, more particles
- **Mobile (15/s)**: Optimized performance, fewer particles, still visually appealing
- **Touch interactions**: Responsive on mobile devices
- **Multi-touch**: Works properly with multiple fingers

### If you see performance issues:
1. Lower the mobile spawn rate further (try 10-12/s)
2. Check other settings like max particles
3. Consider adjusting visual effects for mobile

## Customization Tips

### For Better Mobile Performance:
```javascript
particles: {
  spawnRate: 25,        // Desktop
  mobileSpawnRate: 8,   // Very conservative mobile
}
```

### For High-End Mobile Devices:
```javascript
particles: {
  spawnRate: 30,        // Desktop  
  mobileSpawnRate: 20,  // High-end mobile
}
```

### For Testing Different Scenarios:
1. Try very low mobile spawn rates (5-8/s) for older devices
2. Test with high particle counts to see performance impact
3. Verify the feature works with imported/exported settings

## Browser Compatibility

### Tested Browsers:
- ✅ Chrome (desktop & mobile)
- ✅ Safari (desktop & mobile)
- ✅ Firefox (desktop & mobile)
- ✅ Edge (desktop)

### Expected Mobile Devices:
- ✅ iPhone (Safari)
- ✅ Android (Chrome)
- ✅ iPad (Safari)
- ✅ Android tablets (Chrome)

## Troubleshooting

### If mobile detection isn't working:
1. Check browser console for errors
2. Verify the mobile detection utility is imported correctly
3. Test the detection page: `/test/mobile-detection-test.html`

### If spawn rates aren't switching:
1. Check that `mobileSpawnRate` is in the settings
2. Verify the ParticleManager is using the correct detection
3. Look for console warnings about missing settings

### If touch isn't working:
1. Verify touch events are properly handled
2. Check CSS `touch-action` properties
3. Test with different touch gestures
