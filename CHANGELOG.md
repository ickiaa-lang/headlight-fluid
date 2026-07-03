# Changelog

## Unreleased

### Fixed
- **Minimap border showing when minimap is off** — `#minimap` now defaults to
  `display: none` in `www/style.css`. Previously the canvas (and its cyan
  border) was visible on load even though `minimapEnabled` starts `false`,
  because nothing synced the element's display state until the toggle button
  was clicked once.
- **Repo bloat** — removed ~35 loose duplicate/stale files that had been
  flattened into the zip root (old icon copies split across density folders,
  a stale pre-mobile-fixes `style.css`, stray build artifacts). The real
  project now lives cleanly under `HLF-Escape-Pod-Android-Capacitor/` with no
  redundant top-level copies.

### Changed
- **Full-screen over the status bar** — `MainActivity.java` now calls
  `WindowCompat.setDecorFitsSystemWindows(getWindow(), false)` and makes the
  status/navigation bars transparent, so the game draws edge-to-edge under
  the device's time/date bar instead of being letterboxed below it. The HUD
  (`#hud`) and region coordinate readout (`#region-coords`) were nudged down
  using `env(safe-area-inset-top)` so their text stays clear of the
  status-bar icons while the canvas itself still extends fully behind it.
  Requires a native rebuild (`npm run build:apk` / Android Studio) to take
  effect — it has no effect when just loading `www/` in a desktop/mobile
  browser.
- **Touch joysticks moved to the top of the screen** — in
  `www/touch-controls.js`, `#tc-joy-move` (movement/orientation) and
  `#tc-joy-pitch` (thrust) now anchor to `top` instead of `bottom`, sitting
  just below the existing top action-button row. `FIRE` and `BOOST` remain
  bottom-anchored (not requested to move).

### Verified
- Confirmed the current `ic_launcher_foreground` / `ic_launcher_background`
  assets are already correctly implemented across all mipmap densities
  (mdpi–xxxhdpi) plus the web `icon-192` / `icon-512` — no change needed.
