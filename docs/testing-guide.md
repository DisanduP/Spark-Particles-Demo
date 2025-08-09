# Testing Guide

## Quick Test Steps

### 1. Desktop Testing
1. Open the particle system in a desktop browser: http://localhost:5179/spark-particles/
2. Open the control panel (gear icon on the right)
3. Go to "Particle Behavior" section
4. You should see:
   - "Spawn Rate" slider
   - Active spawn rate display

### 2. Device Testing
1. Open on a mobile device or use browser dev tools to emulate mobile
2. Test on different devices to check performance
3. Adjust spawn rate if needed for optimal performance
4. Test touch interactions work properly on touch devices

### 3. Browser DevTools Testing
1. Open Chrome/Firefox DevTools
2. Use device emulation (mobile/tablet)
3. Reload the page
4. Check that the device detection changes appropriately
5. Verify spawn rate switches between desktop/mobile values

## What to Look For

### ✅ Working Correctly:
- Smooth particle performance on all devices
- Touch interactions work on touch devices
- Settings persist properly
- UI is responsive

### ❌ Issues to Watch For:
- Performance issues on low-end devices
- UI elements not responding to touch
- Settings not saving properly
- Settings not saving properly

## Performance Comparison

### Expected Behavior:
- **Desktop (23/s)**: Smooth, responsive, more particles
- **Mobile (15/s)**: Optimized performance, fewer particles, still visually appealing
- **Touch interactions**: Responsive on touch devices
- **Multi-touch**: Works properly with multiple fingers

### If you see performance issues:
1. Lower the spawn rate further (try 10-12/s)
2. Check other settings like max particles
3. Consider adjusting visual effects for lower-end devices

## Customization Tips

### For Better Performance on Low-End Devices:
```javascript
particles: {
  spawnRate: 8,   // Very conservative for low-end devices
}
```

### For High-End Devices:
```javascript
particles: {
  spawnRate: 30,  // High-end devices
}
```

### For Testing Different Scenarios:
1. Try very low spawn rates (5-8/s) for older devices
2. Test with high particle counts to see performance impact
3. Verify the feature works with imported/exported settings

## Browser Compatibility

### Tested Browsers:
- ✅ Chrome (desktop & mobile)
- ✅ Safari (desktop & mobile)
- ✅ Firefox (desktop & mobile)
- ✅ Edge (desktop)

### Expected Touch Devices:
- ✅ iPhone (Safari)
- ✅ Android (Chrome)
- ✅ iPad (Safari)
- ✅ Android tablets (Chrome)

## Troubleshooting
### If spawn rates seem too high/low:
1. Check that spawnRate setting is appropriate for the device
2. Verify the ParticleManager is using the correct settings
3. Look for console warnings about missing settings

### If touch isn't working:
1. Verify touch events are properly handled
2. Check CSS `touch-action` properties
3. Test with different touch gestures
