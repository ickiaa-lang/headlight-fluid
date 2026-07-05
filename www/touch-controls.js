// ==================== TOUCH CONTROLS (mobile / Android wrap) ====================
// Self-contained: reads/writes the same globals game.js already uses
// (keys, gameActive, isBoosting, player, nearStation), and for discrete
// actions it dispatches synthetic keydown events so the exact existing
// keyboard logic in game.js runs unchanged (menu, dock, scan, warp, etc).
// Only activates on touch-capable devices; keyboard/mouse/gamepad play is
// completely unaffected on desktop.

(function () {
  const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  if (!isTouchDevice) return;

  // Joystick + fire button visibility, toggled from the main menu
  // ("JOYSTICK: ON/OFF" button in game.js). Defaults to visible.
  if (typeof window.joystickControlsVisible === 'undefined') window.joystickControlsVisible = true;

  // ---------- styles ----------
  const style = document.createElement('style');
  style.textContent = `
    #touch-controls {
      position: fixed; inset: 0; z-index: 150;
      pointer-events: none; display: none;
      font-family: monospace;
    }
    #touch-controls.tc-visible { display: block; }
    #touch-controls * { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
    .tc-joy-base {
      position: absolute; border-radius: 50%;
      background: rgba(0, 20, 40, 0.45); border: 2px solid rgba(0,255,255,0.5);
      touch-action: none; pointer-events: auto;
      box-shadow: 0 0 12px rgba(0,255,255,0.15) inset;
    }
    .tc-joy-thumb {
      position: absolute; top: 50%; left: 50%; border-radius: 50%;
      background: rgba(0,255,255,0.35); border: 2px solid #0ff;
      transform: translate(-50%, -50%);
      box-shadow: 0 0 10px rgba(0,255,255,0.5);
      pointer-events: none;
    }
    #tc-joy-move { width: 130px; height: 130px; left: 20px; top: max(50px, calc(env(safe-area-inset-top) + 50px)); }
    #tc-joy-move .tc-joy-thumb { width: 52px; height: 52px; }
    #tc-joy-pitch { width: 100px; height: 100px; right: 20px; top: max(50px, calc(env(safe-area-inset-top) + 50px)); }
    #tc-joy-pitch .tc-joy-thumb { width: 42px; height: 42px; }

    .tc-btn {
      position: absolute; pointer-events: auto; touch-action: none;
      display: flex; align-items: center; justify-content: center;
      font-family: monospace; letter-spacing: 1px; font-weight: bold;
      color: #0ff; background: rgba(0,20,40,0.6); border: 1px solid #0ff;
      box-shadow: 0 0 8px rgba(0,255,255,0.2);
      text-shadow: 0 0 4px rgba(0,255,255,0.6);
    }
    .tc-btn:active, .tc-btn.tc-pressed { background: rgba(0,255,255,0.35); }
    #tc-fire {
      width: 74px; height: 74px; border-radius: 50%;
      right: 20px; top: max(220px, calc(env(safe-area-inset-top) + 220px));
      font-size: 12px; color: #f88; border-color: #f66;
      background: rgba(40,0,0,0.5); text-shadow: 0 0 5px #f44;
    }
    #tc-fire.tc-pressed { background: rgba(255,60,60,0.4); }
    #tc-actions {
      position: absolute; top: max(8px, env(safe-area-inset-top));
      left: 50%; transform: translateX(-50%);
      display: flex; flex-direction: row; gap: 6px; pointer-events: none;
    }
    #tc-actions .tc-btn {
      position: static; pointer-events: auto;
      width: 48px; height: 30px; border-radius: 4px; font-size: 10px;
    }
    #tc-joysticks.tc-joysticks-hidden { display: none; }
  `;
  document.head.appendChild(style);

  // ---------- markup ----------
  const root = document.createElement('div');
  root.id = 'touch-controls';
  root.innerHTML = `
    <div id="tc-joysticks">
      <div id="tc-joy-move" class="tc-joy-base" title="Orientation: Yaw (left/right) & Pitch (up/down)"><div class="tc-joy-thumb"></div></div>
      <div id="tc-joy-pitch" class="tc-joy-base" title="Thrust: Pull back = forward, Push = backward"><div class="tc-joy-thumb"></div></div>
      <div id="tc-fire" class="tc-btn">FIRE</div>
    </div>
    <div id="tc-actions">
      <div class="tc-btn" data-key=" ">STOP</div>
      <div class="tc-btn" data-key="t">WARP</div>
      <div class="tc-btn" data-key="f">LIGHT</div>
      <div class="tc-btn" data-key="g">SCAN</div>
      <div class="tc-btn" data-key="o">DOCK</div>
      <div class="tc-btn" data-key="p">INV</div>
      <div class="tc-btn" data-key="m">MENU</div>
    </div>
  `;
  document.body.appendChild(root);

  // ---------- helpers ----------
  function sendKey(key) {
    // Dispatch a real keydown so game.js's existing handler (menu, dock,
    // scan, warp, flashlight, inventory, stop) runs completely unchanged.
    window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    window.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true, cancelable: true }));
  }

  function clearMovementKeys() {
    ['w', 's', 'a', 'd', 'i', 'k', 'control'].forEach(k => { keys[k] = false; });
  }

  // ---------- joystick factory ----------
  function makeJoystick(baseId, { verticalOnly = false, onVector }) {
    const base = document.getElementById(baseId);
    const thumb = base.querySelector('.tc-joy-thumb');
    const radius = base.offsetWidth / 2 || 65;
    let activePointerId = null;

    function setThumb(dx, dy) {
      thumb.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    }

    function handleMove(clientX, clientY) {
      const rect = base.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = verticalOnly ? 0 : clientX - cx;
      let dy = clientY - cy;
      const maxR = rect.width / 2;
      const dist = Math.hypot(dx, dy);
      if (dist > maxR) {
        const scale = maxR / dist;
        dx *= scale; dy *= scale;
      }
      setThumb(dx, dy);
      onVector(dx / maxR, dy / maxR);
    }

    function reset() {
      setThumb(0, 0);
      onVector(0, 0);
    }

    base.addEventListener('pointerdown', e => {
      activePointerId = e.pointerId;
      base.setPointerCapture(e.pointerId);
      handleMove(e.clientX, e.clientY);
    });
    base.addEventListener('pointermove', e => {
      if (e.pointerId !== activePointerId) return;
      handleMove(e.clientX, e.clientY);
    });
    const end = e => {
      if (e.pointerId !== activePointerId) return;
      activePointerId = null;
      reset();
    };
    base.addEventListener('pointerup', end);
    base.addEventListener('pointercancel', end);
  }

  const DEADZONE = 0.25;

  makeJoystick('tc-joy-move', {
    onVector: (nx, ny) => {
      // Left stick: X = yaw (A/D), Y = pitch (I/K)
      keys['a'] = nx < -DEADZONE;
      keys['d'] = nx > DEADZONE;
      keys['i'] = ny < -DEADZONE;
      keys['k'] = ny > DEADZONE;
    }
  });

  makeJoystick('tc-joy-pitch', {
    verticalOnly: true,
    onVector: (nx, ny) => {
      // Right stick: push forward = forward thrust (away from camera), pull back = backward thrust
      keys['s'] = ny < -DEADZONE;
      keys['w'] = ny > DEADZONE;
    }
  });

  // ---------- fire (held) ----------
  const fireBtn = document.getElementById('tc-fire');
  fireBtn.addEventListener('pointerdown', e => {
    fireBtn.setPointerCapture(e.pointerId);
    fireBtn.classList.add('tc-pressed');
    keys['control'] = true;
  });
  const releaseFire = () => { fireBtn.classList.remove('tc-pressed'); keys['control'] = false; };
  fireBtn.addEventListener('pointerup', releaseFire);
  fireBtn.addEventListener('pointercancel', releaseFire);

  // ---------- discrete action buttons ----------
  document.querySelectorAll('#tc-actions .tc-btn').forEach(btn => {
    btn.addEventListener('pointerdown', () => {
      btn.classList.add('tc-pressed');
      sendKey(btn.dataset.key);
      setTimeout(() => btn.classList.remove('tc-pressed'), 120);
    });
  });

  // ---------- visibility sync with game state ----------
  // Show controls only during active gameplay (mirrors keyboard behaviour,
  // which is also gated on gameActive); clear stuck inputs on pause.
  let wasActive = false;
  let wasJoystickVisible = null;
  const joystickGroup = document.getElementById('tc-joysticks');
  function syncVisibility() {
    const gameOn = (typeof gameActive !== 'undefined') && !!gameActive;
    const invEl = document.getElementById('inventory');
    const stEl = document.getElementById('station-panel');
    const invOpen = invEl && invEl.style.display === 'block';
    const stOpen = stEl && stEl.style.display === 'block';
    const active = gameOn && !invOpen && !stOpen;
    if (active !== wasActive) {
      root.classList.toggle('tc-visible', active);
      if (!active) clearMovementKeys();
      wasActive = active;
    }

    // Joystick + fire button visibility, independent of the action buttons,
    // controlled by the "JOYSTICK: ON/OFF" main menu toggle.
    const joyVisible = window.joystickControlsVisible !== false;
    if (joyVisible !== wasJoystickVisible) {
      if (joystickGroup) joystickGroup.classList.toggle('tc-joysticks-hidden', !joyVisible);
      if (!joyVisible) { keys['a'] = keys['d'] = keys['i'] = keys['k'] = keys['s'] = keys['w'] = false; keys['control'] = false; }
      wasJoystickVisible = joyVisible;
    }

    requestAnimationFrame(syncVisibility);
  }
  requestAnimationFrame(syncVisibility);
})();
