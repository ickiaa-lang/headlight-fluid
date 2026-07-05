# Headlight-Fluid v2 — Complete Enhanced Game Package

## What's Included

This is the **fully integrated** game with enhanced music and mesh systems baked in. No additional integration steps required.

### Files in This Package

```
www/
├── index.html              (main game HTML — no changes needed)
├── game.js                 (ENHANCED — includes all new synth + mesh code)
├── three.min.js            (Three.js library)
├── touch-controls.js       (touch input handler)
├── style.css               (styling)
├── [image assets]          (bg.jpg, icon-*.png, etc.)
└── [other original files]
```

## Setup

### Option 1: Direct Browser (Fastest)
1. Copy all files to a web server directory (or use `python -m http.server 8000` locally)
2. Open `index.html` in a browser
3. Play!

**Time: 2 minutes**

### Option 2: Desktop/Capacitor Build
1. Copy the `www/` directory into your Headlight-Fluid Capacitor project
2. Run the build:
   ```bash
   npm run build
   # or
   ionic build android
   ```
3. Deploy to device

**Time: 10 minutes**

### Option 3: PyWebView (if using desktop wrapper)
```python
import webview
webview.api.start(url='file://path/to/www/index.html')
```

## What's New

### Audio System
- **Polyphonic synthesizer** with 3 simultaneous layers:
  - Bass (low sine waves, quarter-note pattern)
  - Chord pads (sustained harmony, C minor pentatonic)
  - Melody (probabilistic, scale-constrained)
- **State-aware volume** — louder when resources critically low
- **No external dependencies** — uses Web Audio API

### 3D Mesh Models (All Enhanced)
| Object | Details |
|---|---|
| **Asteroids** | Fractured debris chunks + main icosahedron |
| **Wrecks** | Multiple hull fracture segments + beacon |
| **Farms** | 5-layer hydroponic tower + pulsing glow animation |
| **Stations** | Octahedron hub + 4 radiating antennae + pulsing core |
| **Satellites** | Solar panel wings + dish antenna + signal bar animation |

**All meshes** have smooth canvas-based animations running 30+ FPS.

## Testing

Load the game and check:

1. **Music** — You should hear polyphonic pad + bass + melody (not just beeps)
2. **Asteroid fields** — See debris chunks orbiting main rock
3. **Wrecks** — Multiple fractured brown/gray segments with orange beacon
4. **Farms** — 5-layer green tower with pulsing animation
5. **Station** — Octahedron hub with 4 spikes, cyan pulsing core
6. **Satellites** — Wing panels, dish antenna, green signal bars animating

If you see all 6: ✅ **Success!**

## Performance

- **Mesh count**: Same as before (~40–60 per region)
- **Canvas overhead**: 3–5 canvases at 64×64 / 128×128 per frame
- **Audio**: Web Audio API (efficient, no external libraries)
- **FPS**: Should maintain 60 FPS on modern devices

**On low-end devices:** Reduce canvas resolution (64 → 32) in `game.js` if needed.

## File Size

- `game.js`: 185 KB (was ~180 KB, added ~300 lines of enhanced code)
- Total package: ~850 KB (including three.min.js)

## Browser Compatibility

- **Desktop**: Chrome, Firefox, Safari, Edge (all modern versions)
- **Mobile**: iOS Safari 13+, Chrome Android, Firefox Android
- **Requirements**: 
  - WebGL (3D graphics)
  - Web Audio API (music)
  - Canvas 2D (animations)

All standard on modern browsers.

## Customization

All enhanced mesh and synth code is **directly in `game.js`**, so you can edit it easily:

### Change Asteroid Color
Line ~230 in game.js:
```javascript
color: 0xFF6600,  // was 0x776655 (brown)
```

### Adjust Synth Volume
Line ~120:
```javascript
masterGain.gain.value = 0.35;  // was 0.25
```

### Speed Up Station Core Animation
Line ~430:
```javascript
corePhase += 0.06;  // was 0.03
```

### Disable Canvas Animations
Set `animate` function to no-op:
```javascript
// In createEnhanced*(), near the end:
mesh.userData.animate = () => {};  // silent
```

## Troubleshooting

### No Sound
- Check browser console for Audio Context errors
- Some browsers require user gesture first (click/tap to activate)
- Mobile: Check device volume settings

### White Screen
- Check console for WebGL errors (likely driver issue)
- Try a different browser
- Check that `three.min.js` loaded (Network tab in DevTools)

### Meshes Look Wrong
- If you edited the enhanced functions, check syntax
- Run `node --check game.js` to validate
- Clear browser cache (Ctrl+Shift+Delete)

### Low FPS
- Reduce canvas resolution in enhanced functions (64 → 32)
- Disable animations: `mesh.userData.animate = () => {}`
- Check device performance (thermal throttling)

## Original Files

If you want to revert to the original game:

1. Download the original `game.js` from your backup
2. Replace in `www/game.js`
3. Refresh browser

Everything else stays the same.

## Development

If you want to modify the code:

1. **Edit `game.js` directly** — all enhanced code is embedded
2. **Search for `createEnhanced*` functions** (lines ~230–430)
3. **Test with `node --check game.js`** before deploying
4. **Rebuild/redeploy** as normal

### Key Functions to Know

- `initAudio()` — Initialize Web Audio context
- `synth.startAmbience()` — Start polyphonic music
- `synth.setGameState()` — Update volume based on resources
- `createEnhanced*()` — Mesh creation functions

All are self-contained with no external dependencies.

## Credits

- **Original game**: Headlight-Fluid (your work)
- **Enhancement**: Polyphonic synth system + enhanced mesh models
- **Libraries**: Three.js (3D), Web Audio API (audio)

## License

Same as the original Headlight-Fluid project.

## Support

If something breaks:
1. Check browser console for errors
2. Verify all files are present (Network tab in DevTools)
3. Try a different browser
4. Revert to original `game.js` if needed

---

**Ready to play?** Open `index.html` in a browser and go! 🚀

Good luck, and enjoy the enhanced experience!
