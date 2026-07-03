# HLF Escape Pod — Android app (Capacitor)

This turns the existing Three.js web game into a real Android app using
[Capacitor](https://capacitorjs.com/), which wraps the web build in a native
WebView shell you can build into an installable `.apk`.

**Everything that can be done without Android Studio/SDK is already done:**
`npm install`, `npx cap add android`, manifest tweaks (landscape lock, app
name/icon wiring), a service worker for offline play, and touch controls
have all been generated for you. The one thing that genuinely requires your
own machine is the actual Android build (Gradle needs the Android SDK, which
can't be fetched in a sandboxed environment) — that part takes about 10
minutes with Android Studio installed.

## What's new vs the desktop build

- **`www/touch-controls.js`** — on-screen virtual joysticks (movement +
  pitch) and buttons (fire, boost, stop, warp, flashlight, scan, dock,
  inventory, menu). Only activates on touch devices; keyboard/mouse/gamepad
  play on desktop is untouched. It talks to the exact same `keys` state and
  dispatches real `keydown` events for the menu/dock/scan/etc actions, so no
  game logic was duplicated.
- **`www/sw.js` + `manifest.json` + icons** — makes the web build installable
  as a PWA too, and gives the Android app a proper icon/splash.
- **`android/`** — the generated native project (Gradle/Java/Kotlin
  scaffolding Capacitor needs to produce an APK).
- The old "tap anywhere fires laser / opens station" touch hack in `game.js`
  was removed since it conflicted with the new joystick controls.

## One-time setup on your machine

1. Install **Android Studio** (includes the Android SDK, Gradle will use it
   automatically): https://developer.android.com/studio
2. Install **Node.js** (18+) if you don't have it already.
3. Unzip this project, then in the project root:
   ```bash
   npm install
   ```

## Build the APK

**Easiest — via Android Studio:**
```bash
npx cap open android
```
This opens the `android/` folder in Android Studio. Let it finish Gradle
sync (first time will download the SDK/Gradle distribution — this is the
step that needed your own network access). Then:
`Build → Build Bundle(s) / APK(s) → Build APK(s)`.
The APK lands in `android/app/build/outputs/apk/debug/app-debug.apk` —
copy it to your phone and install it (you'll need to allow "install from
unknown sources" once).

**Or via command line**, once Android Studio/SDK is installed:
```bash
cd android
./gradlew assembleDebug
```
Same output path as above.

## If you change the game

Edit files in `www/` (or edit in the original `HLF-ESCAPE-POD-V2.5/` folder
and copy over), then re-sync before rebuilding:
```bash
npx cap sync android
```

## Icons

`icon-192.png` / `icon-512.png` in `www/` are placeholder art (cyan escape
pod, on-theme but simple). Capacitor's Android icons
(`android/app/src/main/res/mipmap-*`) are currently the default Capacitor
logo — swap those out, or use `npx @capacitor/assets generate` with a source
image once you have real artwork.

## Signing for a release build (Play Store or sideloading a "real" build)

The debug APK above is fine for sideloading on your own devices. For a
signed release build, Android Studio's `Build → Generate Signed Bundle / APK`
wizard will walk you through creating a keystore — keep that keystore file
safe, you need the same one for every future update.

## Known gaps / things worth deciding later

- Touch controls are new and untested on a real device — layout may need
  tweaking once you see it on your actual phone/tablet (button sizes,
  joystick placement for your hand size, etc).
- The CLI dev terminal (`~` key) has no touch equivalent — not exposed as a
  touch button, since it's a debug tool.
- Save data uses `localStorage` inside the WebView (same as the desktop
  build's fallback path) — this persists across app restarts but will be
  cleared if the user clears app storage/data.
