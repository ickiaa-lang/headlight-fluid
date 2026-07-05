// ==================== THREE.JS GAME ====================

// === GLOBAL ERROR BANNER ===
// If anything below throws (most commonly: WebGL context creation failing
// inside the desktop window), show a clear on-screen message instead of a
// silently dead page. Registered first, before anything risky runs.
//
// NOTE: when game.js is loaded over file:// (opening index.html directly,
// rather than through pywebview/a real server), Chrome treats the script as
// cross-origin and REDACTS the real error message here, reporting only the
// generic text "Script error." with no detail. To get the real message we
// also wrap specific risky calls (like creating the WebGL renderer) in their
// own local try/catch below — local try/catch is NOT subject to that
// redaction, since it isn't crossing the cross-origin reporting boundary.
function showEngineErrorBanner(detail) {
  if (document.getElementById('engine-error-banner')) return; // only show once
  const banner = document.createElement('div');
  banner.id = 'engine-error-banner';
  banner.style.cssText = 'position:fixed;top:0;left:0;width:100%;z-index:1000;'
    + 'background:#300;border-bottom:2px solid #f44;color:#f88;font-family:monospace;'
    + 'font-size:13px;padding:10px 16px;line-height:1.5;white-space:pre-wrap;';
  banner.textContent = '\u26A0 ENGINE ERROR — the 3D scene failed to load '
    + '(usually a WebGL problem in this window, not a code bug).\n'
    + 'Error: ' + detail + '\n'
    + 'Menu / About / Save-Load panel buttons still work. New Game / Resume will not.';
  document.body.appendChild(banner);
}
window.addEventListener('error', (e) => {
  showEngineErrorBanner(e.message || e.error || 'unknown error');
});

// ==================== ENHANCED MUSIC GENERATION & 3D MESHES ====================
// Polyphonic synth system with state-aware chord progressions + enhanced mesh models

let audioCtx;
let masterGain;

function initAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = 0.25;
  masterGain.connect(audioCtx.destination);
}

class SynthVoice {
  constructor() {
    this.osc = null;
    this.gain = null;
    this.startTime = 0;
  }
  
  start(freq, duration = 1.0, waveform = 'sine', volume = 0.1) {
    if (!audioCtx) initAudio();
    
    this.osc = audioCtx.createOscillator();
    this.gain = audioCtx.createGain();
    this.osc.type = waveform;
    this.osc.frequency.value = freq;
    
    this.osc.connect(this.gain);
    this.gain.connect(masterGain);
    
    this.startTime = audioCtx.currentTime;
    this.gain.gain.setValueAtTime(volume, this.startTime);
    this.gain.gain.linearRampToValueAtTime(0, this.startTime + duration);
    
    this.osc.start(this.startTime);
    this.osc.stop(this.startTime + duration + 0.05);
  }
  
  stop() {
    if (this.osc) {
      this.osc.stop(audioCtx.currentTime + 0.1);
      this.osc = null;
    }
  }
}

const chordProgression = {
  minorChord: (root) => [root, root + 3, root + 7, root + 10],
  majorChord: (root) => [root, root + 4, root + 7, root + 12],
  diminished: (root) => [root, root + 3, root + 6],
  augmented: (root) => [root, root + 4, root + 8],
};

const pentatonicScale = [60, 63, 65, 67, 70, 72, 75, 77];

class PolyphonicSynthesizerMk2 {
  constructor() {
    this.voices = [];
    this.progressionPhase = 0;
    this.lastChordTime = Date.now();
    this.gameStateVolume = 0.12;
    this.melodyInterval = null;
    this.bassInterval = null;
    this.chordInterval = null;
  }
  
  startAmbience() {
    if (!audioCtx) initAudio();
    
    this.bassInterval = setInterval(() => {
      const bassNotes = [36, 41, 43, 46];
      const note = bassNotes[this.progressionPhase % 4];
      this.playNote(note, 0.5, 'sine', 0.18, 'bass');
      this.progressionPhase++;
    }, 1000);
    
    this.chordInterval = setInterval(() => {
      const chordRoots = [48, 48, 51, 46];
      const root = chordRoots[this.progressionPhase % 4];
      const notes = chordProgression.minorChord(root);
      
      notes.forEach((n, i) => {
        setTimeout(() => this.playNote(n, 2.0, 'triangle', 0.06, 'chord'), i * 150);
      });
    }, 4000);
    
    this.melodyInterval = setInterval(() => {
      const freq = pentatonicScale[Math.floor(Math.random() * pentatonicScale.length)];
      const duration = Math.random() < 0.3 ? 0.8 : 0.4;
      this.playNote(freq, duration, 'sine', 0.14, 'melody');
    }, 600);
  }
  
  playNote(freq, duration = 0.5, waveform = 'sine', volume = 0.1, role = 'melody') {
    if (!audioCtx) initAudio();
    
    const voice = new SynthVoice();
    const adaptiveVol = volume * Math.max(0.8, this.gameStateVolume);
    voice.start(freq, duration, waveform, adaptiveVol);
    this.voices.push(voice);
    
    setTimeout(() => {
      this.voices = this.voices.filter(v => v !== voice);
    }, (duration + 0.1) * 1000);
  }
  
  setGameState(oxygenLevel, waterLevel, foodLevel, fuelLevel) {
    const minResource = Math.min(oxygenLevel, waterLevel, foodLevel, fuelLevel);
    this.gameStateVolume = minResource < 20 ? 0.22 : minResource < 50 ? 0.16 : 0.12;
  }
  
  stop() {
    if (this.melodyInterval) clearInterval(this.melodyInterval);
    if (this.bassInterval) clearInterval(this.bassInterval);
    if (this.chordInterval) clearInterval(this.chordInterval);
    this.voices.forEach(v => v.stop());
    this.voices = [];
  }
}

let synth = new PolyphonicSynthesizerMk2();

function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Removed duplicate — now in assets.js
// Removed duplicates — now loaded from assets.js (complex Quake2 models + pink station + themed farms)


// === SOUND SYSTEM (Polyphonic Synth) ===
// NOTE: this used to say "provided by enhanced-music-meshes.js — do not
// define playBeep() or beat/synth functions here", but that file was never
// actually included in this project (see index.html script tags), which
// left playBeep/startBeatAtmosphere/stopBeatAtmosphere/startSynthAtmosphere/
// stopSynthAtmosphere undefined everywhere they were called. Defining them
// here, using the SynthVoice/PolyphonicSynthesizerMk2 machinery already in
// this file, so every sound effect and music toggle actually works.
function playBeep(freq, duration = 0.3, waveform = 'sine', volume = 0.15) {
  if (!audioCtx) initAudio();
  const voice = new SynthVoice();
  voice.start(freq, duration, waveform, volume);
}

function play808Kick() {
  if (!audioCtx) initAudio();
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  const f = audioCtx.createBiquadFilter();
  o.type = 'sine';
  o.frequency.value = 120;
  f.type = 'lowpass';
  f.frequency.value = 600;
  const t = audioCtx.currentTime;
  o.frequency.setValueAtTime(120, t);
  o.frequency.exponentialRampToValueAtTime(40, t + 0.7);
  g.gain.value = 0.9;
  g.gain.linearRampToValueAtTime(0.001, t + 0.8);
  o.connect(f); f.connect(g); g.connect(masterGain);
  o.start(t); o.stop(t + 1.5);
}
function play808Hat(open = false) {
  if (!audioCtx) initAudio();
  const len = Math.floor(audioCtx.sampleRate * (open ? 0.6 : 0.12));
  const b = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = audioCtx.createBufferSource();
  src.buffer = b;
  const g = audioCtx.createGain();
  const f = audioCtx.createBiquadFilter();
  f.type = 'highpass';
  f.frequency.value = 5000;
  g.gain.value = open ? 0.35 : 0.22;
  g.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + (open ? 0.55 : 0.1));
  src.connect(f); f.connect(g); g.connect(masterGain);
  src.start();
}
function play808Snare() {
  if (!audioCtx) initAudio();
  // noise
  const len = Math.floor(audioCtx.sampleRate * 0.35);
  const b = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = audioCtx.createBufferSource();
  src.buffer = b;
  const g = audioCtx.createGain();
  const f = audioCtx.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = 200;
  f.Q.value = 1.8;
  g.gain.value = 0.55;
  g.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
  src.connect(f); f.connect(g); g.connect(masterGain);
  src.start();
  // tone
  const o = audioCtx.createOscillator();
  o.type = 'triangle';
  o.frequency.value = 160;
  const og = audioCtx.createGain();
  og.gain.value = 0.35;
  og.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
  o.connect(og); og.connect(masterGain);
  o.start(); o.stop(audioCtx.currentTime + 0.25);
}

let beatAtmosphereInterval = null;
function startBeatAtmosphere() {
  if (beatAtmosphereInterval) return;
  if (!audioCtx) initAudio();
  let step = 0;
  beatAtmosphereInterval = setInterval(() => {
    // algorithmic 808 drumpads pattern
    if (step % 4 === 0) play808Kick();
    if (step % 8 === 4) play808Snare();
    if (Math.random() < 0.75) play808Hat(false);
    if (step % 16 === 8 && Math.random() < 0.4) play808Hat(true);
    if ((step % 3 === 1 || step % 7 === 2) && Math.random() < 0.25) play808Kick();
    step = (step + 1) % 16;
  }, 125);
}
function stopBeatAtmosphere() {
  if (beatAtmosphereInterval) {
    clearInterval(beatAtmosphereInterval);
    beatAtmosphereInterval = null;
  }
}
function startSynthAtmosphere() {
  synth.startAmbience();
}
function stopSynthAtmosphere() {
  synth.stop();
}

// Station theme kept for compatibility:
let stationThemeInterval = null;
function startStationTheme() {
  if (stationThemeInterval) return;
  if (!audioCtx) initAudio();
  
  stationThemeInterval = setInterval(() => {
    synth.playNote(65, 1.2, 'sine', 0.14);  // F3
    setTimeout(() => synth.playNote(82, 1.0, 'sine', 0.12), 800); // G#3
    setTimeout(() => synth.playNote(98, 1.0, 'sine', 0.12), 1600); // G4
    setTimeout(() => synth.playNote(130, 0.9, 'sine', 0.18), 2400); // C4
    setTimeout(() => synth.playNote(98, 0.8, 'sine', 0.14), 3200); // G4
    setTimeout(() => synth.playNote(82, 0.8, 'sine', 0.12), 4000); // G#3
    setTimeout(() => synth.playNote(65, 1.5, 'sine', 0.12), 4800); // F3
  }, 8000);
}
function stopStationTheme() {
  if (stationThemeInterval) {
    clearInterval(stationThemeInterval);
    stationThemeInterval = null;
  }
}

function playDragonSong() {
  // Dragon song for space mine boss show up (dramatic low roars)
  playBeep(80, 0.9, 'sine', 0.25);
  setTimeout(() => playBeep(60, 0.8, 'sine', 0.22), 400);
  setTimeout(() => playBeep(50, 0.7, 'sine', 0.2), 900);
  setTimeout(() => playBeep(70, 0.6, 'sine', 0.18), 1400);
}

function spawnEscortMines() {
  escortMines.forEach(e => scene.remove(e.mesh));
  escortMines = [];
  for (let i = 0; i < 2; i++) {
    const isBlue = i === 0;
    const geo = new THREE.SphereGeometry(1.8, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color: isBlue ? 0x4488ff : 0xff4444, transparent: true, opacity: 0.85 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(player.position).add(new THREE.Vector3((i - 0.5) * 7, 4, -7));
    scene.add(mesh);
    escortMines.push({ mesh, isBlue, shootTimer: Math.random() * 1.5 });
  }
}

function fireEscortShot(e) {
  // Escort shoots laser like the ship (blue or red)
  const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(player.quaternion);
  const bullet = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 6, 6),
    new THREE.MeshBasicMaterial({ color: e.isBlue ? 0x4488ff : 0xff4444, transparent: true, opacity: 0.9 })
  );
  bullet.position.copy(e.mesh.position).add(dir.clone().multiplyScalar(2));
  bullet.userData.velocity = dir.clone().multiplyScalar(45);
  bullet.userData.life = 1.2;
  scene.add(bullet);
  // simple bullet array or handle in update, for minimal use existing bullet system or add to a temp array
  // For simplicity, add to a global escortBullets if exists, or handle in animate
  if (!window.escortBullets) window.escortBullets = [];
  window.escortBullets.push(bullet);
}

// === MENU UI WIRING (runs first, before the 3D engine) ===
// These listeners are registered before any Three.js/WebGL code executes,
// so the main menu (About / Save / Load / panel-close buttons) keeps working
// even if the 3D engine below fails to start. New Game / Resume / Save / Load
// still need the engine to have initialized successfully, and will report an
// error via setStatus() if not.
// === INTERACTIVE MENU MANAGEMENT ===
document.getElementById('btn-start').addEventListener('click', () => {
  // Fresh initialization on start
  oxygen = 85; water = 70; food = 60; fuel = 55;
  playTimeSeconds = 0;
  resourceActiveSeconds = 0;
  resourcePausedSeconds = 0;
  player.position.set(0, 0, 0);
  player.rotation.set(0, 0, 0);
  player.userData.velocity.set(0, 0, 0);
  
  // Clear inventory slots
  inventory.forEach(s => s.count = 0);
  cargoSlots.forEach(s => { s.count = 0; s.itemType = null; });
  patchBaySlots.forEach(s => { s.count = 0; s.itemType = null; s.powered = false; });
  stationStorage = {};
  // Station Patch Bays now support Splitters:
  // Base = 3 slots. If a Splitter is plugged into the station's bay → +2 slots (max 5 total)
  headlightFluidSlots.forEach(s => s.count = 0);
  Object.keys(shipComponents).forEach(k => shipComponents[k] = 0);
  Object.keys(growPlateInstalled).forEach(k => growPlateInstalled[k] = false);

  generateNewRegionContent();

  // Lock the single home beacon to the starting region's center (only one ever)
  const startRegionX = Math.floor(player.position.x / 200);
  const startRegionZ = Math.floor(player.position.z / 200);
  const homeX = startRegionX * 200 + 100;
  const homeZ = startRegionZ * 200 + 100;
  regionBeacon.position.set(homeX, 0, homeZ);
  regionBeacon.userData.isHomeBeacon = true;

  document.getElementById('main-menu').style.display = 'none';
  document.getElementById('ingame-stats').style.display = 'flex';
  const crtCanvas = document.getElementById('crt-overlay');
  if (crtCanvas) crtCanvas.style.display = 'block';
  if (window.gameCanvas) window.gameCanvas.style.display = 'block';
  document.getElementById('btn-resume').style.display = 'block';
  startStationTheme();
  gameActive = true;
});

// Resume button
document.getElementById('btn-resume').addEventListener('click', () => {
  document.getElementById('main-menu').style.display = 'none';
  document.getElementById('ingame-stats').style.display = 'flex';
  const crtCanvas = document.getElementById('crt-overlay');
  if (crtCanvas) crtCanvas.style.display = 'block';
  if (window.gameCanvas) window.gameCanvas.style.display = 'block';
  startStationTheme();
  gameActive = true;
});

// About modal mechanics
document.getElementById('btn-about').addEventListener('click', () => {
  const panel = document.getElementById('about-panel');
  const content = document.getElementById('about-content') || panel;
  content.innerHTML = `
    <h2 style="color:#0ff; margin:0 0 15px 0;">Headlight-Fluid</h2>
    <p style="color:#aaa; line-height:1.5;">A small, rugged escape craft built for deep-space survival. 
    Features twin left engine pods, advanced resource management, and experimental navigation assist.</p>
    <div style="text-align:center; margin:15px 0;">
      <img src="https://grok.x.ai/attachments/BxBet" alt="Ship Concept" style="max-width:90%; border:2px solid #0ff; border-radius:4px;">
    </div>
    <p style="font-size:12px; color:#0aa;">Version 3.1 • Built with Three.js</p>
  `;
  panel.style.display = 'block';
});
document.getElementById('btn-about-close').addEventListener('click', () => {
  document.getElementById('about-panel').style.display = 'none';
});

// Save / Load menu mechanics
document.getElementById('btn-saveload').addEventListener('click', () => {
  document.getElementById('saveload-panel').style.display = 'block';
  document.getElementById('saveload-status').textContent = '';
});
document.getElementById('btn-saveload-close').addEventListener('click', () => {
  document.getElementById('saveload-panel').style.display = 'none';
});

document.getElementById('btn-keys').addEventListener('click', () => {
  const panel = document.getElementById('keys-panel');
  const content = document.getElementById('keys-content');
  content.innerHTML = '';
  const bindings = [{key: 'W / ↑', action: 'Thrust Forward'},{key: 'S / ↓', action: 'Thrust Backward'},{key: 'A / ←', action: 'Yaw Left'},{key: 'D / →', action: 'Yaw Right'},{key: 'I', action: 'Pitch Up'},{key: 'K', action: 'Pitch Down'},{key: 'CTRL', action: 'Burst Laser'},{key: 'SPACE', action: 'Brake'},{key: 'F', action: 'Flashlight'},{key: 'G', action: 'Scan'},{key: 'T', action: 'Warp'},{key: 'P', action: 'Inventory'},{key: 'O', action: 'Dock Station'},{key: 'M', action: 'Menu'},{key: '~', action: 'CLI Terminal'}];
  bindings.forEach((b) => {
    const div = document.createElement('div');
    div.style.cssText = 'display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #033;cursor:pointer;';
    div.innerHTML = `<span>${b.action}</span><span style="color:#0aa;">${b.key}</span>`;
    div.onclick = () => {
      div.style.background = '#033';
      const handler = (e) => { e.preventDefault(); div.querySelector('span:last-child').textContent = e.key.toUpperCase(); document.removeEventListener('keydown', handler); div.style.background = ''; };
      document.addEventListener('keydown', handler, {once:true});
    };
    content.appendChild(div);
  });
  panel.style.display = 'block';
});
document.getElementById('btn-keys-close').addEventListener('click', () => { document.getElementById('keys-panel').style.display = 'none'; });

document.getElementById('btn-inventory-close').addEventListener('click', () => {
  inventoryOpen = false;
  document.getElementById('inventory').style.display = 'none';
});

document.getElementById('btn-station-close').addEventListener('click', () => {
  closeStationPanel();
});

let hostPin = '';
let playerNick = '';
let mpPlayers = [];

// === CHARACTER SELECTION ===
let selectedCharacter = 'misty'; // Default character

const characterData = {
  misty: { idle: 'misty.jpg', active: 'misty-b.jpg', label: 'MISTY' },
  tom: { idle: 'tom.jpg', active: 'tom-b.jpg', label: 'TOM' },
  ratkins: { idle: 'ratkins.jpg', active: 'ratkins-b.jpg', label: 'RATKINS' },
  '40s': { idle: '40_s.jpg', active: '40_s-b.jpg', label: "40's" },
  socky: { idle: 'socky.jpg', active: 'socky-b.jpg', label: 'SOCKY' }
};

document.getElementById('btn-multi').addEventListener('click', () => {
  const p = document.createElement('div');
  p.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,15,40,0.98);border:2px solid #0ff;padding:25px;border-radius:6px;color:#0ff;font-family:monospace;width:300px;box-shadow:0 0 35px rgba(0,255,255,0.35);z-index:320;text-align:center;';
  p.innerHTML = `<h3 style="margin-top:0;border-bottom:1px solid #0ff;padding-bottom:8px;">MULTIPLAYER V0.3R</h3><div style="margin:20px 0;">10-player max • Rainbow Hub</div><button id="h" style="background:rgba(0,40,20,0.6);border:1px solid #0f8;color:#0f8;font-family:monospace;padding:10px 20px;margin:5px;">HOST</button><button id="j" style="background:rgba(0,40,20,0.6);border:1px solid #0f8;color:#0f8;font-family:monospace;padding:10px 20px;margin:5px;">JOIN</button><div style="margin-top:15px;font-size:11px;color:#0aa;">SP save import • cargo export</div><button id="c" style="margin-top:20px;background:rgba(0,20,40,0.6);border:1px solid #0ff;color:#0ff;font-family:monospace;padding:8px 18px;width:100%;">CLOSE</button>`;
  document.body.appendChild(p);
  document.getElementById('h').onclick = () => {
    p.remove();
    const ip = prompt('Hosting IP (stub):', '192.168.1.42');
    hostPin = prompt('Set 6-digit join PIN:', '123456') || '000000';
    playerNick = document.getElementById('pilot-designation').value || 'AB12-XYZ';
    mpPlayers = [
      {nick: playerNick, time: 0, diff: 'normal'}
    ];
    const ipDiv = document.createElement('div');
    ipDiv.id = 'mp-ip';
    ipDiv.style.cssText = 'position:fixed;bottom:55px;right:20px;font-family:monospace;font-size:11px;color:#0aa;z-index:150;';
    ipDiv.textContent = 'NICK: ' + playerNick + ' | HOST IP: ' + (ip || '127.0.0.1') + ' | PIN: ' + hostPin;
    document.body.appendChild(ipDiv);
    const pl = document.createElement('div');
    pl.id = 'player-list';
    pl.style.cssText = 'position:fixed;top:20px;left:20px;font-family:monospace;font-size:10px;color:#0aa;z-index:150;background:rgba(0,10,30,0.7);padding:4px 8px;border:1px solid #033;';
    pl.innerHTML = mpPlayers.map(p => `NICK: ${p.nick} | TIME: ${Math.floor(p.time/60)}m | DIFF: ${p.diff}`).join('<br>');
    document.body.appendChild(pl);
    alert('HOSTING started — players listed below HUD');
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('ingame-stats').style.display = 'flex';
    document.getElementById('btn-resume').style.display = 'block';
    stopStationTheme();
    gameActive = true;
  };
  document.getElementById('j').onclick = () => {
    p.remove();
    const joinPin = prompt('Enter host 6-digit PIN:');
    if (joinPin === hostPin) {
      playerNick = document.getElementById('pilot-designation').value || 'CD34-ABC';
      mpPlayers = [
        {nick: playerNick, time: 0, diff: 'normal'}
      ];
      const nickDiv = document.createElement('div');
      nickDiv.id = 'mp-ip';
      nickDiv.style.cssText = 'position:fixed;bottom:55px;right:20px;font-family:monospace;font-size:11px;color:#0aa;z-index:150;';
      nickDiv.textContent = 'NICK: ' + playerNick + ' | JOINED';
      document.body.appendChild(nickDiv);
      const pl = document.createElement('div');
      pl.id = 'player-list';
      pl.style.cssText = 'position:fixed;top:20px;left:20px;font-family:monospace;font-size:10px;color:#0aa;z-index:150;background:rgba(0,10,30,0.7);padding:4px 8px;border:1px solid #033;';
      pl.innerHTML = mpPlayers.map(p => `NICK: ${p.nick} | TIME: ${Math.floor(p.time/60)}m | DIFF: ${p.diff}`).join('<br>');
      document.body.appendChild(pl);
      alert('JOINED — players listed below HUD');
      document.getElementById('main-menu').style.display = 'none';
      document.getElementById('ingame-stats').style.display = 'flex';
      document.getElementById('btn-resume').style.display = 'block';
      stopStationTheme();
      gameActive = true;
    } else {
      alert('Wrong PIN — join failed');
    }
  };
  document.getElementById('c').onclick = () => p.remove();
});

// === CHARACTER SELECTION HANDLERS ===
document.querySelectorAll('.char-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const char = btn.dataset.char;
    selectedCharacter = char;
    
    // Update button styling - highlight selected, reset others
    document.querySelectorAll('.char-btn').forEach(b => {
      if (b.dataset.char === char) {
        b.style.borderWidth = '2px';
        b.style.borderColor = '#0ff';
        b.style.background = 'rgba(0,40,80,0.8)';
      } else {
        b.style.borderWidth = '1px';
        b.style.borderColor = '#0ff';
        b.style.background = 'rgba(0,20,40,0.8)';
      }
    });
    
    // Update standby images immediately if game is running
    updateStandbyImages();
  });
});

// Set initial button styling (Misty is default)
document.querySelector('[data-char="misty"]').style.borderWidth = '2px';
document.querySelector('[data-char="misty"]').style.background = 'rgba(0,40,80,0.8)';

['music','interactions','enemy','gamepad','resource','minimap','assist','direction-assist','joystick'].forEach(id => {
  const b = document.getElementById('btn-'+id);
  if(b) b.addEventListener('click', () => {
    const isOn = b.textContent.includes(': ON');
    b.textContent = b.textContent.replace(isOn ? ': ON' : ': OFF', isOn ? ': OFF' : ': ON');
    if (id === 'gamepad') gamepadEnabled = !isOn;
    if (id === 'joystick') window.joystickControlsVisible = !isOn;
    if (id === 'minimap') {
      minimapEnabled = !isOn;
      const frame = document.getElementById('minimap-frame') || minimap;
      if (frame) frame.style.display = minimapEnabled ? 'block' : 'none';
    }
    if (id === 'assist') flightAssist = !isOn;
    if (id === 'direction-assist') {
      directionAssistLevel = directionAssistLevel > 0 ? 0 : 2; // toggle Off / Medium
      const label = directionAssistLevel > 0 ? 'ON' : 'OFF';
      b.textContent = b.textContent.replace(/: .*/, `: ${label}`);
    }
    if (id === 'music') {
      if (isOn) {
        stopSynthAtmosphere(); stopBeatAtmosphere();
      } else {
        startSynthAtmosphere(); startBeatAtmosphere();
      }
    }
  });
});

['easy','yeahok','hard'].forEach(id => {
  const b = document.getElementById('btn-'+id);
  if(b) b.addEventListener('click', () => {
    document.querySelectorAll('[id^="btn-easy"],[id^="btn-yeahok"],[id^="btn-hard"]').forEach(bb => bb.style.borderColor='#0ff');
    b.style.borderColor = '#0f8';
    currentDifficulty = (id === 'easy' ? 'easy' : id === 'hard' ? 'hard' : 'normal');
    const dEl = document.getElementById('is-difficulty'); if (dEl) dEl.textContent = currentDifficulty.toUpperCase();
  });
});

const ex = document.getElementById('btn-exit');
if(ex) ex.addEventListener('click', () => { if(window.pywebview&&window.pywebview.api) window.pywebview.api.quit(); else window.close(); });

// ── Save / Load helpers ─────────────────────────────────────────────────────
// Uses pywebview API when running as desktop app, falls back to localStorage
// in a regular browser.
const hasPyAPI = () => window.pywebview && window.pywebview.api;

function buildSaveData() {
  return {
    vital: { oxygen, water, food, fuel },
    pos: { x: player.position.x, y: player.position.y, z: player.position.z },
    rot: { x: player.rotation.x, y: player.rotation.y, z: player.rotation.z },
    inventory: inventory.map(s => s.count),
    cargo: cargoSlots.map(s => ({ count: s.count, itemType: s.itemType })),
    patchBay: patchBaySlots.map(s => ({ count: s.count, itemType: s.itemType, powered: s.powered })),
    stations: stationStorage,
    fluid: headlightFluidSlots.map(s => s.count),
    components: shipComponents,
    playTime: playTimeSeconds,
    resourceActiveTime: resourceActiveSeconds,
    resourcePausedTime: resourcePausedSeconds
  };
}

function applySaveData(parsed) {
  oxygen = parsed.vital.oxygen;
  water  = parsed.vital.water;
  food   = parsed.vital.food;
  fuel   = parsed.vital.fuel;
  player.position.set(parsed.pos.x, parsed.pos.y, parsed.pos.z);
  player.rotation.set(parsed.rot.x, parsed.rot.y, parsed.rot.z);
  player.userData.velocity.set(0, 0, 0);
  parsed.inventory.forEach((c, idx) => { if(inventory[idx]) inventory[idx].count = c; });
  if (parsed.cargo || parsed.patchBay) {
    // Current format — Cargo Hold and Patch Bay saved separately
    (parsed.cargo || []).forEach((s, idx) => {
      if (cargoSlots[idx]) {
        cargoSlots[idx].count    = s.count    || 0;
        cargoSlots[idx].itemType = s.itemType !== undefined ? s.itemType : null;
      }
    });
    (parsed.patchBay || []).forEach((s, idx) => {
      if (patchBaySlots[idx]) {
        patchBaySlots[idx].count    = s.count    || 0;
        patchBaySlots[idx].itemType = s.itemType !== undefined ? s.itemType : null;
        patchBaySlots[idx].powered  = s.powered  || false;
      }
    });
  } else if (parsed.spare) {
    // Legacy save (pre Patch Bay) — sort old Spare Slot contents into
    // Cargo Hold (consumables) vs Patch Bay (modules). Modules load
    // unplugged since Power Plugs didn't exist yet.
    let cargoCursor = 0, bayCursor = 0;
    parsed.spare.forEach((s) => {
      let count, itemType;
      if (typeof s === 'object' && s !== null) {
        count = s.count || 0; itemType = s.itemType !== undefined ? s.itemType : null;
      } else {
        count = s || 0; itemType = null;
      }
      if (count <= 0 || itemType === null) return;
      const loot = lootItemTypes[itemType];
      if (loot && loot.isGrowPlate) {
        if (patchBaySlots[bayCursor]) {
          patchBaySlots[bayCursor].itemType = itemType;
          patchBaySlots[bayCursor].count    = count;
          patchBaySlots[bayCursor].powered  = false;
          bayCursor++;
        }
      } else if (cargoSlots[cargoCursor]) {
        cargoSlots[cargoCursor].itemType = itemType;
        cargoSlots[cargoCursor].count    = count;
        cargoCursor++;
      }
    });
    if (bayCursor > 0) showLootToast('🔌 OLD MODULES MOVED TO PATCH BAY — PLUG THEM BACK IN');
  }
  parsed.fluid.forEach((c, idx)    => { if(headlightFluidSlots[idx]) headlightFluidSlots[idx].count = c; });
  shipComponents  = parsed.components;
  stationStorage  = parsed.stations || {};
  playTimeSeconds = parsed.playTime || 0;
  resourceActiveSeconds = parsed.resourceActiveTime || 0;
  resourcePausedSeconds = parsed.resourcePausedTime || 0;
  refreshGrowPlates();
}

function setStatus(msg, color) {
  const el = document.getElementById('saveload-status');
  el.textContent = msg; el.style.color = color;
}

// Save actions
document.getElementById('btn-save-action').addEventListener('click', async () => {
  const saveData = buildSaveData();
  try {
    if (hasPyAPI()) {
      const result = await window.pywebview.api.save_game(saveData);
      if (result.ok) {
        setStatus('SAVED → ' + result.path.split(/[\\/]/).pop() + '  ' + formatPlaytime(playTimeSeconds), '#0f8');
      } else {
        setStatus('SAVE ERROR: ' + result.error, '#f44');
      }
    } else {
      localStorage.setItem('save-game-load', JSON.stringify(saveData));
      setStatus('SYSTEM STATE RECORDED!  ' + formatPlaytime(playTimeSeconds), '#0f8');
    }
  } catch(e) {
    setStatus('SAVE FAILED: ' + e, '#f44');
  }
});

// Load actions
document.getElementById('btn-load-action').addEventListener('click', async () => {
  try {
    let parsed;
    if (hasPyAPI()) {
      const result = await window.pywebview.api.load_game();
      if (!result.ok) { setStatus('ERROR: ' + result.error, '#f44'); return; }
      parsed = result.data;
    } else {
      const raw = localStorage.getItem('save-game-load');
      if (!raw) { setStatus('ERROR: DATA RETRIEVAL FAILURE', '#f44'); return; }
      parsed = JSON.parse(raw);
    }
    applySaveData(parsed);
    generateNewRegionContent();
    document.getElementById('saveload-panel').style.display = 'none';
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('ingame-stats').style.display = 'flex';
    document.getElementById('btn-resume').style.display = 'block';
    setStatus('LOADED — ' + formatPlaytime(playTimeSeconds), '#0f8');
    gameActive = true;
  } catch(err) {
    setStatus('CORRUPT SYSTEM RECORD', '#f44');
  }
});

// === PLAYTIME HELPERS ===
function formatPlaytime(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  return (h > 0 ? h + 'h ' : '') + String(m).padStart(2,'0') + 'm ' + String(s).padStart(2,'0') + 's';
}

function updateMenuPlaytime() {
  const el = document.getElementById('menu-playtime');
  if (el) {
    if (playTimeSeconds > 0) {
      el.textContent = 'SESSION  ' + formatPlaytime(playTimeSeconds);
      // Add strikethrough if any resource is empty
      el.style.textDecoration = window.allResourcesAvailable ? 'none' : 'line-through';
      el.style.opacity = window.allResourcesAvailable ? '1' : '0.5';
    } else {
      el.textContent = '';
    }
  }
}

// === 3D ENGINE (Three.js scene, ship, physics, render loop) ===
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
// Pixelation: render at reduced resolution, CSS upscale with pixelated filtering
const PIXEL_SCALE = 0.38; // lower = chunkier pixels
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
} catch (rendererErr) {
  console.error('[Headlight-Fluid] WebGLRenderer creation failed:', rendererErr);
  showEngineErrorBanner((rendererErr && rendererErr.message ? rendererErr.message : rendererErr)
    + ' (thrown directly by new THREE.WebGLRenderer — this almost always means WebGL is unavailable or disabled in this browser/window)');
  throw rendererErr; // stop here, same as before — just with the real message now visible
}
renderer.setClearColor(0x000008, 1);
renderer.setPixelRatio(1);
const rc = renderer.domElement;
window.gameCanvas = rc; // Make globally accessible for menu toggling
rc.style.position = 'absolute';
rc.style.top = '0'; rc.style.left = '0';
rc.style.width  = '100%';
rc.style.height = '100%';
rc.style.imageRendering = 'pixelated';
rc.style.imageRendering = 'crisp-edges';
rc.style.zIndex = '1';
rc.style.pointerEvents = 'none';
document.body.appendChild(rc);

// CRT overlay canvas/state — declared here (before resizeRenderer is first
// called below) because resizeRenderer() conditionally calls crtResize(),
// which reads these. crtResize/drawCRT are function declarations so they're
// hoisted and "exist" early; these const/let bindings are NOT hoisted in a
// usable way, so they must be declared before that first call or it throws
// "Cannot access 'crtCanvas' before initialization".
const crtCanvas = document.getElementById('crt-overlay');
const crtCtx    = crtCanvas.getContext('2d');
let crtW = 0, crtH = 0;
let crtRollY = 0;

function resizeRenderer() {
  const w = window.innerWidth  || document.documentElement.clientWidth  || 800;
  const h = window.innerHeight || document.documentElement.clientHeight || 600;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(Math.floor(w * PIXEL_SCALE), Math.floor(h * PIXEL_SCALE), false);
  if (typeof crtResize === 'function') crtResize();
}
// Run once immediately, then again after layout settles
resizeRenderer();
window.addEventListener('resize', resizeRenderer);
window.addEventListener('load', () => setTimeout(resizeRenderer, 50));
setTimeout(resizeRenderer, 200);
setTimeout(resizeRenderer, 600);
setTimeout(startStationTheme, 1200); // play station song on main menu

// Fix for minimize/restore not refreshing scene (WebGL context / size)
window.addEventListener('visibilitychange', () => {
  if (!document.hidden) setTimeout(resizeRenderer, 100);
});
if (rc) {
  rc.addEventListener('webglcontextlost', e => e.preventDefault());
  rc.addEventListener('webglcontextrestored', () => setTimeout(resizeRenderer, 50));
}

// === GLOBAL CONTROL STATE ===
let gameActive = false;
let minimapEnabled = false; // minimap is now off by default — enable via menu "Minimap" button
let flightAssist = true;   // Flight Assist (main menu toggle) — 30s idle → gentle auto-orient nose toward homing beacon
let lastInputTime = Date.now();
let directionAssistLevel = 0; // 0=Off, 1=Low, 2=Medium, 3=Strong — auto-steers toward stations or enemies
let playTimeSeconds = 0; // total seconds played, persists via save
let resourceActiveSeconds = 0; // total time with at least one resource (O2/H2O/Food/Fuel) above zero, persists via save
let resourcePausedSeconds = 0; // total time with NO resources active (all at zero), persists via save
let currentDifficulty = 'normal';
let hasEscort = false;
let escortMines = [];

// === STARFIELD ===
const starCount = 7000;
const starsGeo = new THREE.BufferGeometry();
const starPositions = new Float32Array(starCount * 3);
for (let i = 0; i < starCount * 3; i++) {
  starPositions[i] = (Math.random() - 0.5) * 7000;
}
starsGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
const starsMat = new THREE.PointsMaterial({ color: 0xbbbbcc, size: 1.1 });
const stars = new THREE.Points(starsGeo, starsMat);
scene.add(stars);

// === LIGHTING ===
const ambient = new THREE.AmbientLight(0x223344, 0.22); // darker atmosphere
scene.add(ambient);
const sun = new THREE.DirectionalLight(0xffeecc, 0.6);
sun.position.set(50, 80, -30);
scene.add(sun);

// === PLAYER SHIP (Toothpick — Headlight-Fluid) ===
// Removed duplicate — now in player.js (X-wing/TIE hybrid)


const player = createSilverShip();

// === Animate the wing "GIF" screens: redraw a new blocky frame every
// ~120ms per screen (slightly offset per-wing) for that jerky low-frame
// looping-GIF feel, rather than a smooth per-frame update. ===
function drawGifFrame(ctx, frame) {
  const w = ctx.canvas.width, h = ctx.canvas.height;
  ctx.clearRect(0, 0, w, h);
  const palette = ['#00eeff', '#ff3300', '#ffcc00', '#00eeff'];
  ctx.fillStyle = palette[frame % palette.length];
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#000814';
  // simple blocky "radar sweep" bar that steps across each frame
  const barX = (frame * 6) % w;
  ctx.fillRect(barX, 0, 4, h);
  ctx.strokeStyle = '#000814';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, w - 2, h - 2);
}
function updateGifScreens(deltaMs) {
  const screens = player.userData.gifScreens;
  if (!screens) return;
  screens.forEach((s, i) => {
    s.timer += deltaMs;
    if (s.timer >= 120) { // old-GIF-style low frame rate, not 60fps
      s.timer = 0;
      s.frame = (s.frame + 1) % 4;
      drawGifFrame(s.ctx, s.frame + i); // offset so the four wings don't all sync up
      s.tex.needsUpdate = true;
    }
  });
}
player.rotation.y = Math.PI;  // Spin 180 degrees horizontally
scene.add(player);
player.position.set(0, 0, 0);

// === SYSTEM CENTER MARKER GEOMETRY ===
// The world is divided into 200x200 (X/Z) regions/sectors — see
// generateNewRegionContent(), which uses this same grid — and each one has
// its own "center" (e.g. that sector's sun/star) for navigation-indicator
// purposes: anchorX = regionX*200 + 100, anchorZ = regionZ*200 + 100.

// Compass hex frames moved to 2D minimap (see updateMinimap)

// ---- Region-center beacon (visible satellite with blinking red light) ----
// A satellite model placed at the exact center of the current 200x200 region.
// The triangle compass always points to it. Assets (resources/farms/stations)
// spawn around this center.
const regionBeacon = createSatellite();
regionBeacon.name = 'regionCenterBeacon';
regionBeacon.scale.set(0.55, 0.55, 0.55); // compact beacon size
scene.add(regionBeacon);

function updateRegionBeacon() {
  // FIXED: Only ONE satellite beacon exists — created at the very first region
  // at New Game start. It never moves or respawns, no matter how far the
  // player travels or how many warps occur. The triangle always points home
  // to this single beacon (and the assets originally generated around it).
}

// ---- Triangle indicator (same size, tip always points at system center) ----
// This lives directly in the scene (not parented to the player) so its own
// orientation can be computed independently of the ship's facing.
const centerTriangleGroup = new THREE.Group();
centerTriangleGroup.name = 'centerTriangle';
centerTriangleGroup.renderOrder = 100; // always render on top of hex plates

{
  const triSize = 5.5; // base scale matching the three flat hex plates
  const triShape = new THREE.Shape();
  // Elongated: tip pulled out to 1.6x while the base half-width is
  // narrowed to 0.45x, so the shape reads as a slender pointer/needle
  // whose long tip is unambiguously the thing aiming at the center,
  // rather than a stubby equilateral triangle.
  triShape.moveTo(0, triSize * 1.6);                    // tip (elongated)
  triShape.lineTo(-triSize * 0.45, -triSize * 0.6);     // base left
  triShape.lineTo(triSize * 0.45, -triSize * 0.6);      // base right
  triShape.closePath();

  const triGeo = new THREE.ShapeGeometry(triShape);
  // The shape above is drawn flat in the XY plane with its tip toward +Y.
  // Bake a rotation into the geometry itself (unambiguous, unlike stacking
  // mesh.rotation.x/z Euler values) so the tip ends up on local +Z instead
  // — that's the axis updateCenterTriangle() aims at the region beacon.
  triGeo.rotateX(Math.PI / 2);

  const triMat = new THREE.MeshBasicMaterial({
    color: 0xffaa00,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
    depthTest: false,
    depthWrite: false
  });
  const triMesh = new THREE.Mesh(triGeo, triMat);
  centerTriangleGroup.add(triMesh);

  // Thin outline so the triangle reads clearly against the starfield.
  const triEdges = new THREE.EdgesGeometry(triGeo);
  const triLineMat = new THREE.LineBasicMaterial({ 
    color: 0xffaa00, 
    transparent: true, 
    opacity: 0.8,
    depthTest: false,
    depthWrite: false 
  });
  const triLines = new THREE.LineSegments(triEdges, triLineMat);
  centerTriangleGroup.add(triLines);
}

scene.add(centerTriangleGroup);

// Keeps the triangle centered on the player and its tip aimed at the
// regionBeacon — updateRegionBeacon() re-anchors the beacon every frame
// straight from player.position, so it (and the triangle following it)
// re-targets the instant the player crosses a region boundary, not just
// when generateNewRegionContent() happens to run (e.g. on warp).
//
// NOTE: this intentionally does NOT use Object3D.lookAt(). lookAt() builds
// its rotation from a forward vector *and* a world "up" vector (0,1,0), and
// whenever the forward direction is (near-)parallel to that up vector — i.e.
// whenever the player is flying roughly straight above or below the
// beacon — the basis it builds becomes degenerate/skewed instead of a clean
// rotation. Since the triangle is a flat ShapeGeometry, that skew visibly
// warped it out of being a proper triangle. Building the rotation directly
// as the shortest-arc quaternion from the triangle's local +Z (its tip
// axis) to the actual direction-to-beacon avoids the up-vector entirely, so
// it stays a rigid rotation (and a true triangle) at every player position.
const _triFwd = new THREE.Vector3(0, 0, 1);
const _triDir = new THREE.Vector3();
let _triTargetQuat = new THREE.Quaternion();
function updateCenterTriangle() {
  updateRegionBeacon();
  centerTriangleGroup.position.copy(player.position);

  // Full 3D direction (not flattened)
  _triDir.copy(regionBeacon.position).sub(player.position);
  if (_triDir.lengthSq() < 1e-8) return;
  _triDir.normalize();
  _triTargetQuat.setFromUnitVectors(_triFwd, _triDir);
  // Smooth slerp to prevent snapping/jitter when crossing region boundaries or turning
  centerTriangleGroup.quaternion.slerp(_triTargetQuat, 0.18);
}

// === RESOURCES ===
const resources = [];
const spaceCows = []; 
const resourceTypes = [
  { type: 'o2',    color: 0x00ff88, label: 'O₂' },
  { type: 'h2o',   color: 0x4488ff, label: 'H₂O' },
  { type: 'fuel',  color: 0xff4444, label: 'FUEL' }
];

function createResource(typeIndex) {
  const dataIdx = typeIndex !== undefined
    ? typeIndex % resourceTypes.length
    : Math.floor(Math.random() * resourceTypes.length);
  const data = resourceTypes[dataIdx];
  const group = new THREE.Group();

  const geo = new THREE.BoxGeometry(1.1, 1.1, 1.1);
  const mat = new THREE.MeshPhongMaterial({
    color: data.color,
    emissive: data.color,
    emissiveIntensity: 0.9,
    shininess: 4
  });
  const mesh = new THREE.Mesh(geo, mat);
  group.add(mesh);

  const glowGeo = new THREE.BoxGeometry(2.2, 2.2, 2.2);
  const glowMat = new THREE.MeshBasicMaterial({
    color: data.color,
    transparent: true,
    opacity: 0.12,
    blending: THREE.AdditiveBlending
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  group.add(glow);

  const light = new THREE.PointLight(data.color, 1.2, 25);
  group.add(light);

  group.userData = { type: data.type, collected: false };
  return group;
}

// === ASTEROIDS ===
const asteroids = [];
function createAsteroid(seededSize) {
  return createEnhancedAsteroid(seededSize);
}

const landmarks = [];

// === SPECIAL SALVAGE ITEMS ===
const specialItemTypes = [
  { type: 'co2_scrubber',   label: 'CO₂ Scrubber',   icon: '🌀', color: 0x55ddcc },
  { type: 'water_recycler', label: 'Water Recycler', icon: '💧', color: 0x3399ff },
  { type: 'solar_charger',  label: 'Solar Charger',  icon: '☀️', color: 0xffcc33 },
  { type: 'bio_recycler',   label: 'Bio-Recycler',   icon: '🌿', color: 0x55dd55 }
];
const NORMAL_SPECIAL_COUNT = specialItemTypes.length;

specialItemTypes.push({ type: 'space_cow', label: 'Space Cow', icon: '🐄', color: 0xffffff, legendary: true });
specialItemTypes.push({ type: 'escort_disk', label: 'Escort Catalogue Data Disk', icon: '📡', color: 0x4488ff, legendary: true });
let shipComponents = { co2_scrubber: 0, water_recycler: 0, solar_charger: 0, bio_recycler: 0, space_cow: 0, escort_disk: 0 };

function createSpecialItem(idx) {
  const data = specialItemTypes[idx % specialItemTypes.length];
  const group = new THREE.Group();

  const geo = new THREE.OctahedronGeometry(0.85, 0);
  const mat = new THREE.MeshPhongMaterial({
    color: data.color,
    emissive: data.color,
    emissiveIntensity: 1.0,
    shininess: 50
  });
  const mesh = new THREE.Mesh(geo, mat);
  group.add(mesh);

  const edgeGeo = new THREE.EdgesGeometry(geo);
  const edgeMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
  group.add(new THREE.LineSegments(edgeGeo, edgeMat));

  const glowGeo = new THREE.SphereGeometry(1.7, 16, 16);
  const glowMat = new THREE.MeshBasicMaterial({
    color: data.color, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending
  });
  group.add(new THREE.Mesh(glowGeo, glowMat));

  const light = new THREE.PointLight(data.color, 1.4, 22);
  group.add(light);

  group.userData = { type: 'special', specialType: data.type, label: data.label, icon: data.icon, collected: false };
  return group;
}

function createSpaceCow() {
  const group = new THREE.Group();

  const whiteMat = new THREE.MeshPhongMaterial({ color: 0xf5f5f5, shininess: 15, emissive: 0x222222 });
  const blackMat = new THREE.MeshPhongMaterial({ color: 0x181818, shininess: 15, emissive: 0x080808 });
  const pinkMat  = new THREE.MeshPhongMaterial({ color: 0xffb6c1, shininess: 30 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.3, 1.2), whiteMat);
  group.add(body);

  const patch1 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.55, 1.24), blackMat);
  patch1.position.set(-0.5, 0.3, 0);
  group.add(patch1);
  const patch2 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.5, 1.24), blackMat);
  patch2.position.set(0.55, -0.25, 0);
  group.add(patch2);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.7, 0.7), whiteMat);
  head.position.set(1.55, 0.15, 0);
  group.add(head);

  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 0.6), pinkMat);
  snout.position.set(1.95, -0.05, 0);
  group.add(snout);

  const earGeo = new THREE.BoxGeometry(0.1, 0.3, 0.35);
  const earL = new THREE.Mesh(earGeo, blackMat);
  earL.position.set(1.4, 0.45, 0.45);
  group.add(earL);
  const earR = earL.clone();
  earR.position.z = -0.45;
  group.add(earR);

  const hornGeo = new THREE.ConeGeometry(0.07, 0.35, 6);
  const hornMat = new THREE.MeshPhongMaterial({ color: 0xddddcc, shininess: 40 });
  const hornL = new THREE.Mesh(hornGeo, hornMat);
  hornL.position.set(1.5, 0.65, 0.22);
  hornL.rotation.z = -0.3;
  group.add(hornL);
  const hornR = hornL.clone();
  hornR.position.z = -0.22;
  hornR.rotation.x = 0.3;
  group.add(hornR);

  const legGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.75, 6);
  const legPositions = [
    [-0.7, -0.95, 0.45], [-0.7, -0.95, -0.45],
    [0.65, -0.95, 0.45], [0.65, -0.95, -0.45]
  ];
  legPositions.forEach(p => {
    const leg = new THREE.Mesh(legGeo, whiteMat);
    leg.position.set(p[0], p[1], p[2]);
    group.add(leg);
  });

  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.7, 6), whiteMat);
  tail.position.set(-1.15, 0.1, 0);
  tail.rotation.z = 1.0;
  group.add(tail);

  const glowGeo = new THREE.SphereGeometry(2.4, 16, 16);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0xffe6f5, transparent: true, opacity: 0.10, blending: THREE.AdditiveBlending
  });
  group.add(new THREE.Mesh(glowGeo, glowMat));

  const light = new THREE.PointLight(0xffd9ec, 1.1, 18);
  light.position.set(0, 0.3, 0);
  group.add(light);

  group.userData = {
    type: 'special', specialType: 'space_cow', label: 'Space Cow', icon: '🐄',
    collected: false, spaceCow: true,
    bobPhase: Math.random() * Math.PI * 2,
    spinAxis: new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).normalize(),
    baseY: 0
  };
  return group;
}


// ==================== DESTRUCTIBLE SYSTEM ====================

class Destructible {
  constructor(mesh, hp = 3) {
    this.mesh    = mesh;
    this.hp      = hp;
    this.maxHp   = hp;
    this.dead    = false;
    this.flashTimer = 0;
    scene.add(mesh);
  }

  hit(damage = 1) {
    if (this.dead) return;
    this.hp -= damage;
    this.flashTimer = 0.12;
    if (this.hp <= 0) this.destroy();
  }

  destroy() {
    this.dead = true;
    this.spawnDebris();
    scene.remove(this.mesh);
    this.onDestroy();
  }

  spawnDebris() {
    const debrisCount = 4 + Math.floor(Math.random() * 4);
    for (let i = 0; i < debrisCount; i++) {
      const size = 0.12 + Math.random() * 0.28;
      const geo  = new THREE.BoxGeometry(size, size, size);
      const mat  = new THREE.MeshPhongMaterial({ color: this.debrisColor || 0x888888, flatShading: true });
      const d    = new THREE.Mesh(geo, mat);
      d.position.copy(this.mesh.position);
      d.userData.vel = new THREE.Vector3(
        (Math.random()-0.5)*6, (Math.random()-0.5)*6, (Math.random()-0.5)*6
      );
      d.userData.life = 1.5 + Math.random();
      d.userData.isDebris = true;
      scene.add(d);
      debrisPieces.push(d);
    }
  }

  update(delta) {
    if (this.dead) return;
    this.flashTimer = Math.max(0, this.flashTimer - delta);
    if (this.flashTimer > 0) {
      this.mesh.traverse(c => { if (c.isMesh && c.material.emissive) c.material.emissiveIntensity = 3.0; });
    } else {
      this.mesh.traverse(c => { if (c.isMesh && c.material.emissive) c.material.emissiveIntensity = this.baseEmissive || 0.6; });
    }
  }

  onDestroy() {} // override in subclasses
}

// Debris pieces array (global)
const debrisPieces = [];

function updateDebris(delta) {
  for (let i = debrisPieces.length - 1; i >= 0; i--) {
    const d = debrisPieces[i];
    d.position.addScaledVector(d.userData.vel, delta);
    d.userData.vel.multiplyScalar(0.94);
    d.userData.life -= delta;
    d.rotation.x += delta * 3;
    d.rotation.y += delta * 2;
    if (d.userData.life <= 0) {
      scene.remove(d);
      debrisPieces.splice(i, 1);
    }
  }
}

// ==================== SPACE MINE ====================

const spaceMines = []; // active SpaceMine instances

class SpaceMine extends Destructible {
  constructor(position) {
    const group = new THREE.Group();

    const coreGeo = new THREE.IcosahedronGeometry(0.55, 0);
    const coreMat = new THREE.MeshPhongMaterial({ color: 0x222222, emissive: 0xff2200, emissiveIntensity: 0.5, shininess: 20, flatShading: true });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    // Spikes
    const spikeGeo = new THREE.ConeGeometry(0.08, 0.6, 5);
    const spikeMat = new THREE.MeshPhongMaterial({ color: 0x333333, shininess: 30 });
    const spikeOffsets = [
      [0,1,0],[0,-1,0],[1,0,0],[-1,0,0],[0,0,1],[0,0,-1],
      [0.7,0.7,0],[-0.7,0.7,0],[0.7,-0.7,0],[-0.7,-0.7,0]
    ];
    spikeOffsets.forEach(([x,y,z]) => {
      const spike = new THREE.Mesh(spikeGeo, spikeMat);
      const dir = new THREE.Vector3(x,y,z).normalize();
      spike.position.copy(dir.clone().multiplyScalar(0.62));
      spike.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), dir);
      group.add(spike);
    });

    // Warning light
    const warnLight = new THREE.PointLight(0xff2200, 0, 12);
    group.add(warnLight);

    group.position.copy(position);
    super(group, 2);
    this.baseEmissive = 0.5;
    this.debrisColor  = 0x333333;
    this.warnLight    = warnLight;
    this.warnPhase    = Math.random() * Math.PI * 2;
    this.armTimer     = 1.5; // arm delay
    this.armed        = false;
    this.explodeRadius = 7;

    // Rare space mine boss (dragon) - play dragon song on show up
    if (Math.random() < 0.05) {
      this.isBoss = true;
      this.hp = 12;
      this.explodeRadius = 12;
      playDragonSong();
    }
  }

  update(delta) {
    super.update(delta);
    if (this.dead) return;

    if (!this.armed) {
      this.armTimer -= delta;
      if (this.armTimer <= 0) this.armed = true;
    }

    this.warnPhase += delta * (this.armed ? 6 : 2);
    const pulse = Math.max(0, Math.sin(this.warnPhase));
    this.warnLight.intensity = pulse * (this.armed ? 3 : 1);

    if (this.armed) {
      const dist = this.mesh.position.distanceTo(player.position);
      if (dist < this.explodeRadius) {
        this.explode();
      }
      // Laser hit check
      if (laserState === 'bursting') {
        const muzzleWorld = new THREE.Vector3(0,-0.35,3.25).applyMatrix4(player.matrixWorld);
        const rayDir = new THREE.Vector3(0,0,1).applyQuaternion(player.quaternion).normalize();
        const toMine = this.mesh.position.clone().sub(muzzleWorld);
        const along  = toMine.dot(rayDir);
        if (along > 0 && along < LASER_BEAM_LENGTH) {
          const perp = toMine.clone().sub(rayDir.clone().multiplyScalar(along)).length();
          if (perp < 1.4) this.hit(1);
        }
      }
    }
  }

  explode() {
    // Damage player
    oxygen = Math.max(0, oxygen - 22);
    fuel   = Math.max(0, fuel   - 12);
    const knock = player.position.clone().sub(this.mesh.position).normalize().multiplyScalar(3);
    player.userData.velocity.add(knock);
    showLootToast('💥 MINE DETONATED — HULL BREACH');
    if (navigator.vibrate) navigator.vibrate([50, 30, 80]); // haptic explode
    // Collision bump + explosion sounds for mines
    playBeep(250, 0.08, 'square', 0.22); // bump on hit/collision
    playBeep(60, 0.5, 'sine', 0.22);   // explosion
    // Big flash
    const flash = new THREE.PointLight(0xff4400, 12, 35);
    flash.position.copy(this.mesh.position);
    scene.add(flash);
    setTimeout(() => scene.remove(flash), 200);
    this.destroy();
  }

  onDestroy() {
    const idx = spaceMines.indexOf(this);
    if (idx !== -1) spaceMines.splice(idx, 1);
  }
}

function spawnMine(position) {
  const mine = new SpaceMine(position);
  spaceMines.push(mine);
}

function updateMines(delta) {
  // iterate copy since explode() can mutate array
  [...spaceMines].forEach(m => m.update(delta));
}

// ==================== RESOURCE FARMS ====================

const resourceFarms = []; // active ResourceFarm instances

const farmTypes = [
  { resource: 'o2',   label: 'O₂ Farm',    color: 0x00ff88, emissive: 0x00cc44, icon: '🌿', yieldAmount: 22, yieldInterval: 8  },
  { resource: 'h2o',  label: 'H₂O Farm',   color: 0x4488ff, emissive: 0x224488, icon: '💧', yieldAmount: 20, yieldInterval: 9  },
  { resource: 'food', label: 'Food Farm',   color: 0xff8800, emissive: 0x883300, icon: '🌾', yieldAmount: 22, yieldInterval: 10 },
  { resource: 'fuel', label: 'Fuel Farm',   color: 0xff3333, emissive: 0x881111, icon: '⛽', yieldAmount: 20, yieldInterval: 11 },
];

class ResourceFarm extends Destructible {
  constructor(farmTypeIndex, position) {
    const data = farmTypes[farmTypeIndex % farmTypes.length];
    const group = new THREE.Group();

    // Base structure — hexagonal platform
    const baseGeo = new THREE.CylinderGeometry(1.6, 1.9, 0.4, 6);
    const baseMat = new THREE.MeshPhongMaterial({ color: 0x333344, shininess: 10 });
    group.add(new THREE.Mesh(baseGeo, baseMat));

    // Core drum
    const drumGeo = new THREE.CylinderGeometry(0.7, 0.7, 2.4, 8);
    const drumMat = new THREE.MeshPhongMaterial({ color: data.color, emissive: data.emissive, emissiveIntensity: 0.6, shininess: 30 });
    const drum = new THREE.Mesh(drumGeo, drumMat);
    drum.position.y = 1.4;
    group.add(drum);

    // Antennae
    for (let i = 0; i < 3; i++) {
      const antGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.2, 5);
      const antMat = new THREE.MeshPhongMaterial({ color: 0xaaaaaa });
      const ant    = new THREE.Mesh(antGeo, antMat);
      const angle  = (i / 3) * Math.PI * 2;
      ant.position.set(Math.cos(angle)*1.0, 2.8, Math.sin(angle)*1.0);
      group.add(ant);
    }

    // Rotating collection ring
    const ringGeo = new THREE.TorusGeometry(1.2, 0.12, 6, 14);
    const ringMat = new THREE.MeshPhongMaterial({ color: data.color, emissive: data.emissive, emissiveIntensity: 0.9 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 1.4;
    group.add(ring);

    // Glow light
    const glow = new THREE.PointLight(data.color, 1.8, 22);
    glow.position.y = 1.4;
    group.add(glow);

    // Edge outline
    const edgeGeo = new THREE.EdgesGeometry(baseGeo);
    const edgeMat = new THREE.LineBasicMaterial({ color: data.color, transparent: true, opacity: 0.4 });
    group.add(new THREE.LineSegments(edgeGeo, edgeMat));

    group.position.copy(position);
    super(group, 5); // 5 hits to destroy
    this.farmData    = data;
    this.ring        = ring;
    this.glow        = glow;
    this.yieldTimer  = 0;
    this.baseEmissive = 0.6;
    this.debrisColor  = data.color;
    this.farmTypeIndex = farmTypeIndex;
    this.interactSoundPlayed = false;
  }

  update(delta) {
    super.update(delta);
    if (this.dead) return;

    // Spin ring
    this.ring.rotation.y += delta * 1.2;
    this.ring.rotation.x  = Math.sin(Date.now() * 0.0008) * 0.4;

    // Pulse glow
    this.glow.intensity = 1.5 + Math.sin(Date.now() * 0.003) * 0.5;

    // Farm interaction sound (happy chime when player approaches)
    const dist = this.mesh.position.distanceTo(player.position);
    if (dist < 8 && !this.interactSoundPlayed) {
      playBeep(550, 0.12, 'sine', 0.2); // farm interaction chime
      this.interactSoundPlayed = true;
      setTimeout(() => { if (this) this.interactSoundPlayed = false; }, 5000);
    }

    // Proximity auto-yield to player
    const dist2 = this.mesh.position.distanceTo(player.position);
    if (dist2 < 8) {
      this.yieldTimer += delta;
      if (this.yieldTimer >= this.farmData.yieldInterval) {
        this.yieldTimer = 0;
        this.yieldToPlayer();
      }
    }

    // Laser destruction
    if (laserState === 'bursting') {
      const muzzleWorld = new THREE.Vector3(0,-0.35,3.25).applyMatrix4(player.matrixWorld);
      const rayDir = new THREE.Vector3(0,0,1).applyQuaternion(player.quaternion).normalize();
      const toFarm = this.mesh.position.clone().sub(muzzleWorld);
      const along  = toFarm.dot(rayDir);
      if (along > 0 && along < LASER_BEAM_LENGTH) {
        const perp = toFarm.clone().sub(rayDir.clone().multiplyScalar(along)).length();
        if (perp < 2.5) this.hit(1);
      }
    }
  }

  yieldToPlayer() {
    const res = this.farmData.resource;
    const amt = this.farmData.yieldAmount;
    if (res === 'o2')   oxygen = Math.min(100, oxygen + amt);
    if (res === 'h2o')  water  = Math.min(100, water  + amt);
    if (res === 'food') food   = Math.min(100, food   + amt);
    if (res === 'fuel') fuel   = Math.min(100, fuel   + amt);
    showLootToast(this.farmData.icon + ' ' + this.farmData.label.toUpperCase() + ': +' + amt + ' ' + res.toUpperCase());

    // Drop grow plate once on first approach
    if (!this.droppedPlate) {
      this.droppedPlate = true;
      const plateIdx = GROW_PLATE_IDX[res];
      // Only give if player doesn't already have one for this resource
      const alreadyHas = patchBaySlots.some(s => s.itemType === plateIdx);
      if (!alreadyHas) {
        const emptyBay = patchBaySlots.find(s => s.count === 0);
        if (emptyBay) {
          emptyBay.itemType = plateIdx;
          emptyBay.count    = 1;
          emptyBay.powered  = false;
          const plateName = lootItemTypes[plateIdx].label;
          showLootToast('🎁 FARM BONUS: ' + plateName.toUpperCase() + ' — PLUG IT IN AT THE PATCH BAY TO REDUCE ' + res.toUpperCase() + ' DRAIN');
        } else {
          showLootToast('🎁 FARM BONUS AVAILABLE, BUT PATCH BAY IS FULL');
        }
      }
    }

    if (inventoryOpen) renderInventory();
  }

  onDestroy() {
    showLootToast('💥 ' + this.farmData.label.toUpperCase() + ' DESTROYED');
    const idx = resourceFarms.indexOf(this);
    if (idx !== -1) resourceFarms.splice(idx, 1);
  }
}

function spawnFarm(typeIndex, position) {
  const farm = new ResourceFarm(typeIndex, position);
  resourceFarms.push(farm);
}

function updateFarms(delta) {
  [...resourceFarms].forEach(f => f.update(delta));
}

// ==================== PINK STATIONS ====================
// Asteroid-and-farm hybrid space stations, magenta/pink themed. Unlike the
// player's own Cargo Hold / Patch Bay, each station has its own independent
// storage that the player can stash cargo into and withdraw from. Locations
// are CALCULATED (a pure function of sector coordinates), not randomly
// rolled — the same sector always either has a station or doesn't, every
// time it's generated. Station contents are saved with the player's save file.

const STATION_CARGO_SLOT_COUNT     = 16;
const STATION_PATCH_BAY_COUNT      = 3; // number of independent patch bays
const STATION_PATCH_BAY_SLOT_COUNT = 8; // slots per bay
const STATION_DOCK_RANGE           = 11;

// Resource reservoir — the station passively farms o2/h2o/food/fuel into
// its own storage over time, then tops up the player's vitals from that
// storage whenever the player is within range (no docking required).
const STATION_RESOURCE_MAX   = 200;
const STATION_FARM_RATE      = { o2: 0.4,  h2o: 0.35, food: 0.3,  fuel: 0.25 }; // per second, passive
const STATION_TOPUP_RATE     = { o2: 3.0,  h2o: 2.6,  food: 2.2,  fuel: 2.0  }; // per second, to player
const STATION_TOPUP_RANGE    = STATION_DOCK_RANGE;
const STATION_RESOURCE_TYPES = ['o2', 'h2o', 'food', 'fuel'];

function getPlayerResource(res) {
  if (res === 'o2')   return oxygen;
  if (res === 'h2o')  return water;
  if (res === 'food') return food;
  if (res === 'fuel') return fuel;
  return 0;
}
function setPlayerResource(res, val) {
  if (res === 'o2')        oxygen = val;
  else if (res === 'h2o')  water  = val;
  else if (res === 'food') food   = val;
  else if (res === 'fuel') fuel   = val;
}

function regionHasStation(regionX, regionZ) {
  // Deterministic calculated placement — roughly 1 in 11 sectors.
  return Math.abs(regionX * 7 + regionZ * 13) % 11 === 0;
}
function stationKey(rx, rz) { return rx + ',' + rz; }

// Every station's contents, keyed by sector ("x,z") — persists for the
// whole save, independent of which sector the player is currently in.
let stationStorage = {};

function makeStationPatchBays() {
  return Array(STATION_PATCH_BAY_COUNT).fill().map(() =>
    Array(STATION_PATCH_BAY_SLOT_COUNT).fill().map((_, i) => ({ id: i, itemType: null, count: 0, powered: false }))
  );
}

// Upgrades older saves (single 3-slot bay, no resource reservoir) to the
// current layout, carrying over any modules that were already plugged in.
function migrateStationStorage(storage) {
  if (!storage.patchBays) {
    storage.patchBays = makeStationPatchBays();
    if (storage.patchBay) {
      storage.patchBay.forEach(s => {
        if (s.itemType === null || s.count <= 0) return;
        for (const bay of storage.patchBays) {
          const empty = bay.find(b => b.count === 0);
          if (empty) {
            empty.itemType = s.itemType;
            empty.count    = s.count;
            empty.powered  = s.powered || false;
            break;
          }
        }
      });
      delete storage.patchBay;
    }
  }
  if (!storage.resources) {
    storage.resources = { o2: 50, h2o: 50, food: 50, fuel: 50 };
  }
  return storage;
}

function getStationStorage(key) {
  if (!stationStorage[key]) {
    stationStorage[key] = {
      cargo:     Array(STATION_CARGO_SLOT_COUNT).fill().map((_, i) => ({ id: i, itemType: null, count: 0 })),
      patchBays: makeStationPatchBays(),
      resources: { o2: 50, h2o: 50, food: 50, fuel: 50 }
    };
  }
  return migrateStationStorage(stationStorage[key]);
}

const pinkStations   = []; // active PinkStation instances in the current sector
let nearStation       = null; // station currently within docking range, or null
let stationPanelOpen  = false;

class PinkStation {
  constructor(position, key) {
    this.key     = key;
    this.storage = getStationStorage(key);

    const group = new THREE.Group();

    // Asteroid core — same silhouette as a regular asteroid, pink rock instead of grey.
    const coreGeo = new THREE.IcosahedronGeometry(2.3, 1);
    const coreMat = new THREE.MeshPhongMaterial({
      color: 0xff3fa4, flatShading: true, shininess: 10,
      emissive: 0x550030, emissiveIntensity: 0.35
    });
    group.add(new THREE.Mesh(coreGeo, coreMat));

    // Farm-style hex collar bolted onto the rock
    const collarGeo = new THREE.CylinderGeometry(2.1, 2.4, 0.5, 6);
    const collarMat = new THREE.MeshPhongMaterial({ color: 0x551133, shininess: 20 });
    const collar = new THREE.Mesh(collarGeo, collarMat);
    collar.position.y = -0.3;
    group.add(collar);

    // 3 docked cargo pods — visualizes the station's 3 Patch Bays
    const podMat = new THREE.MeshPhongMaterial({ color: 0xff77c2, emissive: 0xff1f8f, emissiveIntensity: 0.7, shininess: 40 });
    this.pods = [];
    for (let i = 0; i < STATION_PATCH_BAY_COUNT; i++) {
      const pod = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.95), podMat.clone());
      const angle = (i / STATION_PATCH_BAY_COUNT) * Math.PI * 2;
      pod.position.set(Math.cos(angle) * 2.7, 0.35, Math.sin(angle) * 2.7);
      pod.lookAt(0, 0.35, 0);
      group.add(pod);
      this.pods.push(pod);
    }

    // Rotating collection ring, mirrors the resource farms
    const ringGeo = new THREE.TorusGeometry(3.0, 0.1, 6, 16);
    const ringMat = new THREE.MeshPhongMaterial({ color: 0xff66cc, emissive: 0xff1f8f, emissiveIntensity: 0.9 });
    this.ring = new THREE.Mesh(ringGeo, ringMat);
    group.add(this.ring);

    // Glow + beacon light
    this.glow = new THREE.PointLight(0xff3fa4, 2.0, 32);
    group.add(this.glow);

    const edgeGeo = new THREE.EdgesGeometry(coreGeo);
    const edgeMat = new THREE.LineBasicMaterial({ color: 0xffaadd, transparent: true, opacity: 0.5 });
    group.add(new THREE.LineSegments(edgeGeo, edgeMat));

    group.position.copy(position);
    this.mesh = group;
    scene.add(group);
  }

  update(delta) {
    this.ring.rotation.x += delta * 0.5;
    this.ring.rotation.y += delta * 0.3;
    this.glow.intensity = 1.7 + Math.sin(Date.now() * 0.002) * 0.4;
    this.pods.forEach((p, i) => {
      p.material.emissiveIntensity = 0.5 + 0.3 * Math.sin(Date.now() * 0.003 + i);
    });
    this.updateResources(delta);
  }

  // Passively farms o2/h2o/food/fuel into the station's own reservoir,
  // then drains that reservoir to top up the player's vitals whenever
  // the player is within range — no docking required.
  updateResources(delta) {
    const res = this.storage.resources;

    const diffMult = currentDifficulty === 'easy' ? 1.5 : currentDifficulty === 'hard' ? 0.6 : 1.0;
    const solarStation = (typeof storage !== 'undefined' && storage && storage.patchBays)
      ? storage.patchBays.flat().filter(s => s.itemType === 'solar_charger' && s.powered).length
      : 0;
    const moduleBoost = (typeof patchBaySlots !== 'undefined' && patchBaySlots.some(s => s.powered && s.itemType) ? 1.25 : 1.0) * (1 + solarStation * 0.5); // solar in station slot allows extra powered module boost
    const rateMult = diffMult * moduleBoost;

    STATION_RESOURCE_TYPES.forEach(key => {
      res[key] = Math.min(STATION_RESOURCE_MAX, res[key] + STATION_FARM_RATE[key] * delta * rateMult);
    });

    const dist = this.mesh.position.distanceTo(player.position);
    let toppedUp = false;
    if (dist < STATION_TOPUP_RANGE) {
      STATION_RESOURCE_TYPES.forEach(key => {
        const playerVal = getPlayerResource(key);
        if (playerVal < 100 && res[key] > 0) {
          const amount = Math.min(STATION_TOPUP_RATE[key] * delta * rateMult, 100 - playerVal, res[key]);
          if (amount > 0) {
            setPlayerResource(key, playerVal + amount);
            res[key] -= amount;
            toppedUp = true;
            if (navigator.vibrate) navigator.vibrate(15); // haptic station top-up
          }
        }
      });
    }

    this.topupToastTimer = (this.topupToastTimer || 0) + delta;
    if (toppedUp && this.topupToastTimer > 5) {
      this.topupToastTimer = 0;
      showLootToast('🌸 STATION TOPPING UP YOUR VITALS');
      // Elevator music while in station resource range
      playBeep(261,0.5,'sine',0.1);
      setTimeout(()=>playBeep(329,0.5,'sine',0.1),250);
      setTimeout(()=>playBeep(392,0.5,'sine',0.1),500);
    }
    if (stationPanelOpen && nearStation === this) refreshStationResourceBars();
  }
}

function spawnStationIfPresent(regionX, regionZ, anchorX, anchorZ, seedBase) {
  if (!regionHasStation(regionX, regionZ)) return;
  const angle = seededRandom(seedBase + 8500) * Math.PI * 2;
  const dist  = 18 + seededRandom(seedBase + 8501) * 22;
  const pos = new THREE.Vector3(
    anchorX + Math.cos(angle) * dist,
    seededRandom(seedBase + 8502) * 6 - 3,
    anchorZ + Math.sin(angle) * dist
  );
  pinkStations.push(new PinkStation(pos, stationKey(regionX, regionZ)));
}

function updateStations(delta) {
  pinkStations.forEach(s => s.update(delta));

  let closest = null, closestDist = Infinity;
  pinkStations.forEach(s => {
    const d = s.mesh.position.distanceTo(player.position);
    if (d < STATION_DOCK_RANGE && d < closestDist) { closest = s; closestDist = d; }
  });
  if (closest !== nearStation) {
    nearStation = closest;
    const prompt = document.getElementById('station-prompt');
    if (prompt) prompt.style.display = nearStation ? 'block' : 'none';
    if (!nearStation && stationPanelOpen) closeStationPanel();
  }
}

// Move 1 unit of a stacking item (cargo) between two slot arrays of the
// same shape, stacking onto a matching partial stack before using an
// empty slot. Used for player Cargo Hold <-> Station Cargo transfers.
function transferStackable(fromArr, toArr, idx, maxStack) {
  const slot = fromArr[idx];
  if (!slot || slot.count <= 0 || slot.itemType === null) return false;
  const itemType = slot.itemType;
  const existing = toArr.find(s => s.itemType === itemType && s.count > 0 && s.count < maxStack);
  const empty    = toArr.find(s => s.count === 0);
  const target   = existing || empty;
  if (!target) { showLootToast('🚫 NO ROOM AT DESTINATION'); return false; }
  target.itemType = itemType;
  target.count    = Math.min(maxStack, target.count + 1);
  slot.count--;
  if (slot.count <= 0) slot.itemType = null;
  return true;
}

// Like transferModule, but the destination is several Patch Bay arrays
// (the station's 3 bays) — drops into the first bay with a free slot.
function transferModuleToBays(fromArr, idx, bays) {
  const slot = fromArr[idx];
  if (!slot || slot.count <= 0 || slot.itemType === null) return false;
  let empty = null;
  for (const bay of bays) {
    empty = bay.find(s => s.count === 0);
    if (empty) break;
  }
  if (!empty) { showLootToast('🚫 ALL STATION PATCH BAYS FULL'); return false; }
  empty.itemType = slot.itemType;
  empty.count    = 1;
  empty.powered  = false;
  slot.itemType  = null;
  slot.count     = 0;
  slot.powered   = false;
  refreshGrowPlates();
  return true;
}

// Move one physical module between two Patch Bay arrays. Modules always
// arrive unpowered — re-plug them in manually at the destination.
function transferModule(fromArr, toArr, idx) {
  const slot = fromArr[idx];
  if (!slot || slot.count <= 0 || slot.itemType === null) return false;
  const empty = toArr.find(s => s.count === 0);
  if (!empty) { showLootToast('🚫 DESTINATION PATCH BAY FULL'); return false; }
  empty.itemType = slot.itemType;
  empty.count    = 1;
  empty.powered  = false;
  slot.itemType  = null;
  slot.count     = 0;
  slot.powered   = false;
  refreshGrowPlates();
  return true;
}

function createSatellite(seed) {
  return createEnhancedSatellite(seed || Date.now());
}

function createWreck(seed) {
  return createEnhancedWreck(seed);
}

function createSpaceStation() {
  return createEnhancedSpaceStation();
}

function createGrowPlate(type) {
  return createEnhancedGrowFarm(type);
}

// === GAME STATE ===
let oxygen = 85, water = 70, food = 60, fuel = 55;
let keys = {};

// Resource availability flag for HUD/standby display
window.allResourcesAvailable = oxygen > 0 && water > 0 && food > 0 && fuel > 0;

let lastThrustTime = 0;
const doubleTapWindow = 300; 
let isBoosting = false;

let laserState        = 'idle';   
let laserStateTimer    = 0;       
let burstShotsFired    = 0;       
const BURST_SHOT_COUNT = 5;       
const BURST_DURATION   = 1.0;     
const BURST_COOLDOWN   = 1.2;     
const SHOT_FUEL_COST   = 1.4;     
let laserFlashTimer    = 0;       
const LASER_FLASH_TIME = 0.1;
const LASER_BEAM_LENGTH = 120;    

// === INVENTORY ===
const inventory = [  
  { name: "O₂ Canisters", icon: "🟢", count: 0, max: 16 },
  { name: "H₂O Tanks",   icon: "🔵", count: 0, max: 16 },
  { name: "Food Rations", icon: "🟠", count: 0, max: 16 },
  { name: "Fuel Cells",   icon: "🔴", count: 0, max: 16 }
];

// === LOOT ITEM TYPES (for Cargo Hold / Patch Bay) ===
const lootItemTypes = [
  { type: 'repair_kit',    label: 'Repair Kit',      icon: '🔧', color: '#fa0',  effect: () => { oxygen = Math.min(100, oxygen+8); water = Math.min(100, water+8); } },
  { type: 'ration_pack',   label: 'Ration Pack',     icon: '🍱', color: '#f80',  effect: () => { food = Math.min(100, food+20); } },
  { type: 'fuel_booster',  label: 'Fuel Booster',    icon: '⚡', color: '#ff0',  effect: () => { fuel = Math.min(100, fuel+25); } },
  { type: 'med_kit',       label: 'Med Kit',         icon: '💊', color: '#f44',  effect: () => { oxygen = Math.min(100, oxygen+20); } },
  { type: 'hull_patch',    label: 'Hull Patch',      icon: '🛠️', color: '#8af',  effect: () => { water = Math.min(100, water+20); } },
  { type: 'data_chip',     label: 'Data Chip',       icon: '💾', color: '#0ff',  effect: () => { /* unlocks CLI commands - cosmetic */ showLootToast('💾 DATA CHIP: New CLI commands unlocked'); } },
  { type: 'scrap_metal',   label: 'Scrap Metal',     icon: '🪙', color: '#888',  effect: () => { fuel = Math.min(100, fuel+8); } },
  { type: 'o2_canister',   label: 'O₂ Canister',    icon: '🟢', color: '#0f8',  effect: () => { oxygen = Math.min(100, oxygen+15); } },
  // === GROW PLATES — one per farm type. Installing reduces that resource's drain ===
  { type: 'grow_plate_o2',   label: 'O₂ Grow Plate',   icon: '🌿', color: '#00ff88', isGrowPlate: true, resource: 'o2',   drainReduction: 0.45 },
  { type: 'grow_plate_h2o',  label: 'H₂O Grow Plate',  icon: '💦', color: '#4488ff', isGrowPlate: true, resource: 'h2o',  drainReduction: 0.45 },
  { type: 'grow_plate_food', label: 'Food Grow Plate',  icon: '🌾', color: '#ff8800', isGrowPlate: true, resource: 'food', drainReduction: 0.45 },
  { type: 'grow_plate_fuel', label: 'Fuel Grow Plate',  icon: '⛽', color: '#ff3333', isGrowPlate: true, resource: 'fuel', drainReduction: 0.45 },
  // === SPECIAL MODULES ===
  { type: 'patch_bay_splitter', label: 'Bay Splitter',       icon: '🔀', color: '#cc88ff', isModule: true, isSplitter: true,
    desc: 'Half-slot: adds +2 power plugs', halfSlot: true },
  { type: 'auto_pilot',         label: 'Auto-Pilot',         icon: '🤖', color: '#00ccff', isModule: true, isAutoPilot: true,
    desc: '4× collection range, CLI programmable' },
  { type: 'resource_manager',   label: 'Resource Manager',   icon: '📊', color: '#ffcc00', isModule: true, isResManager: true,
    desc: 'CLI-programmable resource automation' },
  { type: 'hf_synthesizer',     label: 'HF Synthesizer',     icon: '🧪', color: '#ff44ff', isModule: true, isHFSynth: true,
    desc: '3-slot: manufactures headlight fluid', tripleSlot: true },
];

// Indices into lootItemTypes for the four grow plates (appended at end)
const GROW_PLATE_IDX = { o2: 8, h2o: 9, food: 10, fuel: 11 };
// Indices for special modules
const MODULE_IDX = { splitter: 12, autoPilot: 13, resManager: 14, hfSynth: 15 };

// Track which grow plates are installed
const growPlateInstalled = { o2: false, h2o: false, food: false, fuel: false };

// === MODULE STATE ===
// Patch Bay Splitter: installed = uses half a slot, grants +2 power plugs
let splitterInstalled = false;

// Auto-Pilot state
const autoPilot = {
  active: false,          // currently flying toward a target
  enabled: false,         // module powered
  targetPos: null,        // THREE.Vector3 target
  collectRange: 3.2,      // base range; quadrupled when powered
  rules: [],              // CLI-programmable rules [{resource, minPct}]
};

// Resource Manager state
const resManager = {
  enabled: false,
  rules: [],   // [{resource, action, threshold}]  action: 'warn'|'set'
  // resource: 'o2'|'h2o'|'food'|'fuel', threshold: 0-100
};

// HF Synthesizer state
const hfSynth = {
  enabled: false,
  accumulator: 0,  // seconds accumulated toward next HF unit
  // Normal HF loot drop: ~0.2 chance per salvage event, roughly 1 unit per ~5 salvages
  // We model "normal rate" as 1 HF unit per 60s, synthesizer runs at half = 1 per 120s
  RATE_SECONDS: 120,
};

// Recompute which grow plates are installed from patchBaySlots state
function refreshGrowPlates() {
  growPlateInstalled.o2   = false;
  growPlateInstalled.h2o  = false;
  growPlateInstalled.food = false;
  growPlateInstalled.fuel = false;
  splitterInstalled = false;
  autoPilot.enabled = false;
  resManager.enabled = false;
  patchBaySlots.forEach(s => {
    if (s.itemType === null || !s.powered) return;
    const loot = lootItemTypes[s.itemType];
    if (!loot) return;
    if (loot.isGrowPlate) growPlateInstalled[loot.resource] = true;
    if (loot.isSplitter)  splitterInstalled = true;
    if (loot.isAutoPilot) autoPilot.enabled = true;
    if (loot.isResManager) resManager.enabled = true;
    if (loot.isHFSynth)   hfSynth.enabled = true;
  });
}

const CARGO_SLOT_COUNT = 12;
const PATCH_BAY_SLOT_COUNT = 8;
const POWER_PLUGS_BASE = 3; // base cap
function getMaxPowerPlugs() { return POWER_PLUGS_BASE + (splitterInstalled ? 2 : 0); }
// legacy alias kept for any remaining references
const POWER_PLUGS = POWER_PLUGS_BASE;

// Cargo Hold — general loot/consumables (repair kits, rations, etc.)
const cargoSlots = Array(CARGO_SLOT_COUNT).fill().map((_, i) => ({
  id: i,
  itemType: null,   // lootItemTypes index (non-module types)
  count: 0
}));

// Patch Bay — dedicated module bays (grow plates and future modules).
// A module can be physically plugged in (occupies a bay) without being
// powered — powering it draws one of the limited Power Plugs.
const patchBaySlots = Array(PATCH_BAY_SLOT_COUNT).fill().map((_, i) => ({
  id: i,
  itemType: null,   // lootItemTypes index — module types only
  count: 0,
  powered: false
}));

let stationPatchBaySlots = Array(2).fill().map(() => ({ itemType: null, count: 0, powered: false }));

function poweredModuleCount() {
  return patchBaySlots.reduce((n, s) => n + (s.powered ? 1 : 0), 0);
}

const headlightFluidSlots = Array(8).fill().map((_, i) => ({
  id: i,
  count: 0,
  max: 4
}));

let captureTarget = null;   
let captureTimer  = 0;      
const CAPTURE_TIME = 5.0;   

let scanActive = false;
let scanTimestamps = []; 
const SCAN_MAX_PER_MIN = 3;

let inventoryOpen = false;

// Loading screen
const loadingScreen = document.createElement('div');
loadingScreen.style.cssText = `
  position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
  background: rgba(0,5,20,0.95); color: #0ff; font-family: monospace;
  display: none; align-items: center; justify-content: center; flex-direction: column;
  z-index: 200; transition: opacity 0.6s;
`;
loadingScreen.innerHTML = `<div style="font-size:24px;">WARPING TO NEXT REGION...</div><div style="margin-top:20px; font-size:14px; opacity:0.6;">Hold on...</div>`;
document.body.appendChild(loadingScreen);

// === INPUT ===
window.addEventListener('keydown', e => {
  if (!gameActive) return;
  const key = e.key.toLowerCase();
  keys[key] = true;
  lastInputTime = Date.now();

  if (key === 'w' || key === 'arrowup') {
    const now = Date.now();
    if (now - lastThrustTime < doubleTapWindow) {
      isBoosting = true;
    }
    lastThrustTime = now;
  }

  if (key === 'p') {
    inventoryOpen = !inventoryOpen;
    const inv = document.getElementById('inventory');
    inv.style.display = inventoryOpen ? 'block' : 'none';
    if (inventoryOpen) {
      renderInventory();
      if (stationPanelOpen) closeStationPanel();
    }
  }

  if (key === 'o') {
    if (stationPanelOpen) {
      closeStationPanel();
    } else if (nearStation) {
      if (inventoryOpen) {
        inventoryOpen = false;
        document.getElementById('inventory').style.display = 'none';
      }
      openStationPanel();
    }
  }

  if (key === 't') {
    warpToNextRegion();
  }

  if (key === 'f') {
    const flash = player.userData.flashlight;
    if (flash) {
      player.userData.flashlightOn = !player.userData.flashlightOn;
      flash.intensity = player.userData.flashlightOn ? 3.5 : 0;
      const cone = player.userData.spotBeamCone;
      if (cone) cone.material.opacity = player.userData.flashlightOn ? 0.14 : 0;
      // Use headlight-fluid canister: fill all resource bars to max
      const fluidSlot = headlightFluidSlots.find(s => s.count > 0);
      if (fluidSlot) {
        fluidSlot.count--;
        oxygen = water = food = fuel = 100;
        if (inventoryOpen) renderInventory();
      }
    }
  }

  if (key === 'g') {
    const scanOverlay = document.getElementById('scan-overlay');
    if (scanOverlay.style.display !== 'none') {
      scanOverlay.style.display = 'none';
      scanActive = false;
    } else {
      scanNextRegion();
    }
  }

  if (key === 'm' || key === 'escape') {
    const menu = document.getElementById('main-menu');
    const crtCanvas = document.getElementById('crt-overlay');
    const isMenuOpen = menu.style.display !== 'none';
    if (isMenuOpen) {
      // Resume game
      menu.style.display = 'none';
      document.getElementById('ingame-stats').style.display = 'flex';
      if (crtCanvas) crtCanvas.style.display = 'block';
      if (window.gameCanvas) window.gameCanvas.style.display = 'block';
      gameActive = true;
    } else {
      // Pause and show menu
      gameActive = false;
      document.getElementById('ingame-stats').style.display = 'none';
      if (crtCanvas) crtCanvas.style.display = 'none';
      if (window.gameCanvas) window.gameCanvas.style.display = 'none';
      document.getElementById('btn-resume').style.display = 'block';
      updateMenuPlaytime();
      menu.style.display = 'flex';
      startStationTheme(); // play lo-fi chill theme on menu
    }
    return;
  }

  if (key === '`' || e.key === '`' || e.key === '~') {
    e.preventDefault();
    const cli = document.getElementById('cli-overlay');
    const isOpen = cli.style.display !== 'none';
    cli.style.display = isOpen ? 'none' : 'flex';
    cli.style.flexDirection = 'column';
    if (!isOpen) {
      setTimeout(() => document.getElementById('cli-input').focus(), 50);
      cliPrint('HEADLIGHT-FLUID TERMINAL v1.0 — type \'help\' for commands');
    }
    return;
  }

  if (key === ' ') {
    e.preventDefault();
    player.userData.velocity.set(0, 0, 0);
    isBoosting = false;
  }

  if (e.key === 'Control') e.preventDefault();
});

window.addEventListener('keyup', e => {
  const key = e.key.toLowerCase();
  keys[key] = false;
  if ((key === 'w' || key === 'arrowup') && !keys['w'] && !keys['arrowup']) {
    isBoosting = false;
  }
});

// === GAMEPAD CONTROLLER (finalised) ===
let gamepadEnabled = true;
function updateGamepad() {
  if (!gamepadEnabled) return;
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  const gp = pads[0];
  if (!gp) return;
  // Left stick X = yaw (A/D), Y = pitch (I/K)
  const yaw = gp.axes[0] || 0;
  keys['a'] = yaw < -0.25;
  keys['d'] = yaw > 0.25;
  const pitch = gp.axes[1] || 0;
  keys['i'] = pitch < -0.25;
  keys['k'] = pitch > 0.25;
  // Right stick Y = forward/backward thrust (W/S)
  const rightY = gp.axes[3] || 0;
  if (Math.abs(rightY) > 0.3) {
    if (rightY < -0.3) keys['s'] = true;  // Pull back = backward thrust (toward camera)
    if (rightY > 0.3) keys['w'] = true;   // Push forward = forward thrust (away from camera)
  }
  // A button = warp (T)
  keys['t'] = !!(gp.buttons[0] && gp.buttons[0].pressed);
  // Y button = scan (G)
  keys['g'] = !!(gp.buttons[3] && gp.buttons[3].pressed);
  // R trigger button = laser (CTRL)
  keys['control'] = !!(gp.buttons[7] && gp.buttons[7].pressed);
  // B button = inventory (P) or station dock (O) if in range
  if (nearStation) {
    keys['o'] = !!(gp.buttons[1] && gp.buttons[1].pressed);
  } else {
    keys['p'] = !!(gp.buttons[1] && gp.buttons[1].pressed);
  }
  // X button = stop/brake (SPACE)
  keys[' '] = !!(gp.buttons[2] && gp.buttons[2].pressed);
  // Home button (16) = menu (M)
  keys['m'] = !!(gp.buttons[16] && gp.buttons[16].pressed);
}

// Legacy tap-anywhere touch gestures removed — superseded by the dedicated
// on-screen joystick/button controls in touch-controls.js, which would
// otherwise conflict (e.g. auto-opening the station panel on every tap
// near a station while the player is trying to steer).

// === MINIMAP ===
const minimap = document.getElementById('minimap');
const ctx = minimap ? minimap.getContext('2d') : null;

function updateMinimap() {
  ctx.fillStyle = 'rgba(0,10,30,0.9)';
  ctx.fillRect(0, 0, 160, 160);

  // Simple 3D-style grid (perspective feel)
  ctx.strokeStyle = 'rgba(0,255,255,0.25)';
  ctx.lineWidth = 1;
  const gridStep = 18;
  for (let x = -80; x <= 80; x += gridStep) {
    ctx.beginPath();
    ctx.moveTo(80 + x, 10);
    ctx.lineTo(80 + x * 0.6, 150);
    ctx.stroke();
  }
  for (let z = -80; z <= 80; z += gridStep) {
    ctx.beginPath();
    ctx.moveTo(10, 80 + z);
    ctx.lineTo(150, 80 + z * 0.6);
    ctx.stroke();
  }

  ctx.strokeStyle = '#0ff';
  ctx.lineWidth = 2;
  ctx.strokeRect(4, 4, 152, 152);

  const cx = 80, cy = 80;
  const mapScale = 1.1;
  const viewRange = 55;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-player.rotation.y);
  ctx.fillStyle = '#0f0';
  ctx.beginPath();
  ctx.moveTo(0, -9);
  ctx.lineTo(-6, 7);
  ctx.lineTo(6, 7);
  ctx.fill();
  ctx.restore();

  resources.forEach(r => {
    const dx = r.position.x - player.position.x;
    const dz = r.position.z - player.position.z;
    if (Math.hypot(dx, dz) > viewRange) return;

    const mx = cx + dx * mapScale;
    const my = cy + dz * mapScale;
    const col = r.userData.type === 'o2' ? '#0f8'
              : r.userData.type === 'h2o' ? '#48f'
              : r.userData.type === 'special' ? '#ff0'
              : '#f44';
    ctx.fillStyle = col;
    ctx.fillRect(mx - 3, my - 3, 6, 6);
  });

  ctx.fillStyle = '#888';
  asteroids.forEach(a => {
    const dx = a.position.x - player.position.x;
    const dz = a.position.z - player.position.z;
    if (Math.hypot(dx, dz) > viewRange) return;
    const mx = cx + dx * mapScale;
    const my = cy + dz * mapScale;
    ctx.beginPath();
    ctx.arc(mx, my, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  landmarks.forEach(l => {
    const dx = l.position.x - player.position.x;
    const dz = l.position.z - player.position.z;
    if (Math.hypot(dx, dz) > viewRange) return;
    const mx = cx + dx * mapScale;
    const my = cy + dz * mapScale;
    ctx.fillStyle = l.userData.kind === 'wreck' ? '#fa4' : '#ccc';
    ctx.beginPath();
    ctx.moveTo(mx, my - 6);
    ctx.lineTo(mx + 6, my);
    ctx.lineTo(mx, my + 6);
    ctx.lineTo(mx - 6, my);
    ctx.closePath();
    ctx.fill();
  });

  // Mines — red X
  spaceMines.forEach(m => {
    if (m.dead) return;
    const dx = m.mesh.position.x - player.position.x;
    const dz = m.mesh.position.z - player.position.z;
    if (Math.hypot(dx, dz) > viewRange) return;
    const mx = cx + dx * mapScale;
    const my = cy + dz * mapScale;
    ctx.strokeStyle = m.armed ? '#f22' : '#f80';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(mx-4,my-4); ctx.lineTo(mx+4,my+4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(mx+4,my-4); ctx.lineTo(mx-4,my+4); ctx.stroke();
  });

  // Farms — coloured diamond
  resourceFarms.forEach(f => {
    if (f.dead) return;
    const dx = f.mesh.position.x - player.position.x;
    const dz = f.mesh.position.z - player.position.z;
    if (Math.hypot(dx, dz) > viewRange) return;
    const mx = cx + dx * mapScale;
    const my = cy + dz * mapScale;
    const col = '#' + f.farmData.color.toString(16).padStart(6,'0');
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(mx, my-5); ctx.lineTo(mx+5,my); ctx.lineTo(mx,my+5); ctx.lineTo(mx-5,my);
    ctx.closePath(); ctx.fill();
  });
  // Pink Stations — magenta ring marker
  pinkStations.forEach(s => {
    const dx = s.mesh.position.x - player.position.x;
    const dz = s.mesh.position.z - player.position.z;
    if (Math.hypot(dx, dz) > viewRange) return;
    const mx = cx + dx * mapScale;
    const my = cy + dz * mapScale;
    ctx.strokeStyle = '#ff3fa4';
    ctx.fillStyle   = '#ff3fa4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(mx, my, 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(mx, my, 2.5, 0, Math.PI * 2);
    ctx.fill();
  });

  // === Compass: three flat hex frames on minimap (centered on player) ===
  const miniHexR = 26;
  ctx.strokeStyle = '#0ff';
  ctx.lineWidth = 1.8;
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + (Date.now() * 0.0003); // subtle slow rotation
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(a);
    ctx.beginPath();
    for (let j = 0; j < 6; j++) {
      const x = Math.cos(j * Math.PI / 3) * miniHexR;
      const y = Math.sin(j * Math.PI / 3) * miniHexR;
      if (j === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  // Blinking center beacon (home satellite) on minimap
  if (regionBeacon && regionBeacon.position) {
    const bdx = regionBeacon.position.x - player.position.x;
    const bdz = regionBeacon.position.z - player.position.z;
    const bmx = cx + bdx * mapScale;
    const bmy = cy + bdz * mapScale;

    const blinkPhase = (Math.sin(Date.now() * 0.009) + 1) * 0.5;
    ctx.fillStyle = `rgba(255,60,60,${0.7 + blinkPhase * 0.3})`;
    ctx.beginPath();
    ctx.arc(bmx, bmy, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#f66';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(bmx, bmy, 7, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// Helper function to update resource dots (5 vertical dots, each dot = 20%)
function updateResourceDots(resourceName, value, maxValue, color) {
  // Calculate number of filled dots (each dot = 20% of max) - 5 dots total
  const totalDots = 5;
  const filledDots = Math.min(totalDots, Math.floor((value / maxValue) * totalDots));

  // Display dots vertically (stacked in a column), highest dot on top
  const dotsContainer = document.getElementById(`isb-${resourceName}-dots`);
  if (!dotsContainer) return;

  dotsContainer.innerHTML = '';

  for (let i = totalDots - 1; i >= 0; i--) {
    const dot = document.createElement('div');
    const isFilled = i < filledDots;
    dot.textContent = isFilled ? '●' : '○';
    dot.style.color = color;
    dot.style.fontSize = '9px';
    dot.style.opacity = isFilled ? '1' : '0.3';
    dot.style.transition = 'opacity 0.2s';
    dotsContainer.appendChild(dot);
  }
}

function updateStandbyImages() {
  const idle = document.getElementById('standby-idle');
  const active = document.getElementById('standby-active');
  if (!idle || !active) return;
  
  // Get selected character's images
  const charData = characterData[selectedCharacter];
  if (charData) {
    idle.src = charData.idle;
    active.src = charData.active;
  }
  
  const menusOpen = inventoryOpen || stationPanelOpen;
  
  // Only show standby images during gameplay (not in menus or main menu)
  // Show active image when ALL resources are available
  // Show idle image when ANY resource is empty
  const showActive = gameActive && window.allResourcesAvailable && !menusOpen;
  const showIdle = gameActive && !window.allResourcesAvailable && !menusOpen;
  
  idle.style.display = showIdle ? 'block' : 'none';
  active.style.display = showActive ? 'block' : 'none';

  // Resource-active / resource-paused readout, shown above the standby images
  const timerEl = document.getElementById('resource-timer-display');
  if (timerEl) {
    const showTimer = gameActive && !menusOpen;
    if (showTimer) {
      timerEl.style.display = 'block';
      timerEl.innerHTML =
        'ACTIVE&nbsp; ' + formatPlaytime(resourceActiveSeconds) +
        '<br>PAUSED&nbsp; ' + formatPlaytime(resourcePausedSeconds);
    } else {
      timerEl.style.display = 'none';
    }
  }
}

function updateHUD() {
  const menusOpen = inventoryOpen || stationPanelOpen;
  const mainMenuVisible = document.getElementById('main-menu').style.display !== 'none';

  // Completely hide ingame-stats HUD when any menu/inventory is open OR when main menu is showing
  const ingameStats = document.getElementById('ingame-stats');
  if (ingameStats) {
    if (menusOpen || mainMenuVisible) {
      ingameStats.style.display = 'none';
      ingameStats.style.visibility = 'hidden';
      ingameStats.style.opacity = '0';
      ingameStats.style.pointerEvents = 'none';
      ingameStats.style.height = '0';
      ingameStats.style.overflow = 'hidden';
      ingameStats.style.position = 'fixed';
      ingameStats.style.bottom = '-1000px'; // Move way off-screen
    } else {
      ingameStats.style.display = 'flex';
      ingameStats.style.visibility = 'visible';
      ingameStats.style.opacity = '1';
      ingameStats.style.pointerEvents = 'auto';
      ingameStats.style.height = 'auto';
      ingameStats.style.overflow = 'visible';
      ingameStats.style.position = 'absolute';
      ingameStats.style.bottom = '0';
    }
  }

  // Hide game canvas and move it off-screen when main menu is visible
  if (window.gameCanvas) {
    if (mainMenuVisible) {
      window.gameCanvas.style.display = 'none';
      window.gameCanvas.style.visibility = 'hidden';
      window.gameCanvas.style.opacity = '0';
      window.gameCanvas.style.pointerEvents = 'none';
      window.gameCanvas.style.position = 'fixed';
      window.gameCanvas.style.top = '-9999px';
      window.gameCanvas.style.left = '-9999px';
    } else {
      window.gameCanvas.style.display = 'block';
      window.gameCanvas.style.visibility = 'visible';
      window.gameCanvas.style.opacity = '1';
      window.gameCanvas.style.pointerEvents = 'none';
      window.gameCanvas.style.position = 'absolute';
      window.gameCanvas.style.top = '0';
      window.gameCanvas.style.left = '0';
    }
  }
  const crtCanvas = document.getElementById('crt-overlay');
  if (crtCanvas) {
    if (mainMenuVisible) {
      crtCanvas.style.display = 'none';
      crtCanvas.style.visibility = 'hidden';
      crtCanvas.style.opacity = '0';
      crtCanvas.style.position = 'fixed';
      crtCanvas.style.top = '-9999px';
      crtCanvas.style.left = '-9999px';
    } else {
      crtCanvas.style.display = 'block';
      crtCanvas.style.visibility = 'visible';
      crtCanvas.style.opacity = '1';
      crtCanvas.style.position = 'fixed';
      crtCanvas.style.top = '0';
      crtCanvas.style.left = '0';
    }
  }

  if (menusOpen) return;

  // === Core resource dots (5 vertical dots above heading, each dot = 20%) ===
  updateResourceDots('o2', oxygen, 100, '#0f8');
  updateResourceDots('h2o', water, 100, '#48f');
  updateResourceDots('food', food, 100, '#fa0');
  updateResourceDots('fuel', fuel, 100, '#f44');

  // Laser charge / status
  const laserVal = document.getElementById('laser-val');
  const laserBar = document.getElementById('laser-charge');
  if (laserVal && laserBar) {
    if (laserState === 'bursting') {
      laserBar.value = (burstShotsFired / BURST_SHOT_COUNT) * 100;
      laserVal.textContent = burstShotsFired + '/' + BURST_SHOT_COUNT;
      laserVal.style.color = '#ff2200';
    } else if (laserState === 'cooldown') {
      const coolPct = Math.max(0, 1 - laserStateTimer / BURST_COOLDOWN) * 100;
      laserBar.value = coolPct;
      laserVal.textContent = 'COOL';
      laserVal.style.color = '#ff8800';
    } else {
      laserBar.value = 0;
      laserVal.textContent = 'RDY';
      laserVal.style.color = '#ff4400';
    }
  }
  
  // Update standby images
  updateStandbyImages();
}

function updateLaser(delta) {
  updateGamepad();
  const wantsFire  = (keys['control'] || keys['controlleft'] || keys['controlright']);
  const beam       = player.userData.beam;
  const laserLight = player.userData.laserLight;

  laserFlashTimer = Math.max(0, laserFlashTimer - delta);
  const flashT = laserFlashTimer / LASER_FLASH_TIME; 
  beam.material.opacity = flashT * 0.95;
  laserLight.intensity  = flashT * 5.0;

  if (laserState === 'idle') {
    if (wantsFire && fuel > 0) {
      laserState     = 'bursting';
      laserStateTimer = 0;
      burstShotsFired = 0;
    }
  } else if (laserState === 'bursting') {
    laserStateTimer += delta;
    const shotInterval = BURST_DURATION / BURST_SHOT_COUNT;

    while (burstShotsFired < BURST_SHOT_COUNT && laserStateTimer >= burstShotsFired * shotInterval && fuel > 0) {
      fireLaserShot();
      burstShotsFired++;
    }

    if (burstShotsFired >= BURST_SHOT_COUNT || fuel <= 0) {
      laserState      = 'cooldown';
      laserStateTimer = 0;
    }
  } else if (laserState === 'cooldown') {
    laserStateTimer += delta;
    if (laserStateTimer >= BURST_COOLDOWN) {
      laserState = 'idle';
    }
  }
}

function fireLaserShot() {
  if (navigator.vibrate) navigator.vibrate(30); // haptic on fire
  fuel = Math.max(0, fuel - SHOT_FUEL_COST);
  laserFlashTimer = LASER_FLASH_TIME;
  // Blaghh blaghh laser sound (low heavy burst)
  playBeep(180,0.18,'sawtooth',0.22);
  setTimeout(()=>playBeep(120,0.22,'sawtooth',0.22),80);

  const beam       = player.userData.beam;
  const beamGeo    = player.userData.beamGeo;
  const laserLight = player.userData.laserLight;
  const beamLen    = LASER_BEAM_LENGTH;

  const pos = beamGeo.attributes.position;
  pos.setXYZ(0, 0, -0.35, 3.25);
  pos.setXYZ(1, 0, -0.35, 3.25 + beamLen);
  pos.needsUpdate = true;

  beam.material.opacity = 0.95;
  beam.material.color.setRGB(1.0, 0.35, 0.05);
  laserLight.intensity = 5.0;
  laserLight.distance  = 32;
  laserLight.color.setRGB(1.0, 0.3, 0.0);

  const muzzleWorld = new THREE.Vector3(0, -0.35, 3.25).applyMatrix4(player.matrixWorld);
  const rayDir      = new THREE.Vector3(0, 0, 1).applyQuaternion(player.quaternion).normalize();

  if (invaders.length) {
    invaders.forEach(inv => {
      if (inv.phase === 'flee' || inv.dead) return;
      const toInv = inv.sprite.position.clone().sub(muzzleWorld);
      const along = toInv.dot(rayDir);
      if (along > 0 && along < beamLen) {
        const perp = toInv.clone().sub(rayDir.clone().multiplyScalar(along)).length();
        if (perp < 3.5) {
          inv.hp--;
          inv.hitFlash = 1.0;
          if (inv.hp <= 0) {
            inv.dead = true;
            inv.phase = 'flee';
            inv.timer = 0;
            showLootToast(inv.type === 0 ? '🔴 RED INVADER DESTROYED' : '🔵 BLUE INVADER DESTROYED');
          }
        }
      }
    });
  }

  asteroids.forEach(a => {
    const toAst = a.position.clone().sub(muzzleWorld);
    const along = toAst.dot(rayDir);
    if (along > 0 && along < beamLen) {
      const perp = toAst.clone().sub(rayDir.clone().multiplyScalar(along)).length();
      if (perp < a.userData.size + 0.8) {
        const pushDir = toAst.clone().normalize().multiplyScalar(1.8);
        a.position.add(pushDir);
      }
    }
  });
}

// Lightweight per-frame update of the reservoir bars (avoids rebuilding
// the whole cargo/patch-bay grids every tick).
function refreshStationResourceBars() {
  if (!nearStation) return;
  const res = nearStation.storage.resources;
  STATION_RESOURCE_TYPES.forEach(key => {
    const bar = document.getElementById('res-bar-' + key);
    const val = document.getElementById('res-val-' + key);
    if (bar)  bar.style.width = Math.round((res[key] / STATION_RESOURCE_MAX) * 100) + '%';
    if (val)  val.textContent = Math.round(res[key]) + ' / ' + STATION_RESOURCE_MAX;
  });
}

// ==================== STATION STORAGE PANEL ====================
function renderStationPanel() {
  if (!nearStation) { closeStationPanel(); return; }
  const storage = nearStation.storage;
  refreshStationResourceBars();

  const sectorLabel = document.getElementById('station-sector-label');
  if (sectorLabel) sectorLabel.textContent = 'SECTOR ' + nearStation.key;

  function renderCargoGrid(containerId, slots, isStation, maxStack) {
    const grid = document.getElementById(containerId);
    if (!grid) return;
    grid.innerHTML = '';
    slots.forEach((slot, i) => {
      const loot = slot.itemType !== null ? lootItemTypes[slot.itemType] : null;
      const el = document.createElement('div');
      el.style.cssText = `border:1px solid ${loot ? (loot.color||'#a86') : '#633'}; padding:5px 3px; border-radius:4px; background:${loot?'rgba(40,10,30,0.85)':'rgba(20,5,15,0.5)'}; min-height:64px; font-size:10px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; color:${loot?(loot.color||'#fbb'):'#754'};`;
      if (loot && slot.count > 0) {
        const dir   = isStation ? '←' : '→';
        const label = isStation ? 'TAKE' : 'STOW';
        el.innerHTML = `
          <div style="font-size:16px;">${loot.icon}</div>
          <div style="font-size:8px; text-align:center; line-height:1.1;">${loot.label}</div>
          <div style="font-size:11px; color:#fff;">${slot.count}</div>
          <button data-idx="${i}" style="background:rgba(60,0,40,0.9); border:1px solid #ff3fa4; color:#ff8ad1; font-family:monospace; font-size:8px; padding:2px 4px; cursor:pointer; border-radius:2px; margin-top:2px;">${dir} ${label}</button>
        `;
      } else {
        el.innerHTML = `<div style="font-size:9px; opacity:0.4;">EMPTY</div>`;
      }
      grid.appendChild(el);
    });
    grid.onclick = (e) => {
      const btn = e.target.closest('[data-idx]');
      if (!btn) return;
      const i = parseInt(btn.dataset.idx);
      if (isStation) transferStackable(slots, cargoSlots, i, maxStack);
      else            transferStackable(slots, storage.cargo, i, maxStack);
      renderStationPanel();
      if (inventoryOpen) renderInventory();
    };
  }

  function renderBayGrid(containerId, slots, isStation, stationBays) {
    const grid = document.getElementById(containerId);
    if (!grid) return;
    grid.innerHTML = '';
    slots.forEach((slot, i) => {
      const loot = slot.itemType !== null ? lootItemTypes[slot.itemType] : null;
      const isPowered = slot.powered && loot;
      const el = document.createElement('div');
      el.style.cssText = `border:${isPowered ? '2px solid '+(loot.color||'#fa0') : loot ? '1px solid '+(loot.color||'#a86') : '1px dashed #633'}; padding:5px 3px; border-radius:4px; background:${isPowered?'rgba(60,30,0,0.9)':loot?'rgba(35,15,25,0.85)':'rgba(20,5,15,0.5)'}; min-height:74px; font-size:10px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; color:${loot?(loot.color||'#fc9'):'#754'};`;
      if (loot && slot.count > 0) {
        const dir   = isStation ? '←' : '→';
        const label = isStation ? 'TAKE' : 'STOW';
        let buttonsHTML = '';
        if (isStation) {
          const pText  = isPowered ? 'UNPLUG' : 'PLUG IN';
          const pColor = isPowered ? '#fa0' : '#a73';
          buttonsHTML = `
            <div style="display:flex; gap:3px; margin-top:2px; justify-content:center;">
              <button data-idx="${i}" data-action="transfer" style="background:rgba(60,0,40,0.9); border:1px solid #ff3fa4; color:#ff8ad1; font-family:monospace; font-size:8px; padding:2px 4px; cursor:pointer; border-radius:2px;">${dir} ${label}</button>
              <button data-idx="${i}" data-action="power"   style="background:rgba(30,25,0,0.9); border:1px solid ${pColor}; color:${pColor}; font-family:monospace; font-size:8px; padding:2px 4px; cursor:pointer; border-radius:2px;">${pText}</button>
            </div>
          `;
        } else {
          buttonsHTML = `<button data-idx="${i}" data-action="transfer" style="background:rgba(60,0,40,0.9); border:1px solid #ff3fa4; color:#ff8ad1; font-family:monospace; font-size:8px; padding:2px 4px; cursor:pointer; border-radius:2px; margin-top:2px;">${dir} ${label}</button>`;
        }
        el.innerHTML = `
          <div style="font-size:16px;">${loot.icon}</div>
          <div style="font-size:8px; text-align:center; line-height:1.1;">${loot.label}</div>
          <div style="font-size:9px; color:${isPowered?'#fa0':'#778'};">${isPowered?'⚡ POWERED':'○ UNPOWERED'}</div>
          ${buttonsHTML}
        `;
      } else {
        el.innerHTML = `<div style="font-size:9px; opacity:0.4;">EMPTY BAY</div>`;
      }
      grid.appendChild(el);
    });
    grid.onclick = (e) => {
      const btn = e.target.closest('[data-idx]');
      if (!btn) return;
      const i = parseInt(btn.dataset.idx);
      const action = btn.dataset.action || 'transfer';

      if (action === 'power' && isStation) {
        const slot = slots[i];
        if (!slot || slot.count <= 0 || slot.itemType === null) return;
        const loot = lootItemTypes[slot.itemType];
        slot.powered = !slot.powered;
        showLootToast( (slot.powered ? '⚡ ' : '○ ') + loot.label.toUpperCase() + (slot.powered ? ' PLUGGED IN' : ' UNPLUGGED') );
        renderStationPanel();
        if (inventoryOpen) renderInventory();
        return;
      }

      if (isStation) transferModule(slots, patchBaySlots, i);
      else            transferModuleToBays(slots, i, stationBays);
      renderStationPanel();
      if (inventoryOpen) renderInventory();
    };
  }

  renderCargoGrid('player-cargo-grid-station', cargoSlots, false, 3);
  renderCargoGrid('station-cargo-grid', storage.cargo, true, 3);
  renderBayGrid('player-patchbay-grid-station', patchBaySlots, false, storage.patchBays);
  storage.patchBays.forEach((bay, bayIdx) => {
    renderBayGrid('station-patchbay-grid-' + bayIdx, bay, true);
  });
}

function openStationPanel() {
  if (!nearStation) return;
  stationPanelOpen = true;
  const p = document.getElementById('station-panel');
  if (p) p.style.display = 'block';
  renderStationPanel();
}

function closeStationPanel() {
  stationPanelOpen = false;
  const p = document.getElementById('station-panel');
  if (p) p.style.display = 'none';
}

function renderInventory() {
  const grid = document.getElementById('inventory-grid');
  grid.innerHTML = '';

  inventory.forEach((slot, index) => {
    const slotEl = document.createElement('div');
    slotEl.style.padding = '10px';
    slotEl.style.borderRadius = '4px';
    slotEl.style.background = 'rgba(0,30,60,0.6)';
    slotEl.style.minWidth = '110px';

    const subSlotsHTML = Array(4).fill(0).map((_, i) => {
      const filled = i < Math.floor(slot.count / 4);
      return `<div style="width: 14px; height: 14px; border-radius: 50%; background: ${filled ? '#0f8' : '#112'}; box-shadow: ${filled ? '0 0 4px #0f8' : 'none'};"></div>`;
    }).join('');

    const canUse = slot.count > 0;
    slotEl.innerHTML = `
      <div style="font-size: 28px; margin-bottom: 5px;">${slot.icon}</div>
      <div style="font-size: 14px;">${slot.name}</div>
      <div style="font-size: 18px; margin: 8px 0;">${slot.count} / ${slot.max}</div>
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-top: 8px; justify-items: center;">
        ${subSlotsHTML}
      </div>
      <div style="display:flex; gap:4px; margin-top:8px;">
        <button data-inv="${index}" data-action="use" style="flex:1; background:${canUse?'rgba(0,60,20,0.8)':'rgba(20,20,20,0.4)'}; border:1px solid ${canUse?'#0f8':'#333'}; color:${canUse?'#0f8':'#444'}; font-family:monospace; font-size:10px; padding:3px; cursor:${canUse?'pointer':'default'}; border-radius:2px;">USE</button>
        <button data-inv="${index}" data-action="drop" style="flex:1; background:${canUse?'rgba(60,0,0,0.8)':'rgba(20,20,20,0.4)'}; border:1px solid ${canUse?'#f44':'#333'}; color:${canUse?'#f44':'#444'}; font-family:monospace; font-size:10px; padding:3px; cursor:${canUse?'pointer':'default'}; border-radius:2px;">DROP</button>
      </div>
    `;
    grid.appendChild(slotEl);
  });

  // Inventory button event delegation
  grid.onclick = (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const idx    = parseInt(btn.dataset.inv);
    const action = btn.dataset.action;
    const slot   = inventory[idx];
    if (!slot || slot.count <= 0) return;
    if (action === 'use') {
      if (idx === 0) oxygen = Math.min(100, oxygen + 18);
      if (idx === 1) water  = Math.min(100, water  + 15);
      if (idx === 2) food   = Math.min(100, food   + 15);
      if (idx === 3) fuel   = Math.min(100, fuel   + 18);
      slot.count = Math.max(0, slot.count - 2);
      showLootToast(slot.icon + ' ' + slot.name.toUpperCase() + ' USED');
    } else if (action === 'drop') {
      slot.count = Math.max(0, slot.count - 1);
      showLootToast(slot.icon + ' JETTISONED: ' + slot.name);
    }
    renderInventory();
  };

  // === CARGO HOLD — general loot/consumables ===
  const cargoGrid = document.getElementById('cargo-grid');
  cargoGrid.innerHTML = '';

  cargoSlots.forEach((slot, i) => {
    const loot = slot.itemType !== null ? lootItemTypes[slot.itemType] : null;
    const slotEl = document.createElement('div');
    slotEl.style.border = loot ? '1px solid ' + (loot.color || '#0aa') : '1px solid #0aa';
    slotEl.style.padding = '6px 4px';
    slotEl.style.borderRadius = '4px';
    slotEl.style.background = loot ? 'rgba(20,30,50,0.8)' : 'rgba(10,20,50,0.6)';
    slotEl.style.minHeight = '74px';
    slotEl.style.fontSize = '11px';
    slotEl.style.display = 'flex';
    slotEl.style.flexDirection = 'column';
    slotEl.style.alignItems = 'center';
    slotEl.style.justifyContent = 'center';
    slotEl.style.gap = '3px';
    slotEl.style.color = loot ? (loot.color || '#aaf') : '#446';

    if (loot && slot.count > 0) {
      slotEl.innerHTML = `
        <div style="font-size:18px;">${loot.icon}</div>
        <div style="font-size:9px; text-align:center;">${loot.label}</div>
        <div style="font-size:12px; color:#fff;">${slot.count}</div>
        <div style="display:flex; gap:2px; margin-top:2px;">
          <button data-cargo="${i}" data-action="use" style="background:rgba(0,50,20,0.9); border:1px solid #0f8; color:#0f8; font-family:monospace; font-size:9px; padding:2px 4px; cursor:pointer; border-radius:2px;">USE</button>
          <button data-cargo="${i}" data-action="drop" style="background:rgba(50,0,0,0.9); border:1px solid #f44; color:#f44; font-family:monospace; font-size:9px; padding:2px 4px; cursor:pointer; border-radius:2px;">DROP</button>
        </div>
      `;
    } else {
      slotEl.innerHTML = `<div style="font-size:10px; opacity:0.4;">EMPTY<br>${i+1}</div>`;
    }
    cargoGrid.appendChild(slotEl);
  });

  cargoGrid.onclick = (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const i      = parseInt(btn.dataset.cargo);
    const action = btn.dataset.action;
    const slot   = cargoSlots[i];
    if (!slot || slot.count <= 0 || slot.itemType === null) return;
    const loot = lootItemTypes[slot.itemType];

    if (action === 'use') {
      if (loot.effect) loot.effect();
      showLootToast(loot.icon + ' ' + loot.label.toUpperCase() + ' USED');
      slot.count--;
      if (slot.count <= 0) slot.itemType = null;
    } else if (action === 'drop') {
      slot.count--;
      if (slot.count <= 0) slot.itemType = null;
      showLootToast(loot.icon + ' JETTISONED: ' + loot.label);
    }
    renderInventory();
  };

  // === PATCH BAY — modules, gated by a hard 3-Power-Plug budget ===
  const plugsUsed = poweredModuleCount();
  const plugIndicator = document.getElementById('power-plug-indicator');
  const plugLabel      = document.getElementById('power-plug-label');
  if (plugIndicator) {
    plugIndicator.innerHTML = Array(getMaxPowerPlugs()).fill(0)
      .map((_, n) => `<span style="color:${n < plugsUsed ? '#ffb74d' : '#445'}; text-shadow:${n < plugsUsed ? '0 0 6px #fa0' : 'none'};">●</span>`)
      .join('');
  }
  if (plugLabel) plugLabel.textContent = plugsUsed + ' / ' + getMaxPowerPlugs() + ' POWER PLUGS IN USE';

  const patchBayGrid = document.getElementById('patchbay-grid');
  patchBayGrid.innerHTML = '';

  patchBaySlots.forEach((slot, i) => {
    const loot = slot.itemType !== null ? lootItemTypes[slot.itemType] : null;
    const slotEl = document.createElement('div');
    const isPowered = slot.powered && loot;
    slotEl.style.border = isPowered ? '2px solid ' + (loot.color || '#fa0') : loot ? '1px solid ' + (loot.color || '#a86') : '1px dashed #a86';
    slotEl.style.padding = '6px 4px';
    slotEl.style.borderRadius = '4px';
    slotEl.style.background = isPowered ? 'rgba(40,25,0,0.95)' : loot ? 'rgba(35,25,15,0.8)' : 'rgba(20,15,10,0.5)';
    slotEl.style.minHeight = (loot && loot.halfSlot) ? '44px' : (loot && loot.tripleSlot) ? '264px' : '88px';
    slotEl.style.fontSize = '11px';
    slotEl.style.display = 'flex';
    slotEl.style.flexDirection = 'column';
    slotEl.style.alignItems = 'center';
    slotEl.style.justifyContent = 'center';
    slotEl.style.gap = '3px';
    slotEl.style.color = loot ? (loot.color || '#fc9') : '#765';
    if (isPowered) slotEl.style.boxShadow = '0 0 8px ' + loot.color;

    if (loot && slot.count > 0) {
      const reduction = loot.isGrowPlate ? Math.round(loot.drainReduction * 100) : null;
      const plugsFull = !slot.powered && plugsUsed >= getMaxPowerPlugs();
      const descLine = loot.desc ? `<div style="font-size:8px; color:#aaa; text-align:center; line-height:1.2; margin-top:1px;">${loot.desc}</div>` : '';
      const halfSlotTag = loot.halfSlot ? `<div style="font-size:8px; color:#cc88ff;">½ SLOT</div>` : '';
      const tripleSlotTag = loot.tripleSlot ? `<div style="font-size:8px; color:#ff44ff;">▐▐▐ 3-SLOT MODULE</div>` : '';
      const hfRateTag = loot.isHFSynth && isPowered ? `<div style="font-size:8px; color:#ff88ff; margin-top:2px;">⏱ 1 HF / 120s</div>` : '';
      slotEl.innerHTML = `
        <div style="font-size:18px;">${loot.icon}</div>
        <div style="font-size:9px; text-align:center; line-height:1.2;">${loot.label}</div>
        ${halfSlotTag}
        ${tripleSlotTag}
        ${descLine}
        ${hfRateTag}
        ${reduction !== null ? `<div style="font-size:9px; color:#0f8;">-${reduction}% DRAIN</div>` : ''}
        <div style="font-size:10px; color:${isPowered?'#fa0':'#778'};">${isPowered?'⚡ POWERED':'○ UNPOWERED'}</div>
        <div style="display:flex; gap:2px; margin-top:3px;">
          <button data-bay="${i}" data-action="power" title="${plugsFull?'No free Power Plugs':''}" style="background:${isPowered?'rgba(60,35,0,0.9)':plugsFull?'rgba(20,20,20,0.6)':'rgba(30,20,0,0.9)'}; border:1px solid ${isPowered?'#fa0':plugsFull?'#444':'#a73'}; color:${isPowered?'#fa0':plugsFull?'#666':'#dc9'}; font-family:monospace; font-size:8px; padding:2px 4px; cursor:pointer; border-radius:2px;">${isPowered?'UNPLUG':(plugsFull?'NO PLUGS FREE':'PLUG IN')}</button>
          <button data-bay="${i}" data-action="drop" style="background:rgba(50,0,0,0.9); border:1px solid #f44; color:#f44; font-family:monospace; font-size:8px; padding:2px 4px; cursor:pointer; border-radius:2px;">DROP</button>
        </div>
      `;
    } else {
      slotEl.innerHTML = `<div style="font-size:10px; opacity:0.4;">EMPTY BAY<br>${i+1}</div>`;
    }
    patchBayGrid.appendChild(slotEl);
  });

  patchBayGrid.onclick = (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const i      = parseInt(btn.dataset.bay);
    const action = btn.dataset.action;
    const slot   = patchBaySlots[i];
    if (!slot || slot.count <= 0 || slot.itemType === null) return;
    const loot = lootItemTypes[slot.itemType];

    if (action === 'power') {
      if (slot.powered) {
        slot.powered = false;
        showLootToast(loot.icon + ' ' + loot.label.toUpperCase() + ' UNPLUGGED');
      } else {
        if (poweredModuleCount() >= getMaxPowerPlugs()) {
          showLootToast('⚡ NO FREE POWER PLUGS — UNPLUG ANOTHER MODULE FIRST');
          renderInventory();
          return;
        }
        slot.powered = true;
        const effectText = loot.isGrowPlate ? (' — ' + loot.resource.toUpperCase() + ' DRAIN -' + Math.round(loot.drainReduction*100) + '%') : '';
        showLootToast(loot.icon + ' ' + loot.label.toUpperCase() + ' PLUGGED IN' + effectText);
      }
      refreshGrowPlates();
    } else if (action === 'drop') {
      if (slot.powered) { slot.powered = false; refreshGrowPlates(); }
      slot.count--;
      if (slot.count <= 0) { slot.itemType = null; slot.powered = false; }
      showLootToast(loot.icon + ' JETTISONED: ' + loot.label);
      refreshGrowPlates();
    }
    renderInventory();
  };

  if (stationPanelOpen) renderStationPanel();

  const hfGrid = document.getElementById('hf-grid');
  hfGrid.innerHTML = '';
  headlightFluidSlots.forEach((slot, i) => {
    const slotEl = document.createElement('div');
    slotEl.style.border = '1px solid #55f';
    slotEl.style.padding = '8px 4px';
    slotEl.style.borderRadius = '4px';
    slotEl.style.background = 'rgba(10,10,50,0.7)';
    slotEl.style.minHeight = '55px';
    slotEl.style.fontSize = '11px';
    slotEl.style.display = 'flex';
    slotEl.style.flexDirection = 'column';
    slotEl.style.alignItems = 'center';
    slotEl.style.justifyContent = 'center';
    slotEl.style.color = slot.count > 0 ? '#aaf' : '#446';
    const canUse = slot.count > 0;
    slotEl.innerHTML = `<div style="font-size:18px;">💡</div><div>${slot.count}/${slot.max}</div>
      ${canUse ? `<button data-hf="${i}" style="background:rgba(0,0,60,0.9); border:1px solid #55f; color:#aaf; font-family:monospace; font-size:9px; padding:2px 4px; cursor:pointer; border-radius:2px; margin-top:3px;">USE</button>` : ''}
    `;
    hfGrid.appendChild(slotEl);
  });

  hfGrid.onclick = (e) => {
    const btn = e.target.closest('[data-hf]');
    if (!btn) return;
    const i = parseInt(btn.dataset.hf);
    if (headlightFluidSlots[i].count > 0) {
      headlightFluidSlots[i].count--;
      // Headlight fluid tops up flashlight / extends O2
      oxygen = Math.min(100, oxygen + 10);
      player.userData.flashlightOn = true;
      const fl = player.userData.flashlight;
      if (fl) fl.intensity = 3.5;
      const cone = player.userData.spotBeamCone;
      if (cone) cone.material.opacity = 0.14;
      showLootToast('💡 HEADLIGHT FLUID: FLASHLIGHT REFUELLED');
      renderInventory();
    }
  };

  const compGrid = document.getElementById('component-grid');
  compGrid.innerHTML = '';
  specialItemTypes.forEach(data => {
    const count = shipComponents[data.type] || 0;
    const slotEl = document.createElement('div');
    slotEl.style.border = data.legendary ? '1px solid #ffd9ec' : '1px solid #5d5';
    slotEl.style.padding = '8px 4px';
    slotEl.style.borderRadius = '4px';
    slotEl.style.background = data.legendary ? 'rgba(40,15,35,0.6)' : 'rgba(10,40,20,0.6)';
    slotEl.style.minHeight = '60px';
    slotEl.style.fontSize = '10px';
    slotEl.style.display = 'flex';
    slotEl.style.flexDirection = 'column';
    slotEl.style.alignItems = 'center';
    slotEl.style.justifyContent = 'center';
    slotEl.style.color = count > 0 ? (data.legendary ? '#ffd9ec' : '#afa') : (data.legendary ? '#864' : '#465');
    if (data.legendary && count > 0) slotEl.style.boxShadow = '0 0 10px rgba(255,182,193,0.6)';
    // Components can be activated
    const canActivate = count > 0 && !data.legendary;
    slotEl.innerHTML = `<div style="font-size:18px;">${data.icon}</div><div>${data.label}</div><div style="margin-top:3px; font-size:13px;">${count}</div>
      ${canActivate ? `<button data-comp="${data.type}" style="background:rgba(0,40,0,0.9); border:1px solid #5d5; color:#afa; font-family:monospace; font-size:9px; padding:2px 4px; cursor:pointer; border-radius:2px; margin-top:3px;">INSTALL</button>` : ''}
    `;
    compGrid.appendChild(slotEl);
  });

  compGrid.onclick = (e) => {
    const btn = e.target.closest('[data-comp]');
    if (!btn) return;
    const type = btn.dataset.comp;
    if (shipComponents[type] > 0) {
      // Component active effects
      if (type === 'co2_scrubber')   { oxygen = Math.min(100, oxygen + 30); showLootToast('🌀 CO₂ SCRUBBER: O₂ +30'); }
      if (type === 'water_recycler') { water  = Math.min(100, water  + 30); showLootToast('💧 WATER RECYCLER: H₂O +30'); }
      if (type === 'solar_charger')  { fuel   = Math.min(100, fuel   + 30); showLootToast('☀️ SOLAR CHARGER: FUEL +30'); }
      if (type === 'bio_recycler')   { food   = Math.min(100, food   + 30); showLootToast('🌿 BIO-RECYCLER: FOOD +30'); }
      shipComponents[type]--;
      renderInventory();
    }
  };
}

function showLootToast(text) {
  const toast = document.getElementById('loot-toast');
  if (!toast) return;
  toast.textContent = text;
  toast.style.display = 'block';
  toast.style.opacity = '1';
  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => { toast.style.display = 'none'; }, 400);
  }, 2200);
}

function updateLandmarks(delta) {
  landmarks.forEach(l => {
    const beacon = l.userData.beacon;
    if (!beacon) return;
    const speed = l.userData.kind === 'wreck' ? 2.2 : 3.5;
    l.userData.blinkPhase += delta * speed;
    const pulse = Math.max(0, Math.sin(l.userData.blinkPhase));
    beacon.intensity = pulse * (l.userData.kind === 'wreck' ? 2.0 : 1.2);
  });
}

function updateSpaceCows(delta) {
  spaceCows.forEach(cow => {
    const ud = cow.userData;
    ud.bobPhase += delta * 0.7;
    cow.position.y = ud.baseY + Math.sin(ud.bobPhase) * 0.6;
    cow.rotateOnAxis(ud.spinAxis, delta * 0.25);
  });
}

// === MAIN LOOP ===
const clock = new THREE.Clock();

function animate() {
  try {
    animateFrame();
    requestAnimationFrame(animate);
  } catch (frameErr) {
    console.error('[Headlight-Fluid] Render loop failed:', frameErr);
    showEngineErrorBanner((frameErr && frameErr.message ? frameErr.message : frameErr)
      + ' (thrown inside the render loop — animation stopped to avoid spamming this error)');
    // not re-requesting the frame: the loop stops here instead of erroring every frame
  }
}

function animateFrame() {
  const delta = Math.min(clock.getDelta(), 0.1);
  updateGifScreens(delta * 1000); // wing screens redraw on their own slow "GIF" cadence

  if (gameActive) {
    // Timer only counts when ALL resources have any amount (not empty)
    const allResourcesAvailable = oxygen > 0 && water > 0 && food > 0 && fuel > 0;
    if (allResourcesAvailable) playTimeSeconds += delta;

    // Resource-active / resource-paused timers: "active" counts while at least
    // one of O2/H2O/Food/Fuel is above zero; "paused" counts while all four are
    // depleted (zero/empty) at once.
    const anyResourceActive = oxygen > 0 || water > 0 || food > 0 || fuel > 0;
    if (anyResourceActive) resourceActiveSeconds += delta;
    else resourcePausedSeconds += delta;

    // Store for HUD/standby display
    window.allResourcesAvailable = allResourcesAvailable;
    
    const rotSpeed = 0.035;
    const pitchSpeed = 0.028;
    const vel = player.userData.velocity;

    if (keys['a'] || keys['arrowleft'])  player.rotation.y += rotSpeed;
    if (keys['d'] || keys['arrowright']) player.rotation.y -= rotSpeed;

    if (keys['i']) player.rotation.x += pitchSpeed;   
    if (keys['k']) player.rotation.x -= pitchSpeed;   

    // Auto-orient after 30s idle (flightAssist on): gentle nose toward homing beacon
    if (gameActive && flightAssist && (Date.now() - lastInputTime > 30000)) {
      const toBeacon = regionBeacon.position.clone().sub(player.position);
      if (toBeacon.lengthSq() > 1) {
        toBeacon.normalize();
        const currentFwd = new THREE.Vector3(0, 0, 1).applyQuaternion(player.quaternion);
        const angle = currentFwd.angleTo(toBeacon);
        if (angle > 0.02) {
          const axis = currentFwd.clone().cross(toBeacon).normalize();
          if (axis.lengthSq() > 0.001) {
            const turnAngle = Math.min(0.015, angle * 0.6);
            const turnQuat = new THREE.Quaternion().setFromAxisAngle(axis, turnAngle);
            player.quaternion.premultiply(turnQuat);
            player.quaternion.normalize();
          }
        }
      }
    }

    const thrustPower = 0.175; 
    if (keys['w'] || keys['arrowup']) {
      const boostMultiplier = isBoosting ? 2.0 : 1.0;
      const dir = new THREE.Vector3(0, 0, 1).applyQuaternion(player.quaternion);
      vel.add(dir.multiplyScalar(thrustPower * boostMultiplier));

      fuel = Math.max(0, fuel - (isBoosting ? 0.18 : 0.08));
    }
    if (keys['s'] || keys['arrowdown']) {
      const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(player.quaternion);
      vel.add(dir.multiplyScalar(thrustPower * 0.6));
    }

    // === Thruster glow particles (slight glowing effect when thrusting) ===
    const glows = player.userData.thrusterGlow;
    if (glows) {
      const isThrusting = keys['w'] || keys['arrowup'];
      glows.forEach(g => {
        if (g && g.material) {
          const target = isThrusting ? 0.95 : 0.25;
          g.material.opacity = g.material.opacity * 0.7 + target * 0.3; // smooth lerp
          if (isThrusting) {
            // subtle random jitter for "alive" feel
            const p = g.geometry.attributes.position;
            for (let i = 0; i < p.count; i++) {
              p.array[i*3 + 2] = 0.55 + Math.random() * 0.45;
            }
            p.needsUpdate = true;
          }
        }
      });
    }

    // === Direction Assistant — gently auto-steers toward nearby stations or enemies ===
    // Levels: 0=Off, 1=Low, 2=Medium, 3=Strong
    const menusOpen = inventoryOpen || stationPanelOpen;
    if (directionAssistLevel > 0 && !menusOpen) {
      let nearestTarget = null;
      let nearestDist = Infinity;

      // Check stations (resources/farms)
      for (const st of pinkStations) {
        if (!st.mesh) continue;
        const d = player.position.distanceTo(st.mesh.position);
        if (d > 8 && d < 320 && d < nearestDist) {
          nearestDist = d;
          nearestTarget = { position: st.mesh.position, type: 'station' };
        }
      }

      // Check enemies (escort mines)
      for (const mine of escortMines) {
        if (!mine.mesh) continue;
        const d = player.position.distanceTo(mine.mesh.position);
        if (d > 6 && d < 250 && d < nearestDist) {
          nearestDist = d;
          nearestTarget = { position: mine.mesh.position, type: 'enemy' };
        }
      }

      if (nearestTarget) {
        const toTarget = nearestTarget.position.clone().sub(player.position).normalize();
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(player.quaternion);
        const dot = forward.dot(toTarget);

        if (dot < 0.94) {
          const axis = new THREE.Vector3().crossVectors(forward, toTarget).normalize();
          if (axis.length() > 0.1) {
            // Scale steering strength by level
            const strength = [0, 0.35, 0.65, 1.0][directionAssistLevel]; // Low / Med / Strong
            const maxAngle = 0.008 + (directionAssistLevel * 0.004);
            const angle = Math.min(maxAngle, Math.acos(Math.max(-1, Math.min(1, dot)))) * strength;

            player.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(axis, angle));
          }
        }
      }
    }

    // === Flight Assist (fat-finger helper) — toggleable in main menu ===
    // Waits ~40 seconds of low activity, then gently auto-orients toward beacon if player seems lost.
    if (flightAssist) {
      // Track idle time
      if (!player.userData.lastInputTime) player.userData.lastInputTime = Date.now();
      
      const hasInput = keys['w'] || keys['a'] || keys['d'] || keys['i'] || keys['k'] || 
                       keys['arrowup'] || keys['arrowleft'] || keys['arrowright'] || keys['arrowdown'];
      
      if (hasInput) {
        player.userData.lastInputTime = Date.now();
      }
      
      const idleTime = (Date.now() - player.userData.lastInputTime) / 1000;
      
      if (idleTime > 40) { // 40 second grace period
        const toBeacon = regionBeacon.position.clone().sub(player.position);
        if (toBeacon.length() > 12) {
          toBeacon.normalize();
          const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(player.quaternion);
          
          // Gentle auto-orient only (no velocity push)
          const dot = forward.dot(toBeacon);
          if (dot < 0.85) { // not already well aligned
            const rotAssist = new THREE.Vector3().crossVectors(forward, toBeacon).normalize();
            player.rotation.y += rotAssist.y * 0.008;
            player.rotation.x += rotAssist.x * 0.006;
          }
        }
      }
    }

    // Right stick X = slow strafe/slide (left/right)
    if (gamepadEnabled) {
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      const gp = pads[0];
      if (gp) {
        const rx = gp.axes[2] || 0;
        if (Math.abs(rx) > 0.3) {
          const sideDir = new THREE.Vector3(rx > 0 ? 1 : -1, 0, 0).applyQuaternion(player.quaternion);
          vel.add(sideDir.multiplyScalar(0.04)); // slow strafe
        }
      }
    }

    // Stronger stop when no thrust (A/gamepad or W released)
    const damping = (keys['w'] || keys['arrowup']) ? 0.985 : 0.92;
    vel.multiplyScalar(damping);
    player.position.add(vel);

    // Escort mines (blue/red) follow player and shoot like ship
    if (hasEscort && escortMines.length > 0) {
      escortMines.forEach((e, i) => {
        const offset = new THREE.Vector3((i - 0.5) * 6, 3 + Math.sin(Date.now() / 400) * 1.5, -5);
        const target = player.position.clone().add(offset);
        const dist = e.mesh.position.distanceTo(target);
        const approachSpeed = dist < 2 ? 0.01 : dist < 4 ? 0.03 : 0.08; // halt faster the closer to useful object (player offset)
        e.mesh.position.lerp(target, approachSpeed);
        e.shootTimer += delta;
        if (e.shootTimer > 1.8) {
          e.shootTimer = 0;
          fireEscortShot(e);
        }
      });
    }

    // Update escort bullets (move and expire)
    if (window.escortBullets && window.escortBullets.length) {
      for (let i = window.escortBullets.length - 1; i >= 0; i--) {
        const b = window.escortBullets[i];
        b.position.add(b.userData.velocity.clone().multiplyScalar(delta * 60));
        b.userData.life -= delta;
        if (b.userData.life <= 0) {
          scene.remove(b);
          window.escortBullets.splice(i, 1);
        }
      }
    }

    oxygen = Math.max(0, oxygen - 0.015 * delta * 60 * (growPlateInstalled.o2   ? 1 - lootItemTypes[GROW_PLATE_IDX.o2].drainReduction   : 1));
    water  = Math.max(0, water  - 0.008 * delta * 60 * (growPlateInstalled.h2o  ? 1 - lootItemTypes[GROW_PLATE_IDX.h2o].drainReduction  : 1));
    food   = Math.max(0, food   - 0.006 * delta * 60 * (growPlateInstalled.food ? 1 - lootItemTypes[GROW_PLATE_IDX.food].drainReduction : 1));
    if (keys['w'] || keys['arrowup']) fuel = Math.max(0, fuel - 0.03 * (growPlateInstalled.fuel ? 1 - lootItemTypes[GROW_PLATE_IDX.fuel].drainReduction : 1));

    // Update synth volume based on resources
    synth.setGameState(oxygen, water, food, fuel);

    // HF Synthesizer: manufacture headlight fluid at half normal loot rate
    if (hfSynth.enabled) {
      hfSynth.accumulator += delta;
      if (hfSynth.accumulator >= hfSynth.RATE_SECONDS) {
        hfSynth.accumulator -= hfSynth.RATE_SECONDS;
        const slot = headlightFluidSlots.find(s => s.count < s.max);
        if (slot) {
          slot.count++;
          showLootToast('🧪 HF SYNTHESIZER: +1 Headlight Fluid manufactured');
          if (inventoryOpen) renderInventory();
        }
      }
    }

    // Resource Manager: evaluate CLI rules
    if (resManager.enabled) {
      const resValues = { o2: oxygen, h2o: water, food, fuel };
      const resSetters = { o2: v => oxygen = v, h2o: v => water = v, food: v => food = v, fuel: v => fuel = v };
      resManager.rules.forEach(rule => {
        const cur = resValues[rule.resource];
        if (cur === undefined) return;
        if (rule.action === 'warn' && cur <= rule.threshold) {
          // rate-limit warnings to once per 10s
          const now = Date.now();
          if (!rule._lastWarn || now - rule._lastWarn > 10000) {
            rule._lastWarn = now;
            showLootToast(`📊 RESMAN: ${rule.resource.toUpperCase()} LOW (${Math.floor(cur)}% ≤ ${rule.threshold}%)`, '#ffcc00');
          }
        } else if (rule.action === 'fill' && cur <= rule.threshold) {
          const now = Date.now();
          if (!rule._lastFill || now - rule._lastFill > 5000) {
            rule._lastFill = now;
            resSetters[rule.resource](Math.min(100, cur + 20));
            showLootToast(`📊 RESMAN: ${rule.resource.toUpperCase()} AUTO-TOPPED (+20)`, '#ffcc00');
          }
        }
      });
    }

    // Camera follow calculation
    const offset = new THREE.Vector3(0, 11, -16);
    offset.applyQuaternion(player.quaternion);
    const desiredPos = player.position.clone().add(offset);
    camera.position.lerp(desiredPos, 0.12);
    camera.lookAt(player.position.x, player.position.y + 1.5, player.position.z);

    // Capture checks
    const baseCollectRange = 3.2;
    const collectRange = autoPilot.enabled ? baseCollectRange * 4 : baseCollectRange;
    let nearestRes = null;
    let nearestDist = Infinity;
    for (let i = 0; i < resources.length; i++) {
      const r = resources[i];
      const d = r.position.distanceTo(player.position);
      if (d < collectRange && d < nearestDist) {
        nearestDist = d;
        nearestRes = r;
      }
    }

    // Auto-Pilot: steer toward nearest resource in 4× range when enabled
    if (autoPilot.enabled && resources.length > 0) {
      // find the nearest resource overall to fly toward
      let apTarget = null, apDist = Infinity;
      for (let i = 0; i < resources.length; i++) {
        const d = resources[i].position.distanceTo(player.position);
        if (d < apDist) { apDist = d; apTarget = resources[i]; }
      }
      if (apTarget) {
        const dir = apTarget.position.clone().sub(player.position).normalize();
        const vel = player.userData.velocity;
        vel.add(dir.multiplyScalar(0.06));
        vel.clampLength(0, 0.8);
        player.position.add(vel);
        // turn pod to face movement
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(player.quaternion);
        const cross = new THREE.Vector3().crossVectors(forward, dir);
        player.rotation.y -= cross.y * 0.04;
        fuel = Math.max(0, fuel - 0.02);
      }
    }

    if (nearestRes) {
      if (captureTarget !== nearestRes) {
        captureTarget = nearestRes;
        captureTimer = 0;
      }
      captureTimer += delta;
      const pct = Math.min(captureTimer / CAPTURE_TIME, 1) * 100;

      const wrap = document.getElementById('capture-bar-wrap');
      const bar  = document.getElementById('capture-bar');
      const lbl  = document.getElementById('capture-label');
      wrap.style.display = 'block';
      bar.style.width = pct + '%';
      const captureLabel = captureTarget.userData.type === 'special'
        ? captureTarget.userData.label.toUpperCase()
        : (captureTarget.userData.type || '').toUpperCase();
      lbl.textContent  = 'SALVAGING ' + captureLabel + '… ' + Math.ceil(CAPTURE_TIME - captureTimer) + 's';

      if (captureTimer >= CAPTURE_TIME) {
        wrap.style.display = 'none';
        const r = captureTarget;
        captureTarget = null;
        captureTimer  = 0;

        const idx = resources.indexOf(r);
        if (idx !== -1) {
          resources.splice(idx, 1);
          scene.remove(r);
        }
        // Happier whip-like collection sound (bright & snappy, not dudow)
        playBeep(900, 0.07, 'triangle', 0.22); // bright whip snap
        setTimeout(() => playBeep(1400, 0.05, 'sine', 0.2), 50); // happy follow-up
        if (navigator.vibrate) navigator.vibrate(20); // haptic collect

        if (r.userData.type === 'special') {
          shipComponents[r.userData.specialType] = (shipComponents[r.userData.specialType] || 0) + 1;
          if (r.userData.spaceCow) {
            const cIdx = spaceCows.indexOf(r);
            if (cIdx !== -1) spaceCows.splice(cIdx, 1);
            showLootToast('🐄 RESCUED THE SPACE COW — PINNACLE OF SPACE SURVIVAL');
          } else if (r.userData.specialType === 'escort_disk') {
            hasEscort = true;
            showLootToast('📡 ESCORT CATALOGUE DATA DISK ACQUIRED — deploying blue & red escort mines');
            spawnEscortMines();
          } else {
            showLootToast('SALVAGED: ' + r.userData.icon + ' ' + r.userData.label.toUpperCase());
          }
          if (inventoryOpen) renderInventory();
        } else {
          if (r.userData.type === 'o2')   oxygen = Math.min(100, oxygen + 28);
          if (r.userData.type === 'h2o')  water  = Math.min(100, water  + 25);
          if (r.userData.type === 'fuel') fuel   = Math.min(100, fuel   + 22);

          const invIndex = r.userData.type === 'o2'   ? 0
                         : r.userData.type === 'h2o'  ? 1
                         : r.userData.type === 'fuel' ? 3
                         : -1;
          if (invIndex >= 0) {
            inventory[invIndex].count = Math.min(inventory[invIndex].max, inventory[invIndex].count + 2);
          }
          if (Math.random() < 0.3) {
            inventory[2].count = Math.min(inventory[2].max, inventory[2].count + 1);
          }
          if (Math.random() < 0.2) {
            const hfIdx = Math.floor(Math.random() * headlightFluidSlots.length);
            headlightFluidSlots[hfIdx].count = Math.min(headlightFluidSlots[hfIdx].max, headlightFluidSlots[hfIdx].count + 1);
          }
          if (Math.random() < 0.4) {
            // Weighted roll: special modules are rare, HF Synthesizer is ultra-rare
            const regularModules = [MODULE_IDX.splitter, MODULE_IDX.autoPilot, MODULE_IDX.resManager];
            let rolledType;
            const roll = Math.random();
            if (roll < 0.02) {
              // ultra-rare: HF Synthesizer (~2% chance)
              rolledType = MODULE_IDX.hfSynth;
            } else if (roll < 0.10) {
              // rare: one of the three regular special modules (~8% combined)
              rolledType = regularModules[Math.floor(Math.random() * regularModules.length)];
            } else {
              // normal drop: consumables and grow plates (indices 0–11)
              rolledType = Math.floor(Math.random() * 12);
            }
            const rolledLoot = lootItemTypes[rolledType];
            if (rolledLoot.isGrowPlate || rolledLoot.isModule) {
              // Modules & grow plates go straight to the Patch Bay — one physical copy per type
              const alreadyHas = patchBaySlots.some(s => s.itemType === rolledType);
              if (!alreadyHas) {
                const emptyBay = patchBaySlots.find(s => s.count === 0);
                if (emptyBay) {
                  emptyBay.itemType = rolledType;
                  emptyBay.count    = 1;
                  emptyBay.powered  = false;
                  const rareTag = rolledLoot.isHFSynth ? '🌟 ULTRA-RARE MODULE'
                                : rolledLoot.isModule  ? '✨ RARE MODULE'
                                : '🔌 MODULE';
                  showLootToast(rareTag + ' SALVAGED: ' + rolledLoot.label.toUpperCase() + ' — PLUG IT IN AT THE PATCH BAY');
                }
              }
            } else {
              // Consumables stack into the Cargo Hold
              const existingSlot = cargoSlots.find(s => s.itemType === rolledType && s.count > 0 && s.count < 3);
              const emptySlot    = cargoSlots.find(s => s.count === 0);
              const target = existingSlot || emptySlot;
              if (target) {
                target.itemType = rolledType;
                target.count = Math.min(3, target.count + 1);
              }
            }
          }

          const newRes = createResource();
          const angle = Math.random() * Math.PI * 2;
          const d = 30 + Math.random() * 25;
          // Anchor to the CURRENT region's center (same formula used
          // everywhere else), not world origin — otherwise replacement
          // pickups spawn near (0,0) regardless of which region the
          // player is actually in.
          const respawnRegionX = Math.floor(player.position.x / 200);
          const respawnRegionZ = Math.floor(player.position.z / 200);
          const respawnAnchorX = respawnRegionX * 200 + 100;
          const respawnAnchorZ = respawnRegionZ * 200 + 100;
          newRes.position.set(
            respawnAnchorX + Math.cos(angle) * d,
            (Math.random() - 0.5) * 6,
            respawnAnchorZ + Math.sin(angle) * d
          );
          scene.add(newRes);
          resources.push(newRes);

          if (inventoryOpen) renderInventory();
        }
      }
    } else {
      if (captureTarget) {
        captureTarget = null;
        captureTimer  = 0;
        document.getElementById('capture-bar-wrap').style.display = 'none';
      }
    }

    asteroids.forEach(a => {
      if (a.position.distanceTo(player.position) < a.userData.size + 2.2) {
        oxygen = Math.max(0, oxygen - 18);
        water  = Math.max(0, water  - 12);
        const knock = player.position.clone().sub(a.position).normalize().multiplyScalar(1.5);
        player.userData.velocity.add(knock);
      }
    });

    updateInvaders(delta);
    updateLaser(delta);
    updateLandmarks(delta);
    updateSpaceCows(delta);

    // Update canvas overlay animations for enhanced meshes
    landmarks.forEach(landmark => {
      if (landmark.userData.animate) {
        landmark.userData.animate(Date.now() / 1000);
      }
    });

    // Update station/farm overlay animations
    pinkStations.forEach(station => {
      if (station.mesh && station.mesh.userData.animate) {
        station.mesh.userData.animate(Date.now() / 1000);
      }
    });

    updateMines(delta);
    updateFarms(delta);
    updateStations(delta);
    updateDebris(delta);
  }

  updateCenterTriangle();
  updateHUD();
  updateMenuPlaytime();
  if (minimapEnabled && minimap && ctx) updateMinimap();
  drawCRT(delta);

  // Blink region beacon satellite (red warning light)
  if (regionBeacon.userData && regionBeacon.userData.beacon && regionBeacon.userData.blinkPhase !== undefined) {
    regionBeacon.userData.blinkPhase += delta * 5.5;
    const pulse = Math.max(0, Math.sin(regionBeacon.userData.blinkPhase));
    regionBeacon.userData.beacon.intensity = pulse * 3.2;
  }

  renderer.render(scene, camera);
}

function warpToNextRegion() {
  // Warp sound: theeew + thiukthukthuk stutter
  playBeep(1200, 0.45, 'sawtooth', 0.22); // theeew whoosh
  setTimeout(() => playBeep(420, 0.14, 'sine', 0.22), 280);
  setTimeout(() => playBeep(320, 0.12, 'sine', 0.22), 400);
  setTimeout(() => playBeep(250, 0.1, 'sine', 0.22), 510); // thuk thuk thuk
  loadingScreen.style.display = 'flex';
  loadingScreen.style.opacity = '1';

  const originalStarColor = starsMat.color.getHex();
  starsMat.color.setHex(0x88ccff);

  setTimeout(() => {
    resources.forEach(r => scene.remove(r));
    asteroids.forEach(a => scene.remove(a));
    landmarks.forEach(l => scene.remove(l));
    resources.length = 0;
    asteroids.length = 0;
    landmarks.length = 0;
    spaceCows.length = 0;
    spaceMines.forEach(m => scene.remove(m.mesh));
    spaceMines.length = 0;
    resourceFarms.forEach(f => scene.remove(f.mesh));
    resourceFarms.length = 0;
    pinkStations.forEach(s => scene.remove(s.mesh));
    pinkStations.length = 0;
    nearStation = null;
    closeStationPanel();
    const stationPromptEl2 = document.getElementById('station-prompt');
    if (stationPromptEl2) stationPromptEl2.style.display = 'none';
    debrisPieces.forEach(d => scene.remove(d));
    debrisPieces.length = 0;
    const warpDistance = 250;
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(player.quaternion);
    player.position.add(dir.multiplyScalar(warpDistance));

    generateNewRegionContent();
    updateCenterTriangle(); // triangle always points to the single fixed home beacon

    starsMat.color.setHex(originalStarColor);
    loadingScreen.style.opacity = '0';
    setTimeout(() => {
      loadingScreen.style.display = 'none';
    }, 600);
  }, 800);
}

function seededRandom(seed) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

function generateNewRegionContent() {
  resources.forEach(r => scene.remove(r));
  asteroids.forEach(a => scene.remove(a));
  landmarks.forEach(l => scene.remove(l));
  if (invaders.length) clearInvaders();
  resources.length = 0;
  asteroids.length = 0;
  landmarks.length = 0;
  spaceCows.length = 0;
  spaceMines.forEach(m => scene.remove(m.mesh));
  spaceMines.length = 0;
  resourceFarms.forEach(f => scene.remove(f.mesh));
  resourceFarms.length = 0;
  pinkStations.forEach(s => scene.remove(s.mesh));
  pinkStations.length = 0;
  nearStation = null;
  closeStationPanel();
  const stationPromptEl1 = document.getElementById('station-prompt');
  if (stationPromptEl1) stationPromptEl1.style.display = 'none';
  debrisPieces.forEach(d => scene.remove(d));
  debrisPieces.length = 0;

  const regionX = Math.floor(player.position.x / 200);
  const regionZ = Math.floor(player.position.z / 200);

  const anchorX = regionX * 200 + 100;
  const anchorZ = regionZ * 200 + 100;

  const seedBase = regionX * 10007 + regionZ * 73819;
  const regionType = Math.abs((regionX * 3 + regionZ * 7)) % 5;

  const numResources  = 6 + (regionType * 2);
  const numAsteroids  = 5 + regionType;
  const numJunk       = (regionType === 1 || regionType === 3) ? 4 : 0;
  const numSatellites = 0; // only the region beacon satellite per region
  const numWrecks      = (regionType === 3) ? 2 : 0;

  function spawnLootAround(centerPos, offset, count) {
    for (let i = 0; i < count; i++) {
      const base = offset + i * 13;
      const isSpecial = seededRandom(seedBase + base) < 0.18;
      let item;
      if (isSpecial) {
        const specIdx = Math.floor(seededRandom(seedBase + base + 5) * NORMAL_SPECIAL_COUNT);
        item = createSpecialItem(specIdx);
      } else {
        const typeIdx = Math.floor(seededRandom(seedBase + base + 7) * resourceTypes.length);
        item = createResource(typeIdx);
      }
      const angle = seededRandom(seedBase + base + 1) * Math.PI * 2;
      const dist  = 4 + seededRandom(seedBase + base + 2) * 9;
      item.position.set(
        centerPos.x + Math.cos(angle) * dist,
        centerPos.y + (seededRandom(seedBase + base + 3) - 0.5) * 4,
        centerPos.z + Math.sin(angle) * dist
      );
      scene.add(item);
      resources.push(item);
    }
  }

  for (let i = 0; i < numResources; i++) {
    const typeIdx = Math.floor(seededRandom(seedBase + i + 50) * resourceTypes.length);
    const res = createResource(typeIdx);
    const angle = seededRandom(seedBase + i) * Math.PI * 2;
    const dist  = 30 + seededRandom(seedBase + i + 100) * 50;
    res.position.set(
      anchorX + Math.cos(angle) * dist,
      seededRandom(seedBase + i + 200) * 10 - 5,
      anchorZ + Math.sin(angle) * dist
    );
    scene.add(res);
    resources.push(res);
  }

  for (let i = 0; i < numAsteroids; i++) {
    const size = 1.8 + seededRandom(seedBase + i + 400) * 2.2;
    const ast  = createAsteroid(size);
    const angle = seededRandom(seedBase + i + 300) * Math.PI * 2;
    const dist  = 40 + seededRandom(seedBase + i + 401) * 60;
    ast.position.set(
      anchorX + Math.cos(angle) * dist,
      seededRandom(seedBase + i + 500) * 8 - 4,
      anchorZ + Math.sin(angle) * dist
    );
    scene.add(ast);
    asteroids.push(ast);
  }

  for (let i = 0; i < numJunk; i++) {
    const size = 0.4 + seededRandom(seedBase + i + 610) * 0.6;
    const junk = createAsteroid(size);
    junk.scale.set(0.3, 0.3, 0.3);
    const angle = seededRandom(seedBase + i + 600) * Math.PI * 2;
    const dist  = 20 + seededRandom(seedBase + i + 700) * 40;
    junk.position.set(
      anchorX + Math.cos(angle) * dist,
      seededRandom(seedBase + i + 800) * 6 - 3,
      anchorZ + Math.sin(angle) * dist
    );
    scene.add(junk);
    asteroids.push(junk);
  }

  for (let i = 0; i < numSatellites; i++) {
    const sat = createSatellite();
    const angle = seededRandom(seedBase + i + 900) * Math.PI * 2;
    const dist  = 60 + seededRandom(seedBase + i + 1000) * 40;
    const satPos = new THREE.Vector3(
      anchorX + Math.cos(angle) * dist,
      seededRandom(seedBase + i + 1100) * 15 - 7,
      anchorZ + Math.sin(angle) * dist
    );
    sat.position.copy(satPos);
    sat.rotation.y = seededRandom(seedBase + i + 1150) * Math.PI * 2;
    scene.add(sat);
    landmarks.push(sat);

    spawnLootAround(satPos, 2000 + i * 60, 4);
  }

  for (let i = 0; i < numWrecks; i++) {
    const wreck = createWreck(seedBase + i * 123 + 1);
    const angle = seededRandom(seedBase + i + 1200) * Math.PI * 2;
    const dist  = 35 + seededRandom(seedBase + i + 1300) * 45;
    const wreckPos = new THREE.Vector3(
      anchorX + Math.cos(angle) * dist,
      seededRandom(seedBase + i + 1400) * 6 - 3,
      anchorZ + Math.sin(angle) * dist
    );
    wreck.position.copy(wreckPos);
    wreck.rotation.y = seededRandom(seedBase + i + 1500) * Math.PI * 2;
    scene.add(wreck);
    landmarks.push(wreck);

    spawnLootAround(wreckPos, 3000 + i * 60, 5);
  }

  // === RESOURCE FARMS: 1-2 per region, one of each type across regions ===
  const numFarms = 1 + Math.floor(seededRandom(seedBase + 8001) * 2);
  for (let i = 0; i < numFarms; i++) {
    const farmTypeIdx = (Math.abs(regionX + regionZ + i)) % farmTypes.length;
    const farmAngle = seededRandom(seedBase + 8002 + i) * Math.PI * 2;
    const farmDist  = 25 + seededRandom(seedBase + 8003 + i) * 30;
    const farmPos   = new THREE.Vector3(
      anchorX + Math.cos(farmAngle) * farmDist,
      seededRandom(seedBase + 8004 + i) * 8 - 4,
      anchorZ + Math.sin(farmAngle) * farmDist
    );
    spawnFarm(farmTypeIdx, farmPos);
  }

  // === PINK STATIONS: calculated locations, contents persist via save file ===
  spawnStationIfPresent(regionX, regionZ, anchorX, anchorZ, seedBase);

  // === SPACE MINES: scattered in asteroid-heavy regions ===
  const numMines = regionType >= 2 ? (2 + Math.floor(seededRandom(seedBase + 8100) * 3)) : (Math.floor(seededRandom(seedBase + 8100) * 2));
  for (let i = 0; i < numMines; i++) {
    const mineAngle = seededRandom(seedBase + 8101 + i) * Math.PI * 2;
    const mineDist  = 20 + seededRandom(seedBase + 8102 + i) * 45;
    const minePos   = new THREE.Vector3(
      anchorX + Math.cos(mineAngle) * mineDist,
      seededRandom(seedBase + 8103 + i) * 10 - 5,
      anchorZ + Math.sin(mineAngle) * mineDist
    );
    spawnMine(minePos);
  }

  const cowRoll = seededRandom(seedBase + 7777);
  if (cowRoll < 0.04) {
    const cow = createSpaceCow();
    const angle = seededRandom(seedBase + 7778) * Math.PI * 2;
    const dist  = 45 + seededRandom(seedBase + 7779) * 55;
    const baseY = seededRandom(seedBase + 7780) * 14 - 7;
    cow.position.set(
      anchorX + Math.cos(angle) * dist,
      baseY,
      anchorZ + Math.sin(angle) * dist
    );
    cow.userData.baseY = baseY;
    cow.rotation.y = seededRandom(seedBase + 7781) * Math.PI * 2;
    scene.add(cow);
    resources.push(cow);
    spaceCows.push(cow);
  }

  const invaderRoll = seededRandom(seedBase + 9999);
  if (invaderRoll < 0.40) {
    const invAngle = seededRandom(seedBase + 9998) * Math.PI * 2;
    const invDist  = 20 + seededRandom(seedBase + 9997) * 18;
    const invPos = new THREE.Vector3(
      anchorX + Math.cos(invAngle) * invDist,
      seededRandom(seedBase + 9996) * 6 - 3,
      anchorZ + Math.sin(invAngle) * invDist
    );
    setTimeout(() => spawnInvaderSquad(invPos), 1400);
  }

  const rc = document.getElementById('region-coords');
  if (rc) {
    const typeNames = ['DEBRIS FIELD','JUNK YARD','SATELLITE GRAVEYARD','WRECK FIELD','COMMS RELAY'];
    rc.textContent = `SECTOR ${regionX},${regionZ}  •  ${typeNames[regionType]}`;
    rc.style.display = 'block';
    // Position above ingame-stats bar (which now spans the bottom of the screen)
    const stats = document.getElementById('ingame-stats');
    if (stats && stats.style.display !== 'none') {
      const sr = stats.getBoundingClientRect();
      rc.style.top  = (sr.top - rc.offsetHeight - 6) + 'px';
      rc.style.right = '20px';
      rc.style.left  = 'auto';
    } else {
      rc.style.top  = '20px';
      rc.style.right = '20px';
      rc.style.left  = 'auto';
    }
  }
}

function scanNextRegion() {
  if (scanActive) return;

  // Echo location style sector scan sound (ping chirps)
  playBeep(1800, 0.05, 'sine', 0.2);
  setTimeout(() => playBeep(1600, 0.04, 'sine', 0.2), 70);
  setTimeout(() => playBeep(1400, 0.04, 'sine', 0.2), 140);
  setTimeout(() => playBeep(1200, 0.04, 'sine', 0.2), 210);

  const now = Date.now();
  scanTimestamps = scanTimestamps.filter(t => now - t < 60000);
  if (scanTimestamps.length >= SCAN_MAX_PER_MIN) {
    const oldest = scanTimestamps[0];
    const waitSec = Math.ceil((60000 - (now - oldest)) / 1000);
    const overlay   = document.getElementById('scan-overlay');
    const resultsEl = document.getElementById('scan-results');
    resultsEl.innerHTML = `
      <div style="color:#f84; font-size:16px; margin-bottom:12px; letter-spacing:2px;">⚠ SCANNER COOLDOWN</div>
      <div style="color:#ff8;">Scanner array overheated.</div>
      <div style="margin-top:10px; color:#aaa;">Ready in <span style="color:#0ff;">${waitSec}s</span></div>
      <div style="margin-top:8px; font-size:11px; opacity:0.6;">Max ${SCAN_MAX_PER_MIN} scans per minute</div>
    `;
    overlay.style.display = 'block';
    setTimeout(() => { overlay.style.display = 'none'; }, 2500);
    return;
  }

  scanTimestamps.push(now);
  scanActive = true;

  const scanDist = 250;
  const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(player.quaternion);
  const scanPos = player.position.clone().add(dir.multiplyScalar(scanDist));

  const regionX = Math.floor(scanPos.x / 200);
  const regionZ = Math.floor(scanPos.z / 200);
  const regionType = Math.abs((regionX * 3 + regionZ * 7)) % 5;

  const typeNames = ['DEBRIS FIELD', 'JUNK YARD', 'SATELLITE GRAVEYARD', 'WRECK FIELD', 'COMMS RELAY'];
  const numRes    = 6 + (regionType * 2);
  const numAst    = 5 + regionType;
  const numJunk   = (regionType === 1 || regionType === 3) ? 4 : 0;
  const numSat    = (regionType === 2 || regionType === 4) ? 3 : 0;
  const numWrk    = (regionType === 3) ? 2 : 0;
  const threatLvl = ['LOW', 'MEDIUM', 'MEDIUM', 'HIGH', 'HIGH'][regionType];
  const threatCol = ['#0f8', '#ff8', '#ff8', '#f84', '#f84'][regionType];

  const overlay   = document.getElementById('scan-overlay');
  const resultsEl = document.getElementById('scan-results');

  resultsEl.innerHTML = `
    <div style="color:#0ff; font-size:16px; margin-bottom:12px; letter-spacing:2px;">◈ REGION SCAN ◈</div>
    <div style="margin-bottom:8px;">BEARING: ${Math.round(THREE.MathUtils.radToDeg(-player.rotation.y) % 360)}°</div>
    <div style="margin-bottom:8px;">SECTOR: <span style="color:#ff0;">${regionX}, ${regionZ}</span></div>
    <div style="margin-bottom:8px;">TYPE: <span style="color:#aff;">${typeNames[regionType]}</span></div>
    <div style="margin-bottom:4px; border-top:1px solid #0aa; padding-top:8px;">RESOURCES: ${numRes} nodes</div>
    <div style="margin-bottom:4px;">ASTEROIDS: ${numAst + numJunk} objects</div>
    ${numSat > 0 ? `<div style="margin-bottom:4px;">SATELLITES: ${numSat} detected — salvage nearby</div>` : ''}
    ${numWrk > 0 ? `<div style="margin-bottom:4px;">WRECKS: ${numWrk} detected — salvage nearby</div>` : ''}
    <div style="margin-top:8px; border-top:1px solid #0aa; padding-top:8px;">THREAT: <span style="color:${threatCol};">${threatLvl}</span></div>
    <div style="margin-top:8px; font-size:11px; opacity:0.5;">Scans used: ${scanTimestamps.length}/${SCAN_MAX_PER_MIN} this minute</div>
    <div style="margin-top:6px; font-size:11px; opacity:0.6;">Press T to warp to this region</div>
  `;

  overlay.style.display = 'block';

  const scanSeedBase = regionX * 10007 + regionZ * 73819;
  if (seededRandom(scanSeedBase + 9999) < 0.20) {
    spawnInvaderSquadNearPlayer();
  }

  setTimeout(() => {
    overlay.style.display = 'none';
    scanActive = false;
  }, 5000);
}

// === INVADER SYSTEM ===
// Active squad — array of invader objects
const invaders = [];

// Pixel art bitmaps: red (type 0) and blue (type 1)
const INVADER_PIXELS = [
  // Red — aggressive angular shape
  [
    [0,0,1,0,0,0,0,0,1,0,0],
    [0,0,0,1,0,0,0,1,0,0,0],
    [0,1,1,1,1,1,1,1,1,1,0],
    [1,1,0,1,1,1,1,1,0,1,1],
    [1,1,1,1,1,1,1,1,1,1,1],
    [0,1,0,1,0,1,0,1,0,1,0],
    [1,0,1,0,0,0,0,0,1,0,1],
    [0,1,0,0,0,0,0,0,0,1,0],
  ],
  // Blue — rounder scout shape
  [
    [0,0,0,1,0,0,0,1,0,0,0],
    [0,0,1,1,1,1,1,1,1,0,0],
    [0,1,1,0,1,1,1,0,1,1,0],
    [1,1,1,1,1,1,1,1,1,1,1],
    [1,0,1,1,1,1,1,1,1,0,1],
    [1,0,1,0,0,0,0,0,1,0,1],
    [0,0,0,1,0,0,0,1,0,0,0],
    [0,0,1,0,0,0,0,0,1,0,0],
  ]
];

const INVADER_COLORS = ['#ff2222', '#2255ff'];
const INVADER_BULLET_COLORS = [0xff3300, 0x3366ff];
const INVADER_GLOW = ['rgba(255,40,0,', 'rgba(40,80,255,'];

function makeInvaderTexture(type) {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const x = c.getContext('2d');
  const px = INVADER_PIXELS[type];
  const ps = 5;
  const offX = 1, offY = 4;
  // Shadow/glow pass
  x.fillStyle = type === 0 ? 'rgba(255,0,0,0.25)' : 'rgba(0,80,255,0.25)';
  px.forEach((row, ry) => {
    row.forEach((cell, rx) => {
      if (cell) x.fillRect(offX + rx * ps - 1, offY + ry * ps - 1, ps + 2, ps + 2);
    });
  });
  x.fillStyle = INVADER_COLORS[type];
  px.forEach((row, ry) => {
    row.forEach((cell, rx) => {
      if (cell) x.fillRect(offX + rx * ps, offY + ry * ps, ps - 1, ps - 1);
    });
  });
  return new THREE.CanvasTexture(c);
}

function spawnInvaderSquad(anchorPos) {
  // Clear any existing squad first
  clearInvaders();
  // Space Invaders style tune on spawn ("turn up")
  playBeep(150,0.08,'square',0.2);
  setTimeout(()=>playBeep(200,0.08,'square',0.2),120);
  setTimeout(()=>playBeep(250,0.08,'square',0.2),240);
  setTimeout(()=>playBeep(300,0.08,'square',0.2),360);

  const count = 1 + Math.floor(Math.random() * 3); // 1–3 invaders
  for (let i = 0; i < count; i++) {
    const type  = Math.random() < 0.5 ? 0 : 1; // 0=red, 1=blue
    const hp    = type === 0 ? 3 : 2;           // red tankier
    const speed = type === 0 ? 12 : 18;         // blue faster

    const tex = makeInvaderTexture(type);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 1.0 });
    const sprite = new THREE.Sprite(mat);
    const size = type === 0 ? 9 : 7;
    sprite.scale.set(size, size, 1);

    // Spread squad around anchor
    const angle  = (i / count) * Math.PI * 2 + Math.random() * 0.5;
    const spread = 8 + Math.random() * 6;
    const spawnPos = anchorPos.clone().add(new THREE.Vector3(
      Math.cos(angle) * spread,
      (Math.random() - 0.5) * 6,
      Math.sin(angle) * spread
    ));
    sprite.position.copy(spawnPos);
    scene.add(sprite);

    // Point light for glow
    const glow = new THREE.PointLight(
      type === 0 ? 0xff2200 : 0x2244ff,
      1.2, 18
    );
    glow.position.copy(spawnPos);
    scene.add(glow);

    const fleeDir = new THREE.Vector3(
      (Math.random() - 0.5), 0.3 + Math.random() * 0.3, (Math.random() - 0.5)
    ).normalize();

    invaders.push({
      sprite, glow, type, hp,
      speed, fleeDir,
      phase: 'appear',   // appear → strafe → shoot → strafe → ...
      timer: 0,
      strafeAngle: Math.random() * Math.PI * 2,
      strafeRadius: 14 + Math.random() * 8,
      bullets: [],
      shotCooldown: 0,
      hitFlash: 0,
      dead: false
    });
  }
}

function spawnInvaderSquadNearPlayer() {
  const fwd  = new THREE.Vector3(0, 0, -1).applyQuaternion(player.quaternion);
  const pos  = player.position.clone().add(fwd.multiplyScalar(28))
    .add(new THREE.Vector3((Math.random()-0.5)*12, (Math.random()-0.5)*6, (Math.random()-0.5)*12));
  spawnInvaderSquad(pos);
}

function fireInvaderBullet(inv) {
  playBeep(900,0.05,'square',0.15); // bleep bleep on invader shot
  const geo = new THREE.SphereGeometry(0.3, 6, 6);
  const mat = new THREE.MeshBasicMaterial({
    color: INVADER_BULLET_COLORS[inv.type],
    transparent: true, opacity: 0.9,
    blending: THREE.AdditiveBlending
  });
  const b = new THREE.Mesh(geo, mat);
  b.position.copy(inv.sprite.position);

  // Aim at player with slight spread
  const toPlayer = player.position.clone().sub(inv.sprite.position).normalize();
  const spread = 0.06;
  toPlayer.x += (Math.random()-0.5)*spread;
  toPlayer.y += (Math.random()-0.5)*spread;
  toPlayer.z += (Math.random()-0.5)*spread;
  toPlayer.normalize();

  const speed = 22 + Math.random() * 10;
  b.userData.vel = toPlayer.multiplyScalar(speed);
  b.userData.life = 0;

  // Glow corona
  const glowGeo = new THREE.SphereGeometry(0.7, 6, 6);
  const glowMat = new THREE.MeshBasicMaterial({
    color: INVADER_BULLET_COLORS[inv.type],
    transparent: true, opacity: 0.22,
    blending: THREE.AdditiveBlending
  });
  b.add(new THREE.Mesh(glowGeo, glowMat));

  scene.add(b);
  inv.bullets.push(b);
}

function clearInvaders() {
  invaders.forEach(inv => {
    scene.remove(inv.sprite);
    scene.remove(inv.glow);
    inv.bullets.forEach(b => scene.remove(b));
  });
  invaders.length = 0;
}

function updateInvaders(delta) {
  if (!invaders.length) return;

  for (let i = invaders.length - 1; i >= 0; i--) {
    const inv = invaders[i];
    inv.timer += delta;
    inv.hitFlash = Math.max(0, inv.hitFlash - delta * 4);

    // Hit flash tint
    if (inv.hitFlash > 0) {
      inv.sprite.material.color.setRGB(1, 1 - inv.hitFlash, 1 - inv.hitFlash);
    } else {
      inv.sprite.material.color.setRGB(1, 1, 1);
    }

    // --- APPEAR ---
    if (inv.phase === 'appear') {
      inv.sprite.position.y += Math.sin(inv.timer * 5) * 0.04;
      inv.glow.position.copy(inv.sprite.position);
      if (inv.timer > 0.9) {
        inv.phase = 'strafe';
        inv.timer = 0;
      }
    }

    // --- STRAFE (orbit player, get into position) ---
    if (inv.phase === 'strafe') {
      inv.strafeAngle += delta * (inv.type === 1 ? 1.1 : 0.7);
      const orbitCenter = player.position.clone();
      const targetPos = orbitCenter.clone().add(new THREE.Vector3(
        Math.cos(inv.strafeAngle) * inv.strafeRadius,
        Math.sin(inv.timer * 0.4) * 3,
        Math.sin(inv.strafeAngle) * inv.strafeRadius
      ));
      // Smooth move toward orbit position
      inv.sprite.position.lerp(targetPos, delta * 1.8);
      inv.glow.position.copy(inv.sprite.position);

      inv.shotCooldown -= delta;
      if (inv.shotCooldown <= 0 && inv.timer > 0.8) {
        // Fire burst: red fires 1 shot, blue fires 2
        const shots = inv.type === 0 ? 1 : 2;
        for (let s = 0; s < shots; s++) {
          setTimeout(() => {
            if (!inv.dead) fireInvaderBullet(inv);
          }, s * 180);
        }
        inv.shotCooldown = inv.type === 0 ? 2.2 : 1.6;
      }

      // After strafing long enough, keep strafing (they fight until killed or player escapes)
    }

    // --- FLEE (when hit enough or player warps) ---
    if (inv.phase === 'flee') {
      inv.sprite.position.addScaledVector(inv.fleeDir, delta * 40);
      inv.glow.position.copy(inv.sprite.position);
      inv.sprite.material.opacity = Math.max(0, 1 - inv.timer * 2);
      inv.glow.intensity = Math.max(0, 1.2 - inv.timer * 2);
      if (inv.timer > 0.8) {
        scene.remove(inv.sprite);
        scene.remove(inv.glow);
        inv.bullets.forEach(b => scene.remove(b));
        invaders.splice(i, 1);
      }
      continue;
    }

    // --- UPDATE BULLETS ---
    for (let j = inv.bullets.length - 1; j >= 0; j--) {
      const b = inv.bullets[j];
      b.position.addScaledVector(b.userData.vel, delta);
      b.userData.life += delta;
      b.rotation.x += delta * 3;

      // Hit player
      if (b.position.distanceTo(player.position) < 3.0) {
        // Damage: oxygen hit, small amount
        oxygen = Math.max(0, oxygen - 8);
        showLootToast(inv.type === 0 ? '🔴 HULL HIT — O₂ -8' : '🔵 HULL HIT — O₂ -8');
        scene.remove(b);
        inv.bullets.splice(j, 1);
        continue;
      }
      // Expire
      if (b.userData.life > 3.5) {
        scene.remove(b);
        inv.bullets.splice(j, 1);
      }
    }
  }
}

// Legacy single-invader shim (used by scan cooldown path)
let activeInvader = null;
function spawnInvader() { spawnInvaderSquadNearPlayer(); }

window.addEventListener('resize', resizeRenderer);

// === CRT OVERLAY ===
function crtResize() {
  crtW = crtCanvas.width  = window.innerWidth;
  crtH = crtCanvas.height = window.innerHeight;
}
crtResize();

function drawCRT(delta) {
  crtCtx.clearRect(0, 0, crtW, crtH);

  for (let y = 0; y < crtH; y += 2) {
    crtCtx.fillStyle = 'rgba(0,0,0,0.20)';
    crtCtx.fillRect(0, y, crtW, 1);
  }

  crtCtx.fillStyle = 'rgba(0,18,4,0.07)';
  crtCtx.fillRect(0, 0, crtW, crtH);

  const fringe = crtCtx.createLinearGradient(0, 0, crtW, 0);
  fringe.addColorStop(0,   'rgba(255,0,0,0.03)');
  fringe.addColorStop(0.5, 'rgba(0,0,0,0)');
  fringe.addColorStop(1.0, 'rgba(0,0,255,0.03)');
  crtCtx.fillStyle = fringe;
  crtCtx.fillRect(0, 0, crtW, crtH);

  const vig = crtCtx.createRadialGradient(
    crtW * 0.5, crtH * 0.5, crtH * 0.22,
    crtW * 0.5, crtH * 0.5, crtH * 0.82
  );
  vig.addColorStop(0,   'rgba(0,0,0,0)');
  vig.addColorStop(0.55,'rgba(0,0,0,0.10)');
  vig.addColorStop(1.0, 'rgba(0,0,0,0.78)');
  crtCtx.fillStyle = vig;
  crtCtx.fillRect(0, 0, crtW, crtH);

  crtRollY = (crtRollY + delta * 26) % crtH;
  const roll = crtCtx.createLinearGradient(0, crtRollY - 35, 0, crtRollY + 35);
  roll.addColorStop(0,   'rgba(255,215,0,0)');
  roll.addColorStop(0.5, 'rgba(255,215,0,0.08)');
  roll.addColorStop(1,   'rgba(255,215,0,0)');
  crtCtx.fillStyle = roll;
  crtCtx.fillRect(0, crtRollY - 35, crtW, 70);

  const topBar = crtCtx.createLinearGradient(0, 0, 0, crtH * 0.07);
  topBar.addColorStop(0, 'rgba(0,0,0,0.5)');
  topBar.addColorStop(1, 'rgba(0,0,0,0)');
  crtCtx.fillStyle = topBar;
  crtCtx.fillRect(0, 0, crtW, crtH * 0.07);

  const botBar = crtCtx.createLinearGradient(0, crtH * 0.93, 0, crtH);
  botBar.addColorStop(0, 'rgba(0,0,0,0)');
  botBar.addColorStop(1, 'rgba(0,0,0,0.5)');
  crtCtx.fillStyle = botBar;
  crtCtx.fillRect(0, crtH * 0.93, crtW, crtH * 0.07);

  const lBar = crtCtx.createLinearGradient(0, 0, crtW * 0.05, 0);
  lBar.addColorStop(0, 'rgba(0,0,0,0.4)');
  lBar.addColorStop(1, 'rgba(0,0,0,0)');
  crtCtx.fillStyle = lBar;
  crtCtx.fillRect(0, 0, crtW * 0.05, crtH);

  const rBar = crtCtx.createLinearGradient(crtW * 0.95, 0, crtW, 0);
  rBar.addColorStop(0, 'rgba(0,0,0,0)');
  rBar.addColorStop(1, 'rgba(0,0,0,0.4)');
  crtCtx.fillStyle = rBar;
  crtCtx.fillRect(crtW * 0.95, 0, crtW * 0.05, crtH);
}


// === CLI TERMINAL ENGINE ===
const cliOutput = document.getElementById('cli-output');
const cliInput  = document.getElementById('cli-input');
let cliHistory = [], cliHistIdx = -1;

function cliPrint(text, color) {
  if (!cliOutput) return;
  const line = document.createElement('div');
  line.textContent = text;
  if (color) line.style.color = color;
  cliOutput.appendChild(line);
  cliOutput.scrollTop = cliOutput.scrollHeight;
}

const cliCommands = {
  help: () => {
    cliPrint('Available commands:', '#0ff');
    cliPrint('  status          — print current vitals');
    cliPrint('  set <res> <val> — set resource (o2/h2o/food/fuel) 0-100');
    cliPrint('  fill            — fill all vitals to 100');
    cliPrint('  warp            — jump to next region');
    cliPrint('  clear           — clear terminal');
    cliPrint('  pause / resume  — toggle game state');
    cliPrint('  version         — build info');
    cliPrint('  quit            — close window (desktop only)');
    cliPrint('  ── AUTO-PILOT (requires Auto-Pilot module powered) ──', '#00ccff');
    cliPrint('  ap status       — show auto-pilot state');
    cliPrint('  ap on / off     — enable/disable auto-pilot steering');
    cliPrint('  ap rule <res> <minPct> — only collect <res> when below <minPct>%');
    cliPrint('  ap rules        — list active collection rules');
    cliPrint('  ap clearrules   — clear all collection rules');
    cliPrint('  ── RESOURCE MANAGER (requires Resource Manager module powered) ──', '#ffcc00');
    cliPrint('  rm status       — show resource manager rules');
    cliPrint('  rm warn <res> <threshold>  — warn when resource drops below %');
    cliPrint('  rm fill <res> <threshold>  — auto-top resource when below %');
    cliPrint('  rm remove <index>          — remove rule by index');
    cliPrint('  rm clear                   — clear all rules');
    cliPrint('  rm on / off                — enable/disable resource manager');
  },
  status: () => {
    cliPrint(`O₂:   ${Math.floor(oxygen)}%`, oxygen < 25 ? '#f44' : '#0f8');
    cliPrint(`H₂O:  ${Math.floor(water)}%`, water  < 25 ? '#f44' : '#48f');
    cliPrint(`FOOD: ${Math.floor(food)}%`,  food   < 25 ? '#f44' : '#fa0');
    cliPrint(`FUEL: ${Math.floor(fuel)}%`,  fuel   < 25 ? '#f44' : '#f84');
    cliPrint(`TIME: ${formatPlaytime(playTimeSeconds)}`, '#0aa');
  },
  fill: () => { oxygen = water = food = fuel = 100; cliPrint('All vitals set to 100.', '#0f8'); },
  warp: () => { warpToNextRegion(); cliPrint('Initiating warp…', '#aff'); },
  clear: () => { if(cliOutput) cliOutput.innerHTML = ''; },
  pause: () => { gameActive = false; cliPrint('Game paused.', '#fa0'); },
  resume: () => {
    if (document.getElementById('main-menu').style.display !== 'none') {
      cliPrint('Close the menu first (M).', '#f44'); return;
    }
    gameActive = true; cliPrint('Game resumed.', '#0f8');
  },
  version: () => { cliPrint('Headlight-Fluid v3.1 — Three.js build. CLI active. by holdenkeyboard@gmail.com', '#aff'); },
  quit: () => {
    if (hasPyAPI()) { window.pywebview.api.quit(); }
    else { cliPrint('quit only works in desktop build.', '#f84'); }
  },
};

function cliExec(raw) {
  const parts = raw.trim().split(/\s+/);
  const cmd = parts[0].toLowerCase();
  cliPrint('pod> ' + raw, '#0ff');

  if (cmd === 'set') {
    const res = parts[1]; const val = parseFloat(parts[2]);
    const map = {o2:'oxygen', h2o:'water', food:'food', fuel:'fuel'};
    if (!map[res] || isNaN(val)) { cliPrint('Usage: set <o2|h2o|food|fuel> <0-100>', '#f44'); return; }
    const clamped = Math.min(100, Math.max(0, val));
    if (res === 'o2') oxygen = clamped;
    else if (res === 'h2o') water = clamped;
    else if (res === 'food') food = clamped;
    else if (res === 'fuel') fuel = clamped;
    cliPrint(`${res.toUpperCase()} set to ${clamped}.`, '#0f8');
    return;
  }

  // ── AUTO-PILOT commands ──
  if (cmd === 'ap') {
    if (!autoPilot.enabled) { cliPrint('Auto-Pilot module not powered. Install & power it first.', '#f44'); return; }
    const sub = (parts[1] || '').toLowerCase();
    if (sub === 'on')  { autoPilot.active = true;  cliPrint('Auto-Pilot: ENGAGED 🤖', '#00ccff'); }
    else if (sub === 'off') { autoPilot.active = false; cliPrint('Auto-Pilot: disengaged.', '#aaa'); }
    else if (sub === 'status') {
      cliPrint(`Auto-Pilot: ${autoPilot.active ? 'ENGAGED' : 'standby'}`, autoPilot.active ? '#00ccff' : '#aaa');
      cliPrint(`Collection range: ${(3.2 * 4).toFixed(1)} units (4×)`, '#0f8');
      if (autoPilot.rules.length === 0) cliPrint('No collection rules set (collects everything).', '#888');
      else autoPilot.rules.forEach((r,i) => cliPrint(`  [${i}] collect ${r.resource.toUpperCase()} when < ${r.minPct}%`, '#00ccff'));
    }
    else if (sub === 'rule') {
      const res = (parts[2]||'').toLowerCase(); const pct = parseFloat(parts[3]);
      if (!['o2','h2o','food','fuel'].includes(res) || isNaN(pct)) { cliPrint('Usage: ap rule <o2|h2o|food|fuel> <minPct>', '#f44'); return; }
      autoPilot.rules.push({ resource: res, minPct: pct });
      cliPrint(`AP rule added: collect ${res.toUpperCase()} when below ${pct}%`, '#00ccff');
    }
    else if (sub === 'rules') {
      if (autoPilot.rules.length === 0) cliPrint('No rules. Collecting everything.', '#888');
      else autoPilot.rules.forEach((r,i) => cliPrint(`  [${i}] ${r.resource.toUpperCase()} < ${r.minPct}%`, '#00ccff'));
    }
    else if (sub === 'clearrules') { autoPilot.rules = []; cliPrint('AP rules cleared.', '#aaa'); }
    else cliPrint('Unknown ap sub-command. Type help.', '#f44');
    return;
  }

  // ── RESOURCE MANAGER commands ──
  if (cmd === 'rm') {
    if (!resManager.enabled) { cliPrint('Resource Manager module not powered. Install & power it first.', '#f44'); return; }
    const sub = (parts[1] || '').toLowerCase();
    if (sub === 'on')  { cliPrint('Resource Manager already running (controlled by module power).', '#ffcc00'); }
    else if (sub === 'off') { cliPrint('To disable, unplug the Resource Manager module in the patch bay.', '#ffcc00'); }
    else if (sub === 'status') {
      cliPrint(`Resource Manager: ACTIVE`, '#ffcc00');
      if (resManager.rules.length === 0) cliPrint('No rules configured.', '#888');
      else resManager.rules.forEach((r,i) => cliPrint(`  [${i}] ${r.action.toUpperCase()} when ${r.resource.toUpperCase()} < ${r.threshold}%`, '#ffcc00'));
    }
    else if (sub === 'warn' || sub === 'fill') {
      const res = (parts[2]||'').toLowerCase(); const thr = parseFloat(parts[3]);
      if (!['o2','h2o','food','fuel'].includes(res) || isNaN(thr)) { cliPrint(`Usage: rm ${sub} <o2|h2o|food|fuel> <threshold>`, '#f44'); return; }
      resManager.rules.push({ resource: res, action: sub, threshold: thr });
      cliPrint(`RM rule: ${sub.toUpperCase()} when ${res.toUpperCase()} < ${thr}%`, '#ffcc00');
    }
    else if (sub === 'remove') {
      const idx = parseInt(parts[2]);
      if (isNaN(idx) || idx < 0 || idx >= resManager.rules.length) { cliPrint('Invalid index.', '#f44'); return; }
      const removed = resManager.rules.splice(idx, 1)[0];
      cliPrint(`Removed rule [${idx}]: ${removed.action} ${removed.resource} < ${removed.threshold}%`, '#aaa');
    }
    else if (sub === 'clear') { resManager.rules = []; cliPrint('All RM rules cleared.', '#aaa'); }
    else cliPrint('Unknown rm sub-command. Type help.', '#f44');
    return;
  }

  if (cliCommands[cmd]) { cliCommands[cmd](); }
  else if (cmd) { cliPrint(`Unknown command: ${cmd}. Type 'help'.`, '#f84'); }
}

if (cliInput) {
  cliInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const val = cliInput.value; cliInput.value = '';
      if (val.trim()) { cliHistory.unshift(val); cliHistIdx = -1; cliExec(val); }
    } else if (e.key === 'ArrowUp') {
      if (cliHistIdx < cliHistory.length - 1) cliHistIdx++;
      cliInput.value = cliHistory[cliHistIdx] || '';
    } else if (e.key === 'ArrowDown') {
      if (cliHistIdx > 0) cliHistIdx--;
      else cliHistIdx = -1;
      cliInput.value = cliHistIdx >= 0 ? cliHistory[cliHistIdx] : '';
    } else if (e.key === 'Escape' || e.key === '`') {
      document.getElementById('cli-overlay').style.display = 'none';
    }
    e.stopPropagation(); // prevent game key handling
  });
  cliInput.addEventListener('keyup', e => e.stopPropagation());
  cliInput.addEventListener('keypress', e => e.stopPropagation());
}

updateHUD();
generateNewRegionContent();

// Hide CRT overlay and game canvas on startup since the menu is shown initially
const initialCrtCanvas = document.getElementById('crt-overlay');
if (initialCrtCanvas) initialCrtCanvas.style.display = 'none';
if (window.gameCanvas) window.gameCanvas.style.display = 'none';

animate();

// === MENU BACKGROUND DISABLED ===
// (previously showed animated starfield with drifting pod)

// Make menus & main menu scrollable (mobile/Android)
['main-menu','about-panel','keys-panel','saveload-panel','inventory','station-panel'].forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.style.overflowY = 'auto';
    el.style.maxHeight = '82vh';
    el.style.webkitOverflowScrolling = 'touch';
  }
});

console.log('%c[Headlight-Fluid] v3.1 loaded — by holdenkeyboard@gmail.com', 'color:#ff4400');
