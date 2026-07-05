// player.js — Quake2 themed player ship model (Toothpick hybrid starfighter)
// Extracted for separate library use. Include via script tag before game.js

function createHybridStarfighter() {
  const group = new THREE.Group();

  const FLAT = true;
  const matHull   = new THREE.MeshPhongMaterial({ color: 0xb8bcc0, shininess: 10, specular: 0x333333, flatShading: FLAT });
  const matDark   = new THREE.MeshPhongMaterial({ color: 0x22242a, shininess: 8, flatShading: FLAT });
  const matPanel  = new THREE.MeshPhongMaterial({ color: 0x1c1d22, shininess: 6, side: THREE.DoubleSide, flatShading: FLAT });
  const matBlue   = new THREE.MeshPhongMaterial({ color: 0x4488ff, emissive: 0x112244, shininess: 20, flatShading: FLAT });
  const matPylon  = new THREE.MeshPhongMaterial({ color: 0x55504a, shininess: 6, flatShading: FLAT });
  const matChrome = new THREE.MeshPhongMaterial({ color: 0xd8dde2, shininess: 30, specular: 0x888888, flatShading: FLAT });
  const matOrange = new THREE.MeshPhongMaterial({ color: 0xdd6622, emissive: 0x441100, shininess: 15, flatShading: FLAT });

  function addEdges(mesh, opacity, color) {
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(mesh.geometry),
      new THREE.LineBasicMaterial({ color: color || 0x00aaff, transparent: true, opacity: opacity !== undefined ? opacity : 0.6 })
    );
    mesh.add(edges);
  }

  // Central pod
  const pod = new THREE.Mesh(new THREE.IcosahedronGeometry(0.7, 0), matHull);
  pod.scale.set(1, 1, 1.25);
  pod.position.set(0, 0, -0.2);
  addEdges(pod, 0.25);
  group.add(pod);

  const canopy = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), matBlue);
  canopy.scale.set(1, 0.7, 1.3);
  canopy.position.set(0, 0.18, -0.85);
  group.add(canopy);

  const tailGeo = new THREE.CylinderGeometry(0.5, 0.34, 1.1, 6);
  const tail = new THREE.Mesh(tailGeo, matHull);
  tail.rotation.x = Math.PI / 2;
  tail.rotation.z = Math.PI / 6;
  tail.position.set(0, 0, 0.75);
  addEdges(tail, 0.25);
  group.add(tail);

  // Engine
  const engineRing = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.07, 6, 8), matDark);
  engineRing.position.set(0, 0, 1.32);
  group.add(engineRing);

  const engineGlowMat = new THREE.MeshBasicMaterial({ color: 0xfff2cc });
  const engineGlow = new THREE.Mesh(new THREE.CircleGeometry(0.26, 8), engineGlowMat);
  engineGlow.position.set(0, 0, 1.34);
  group.add(engineGlow);

  const engineLight = new THREE.PointLight(0xffddaa, 1.4, 12);
  engineLight.position.copy(engineGlow.position);
  group.add(engineLight);

  function createThrusterGlow() {
    const count = 8;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 0.25;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.25;
      pos[i * 3 + 2] = 0.3 + Math.random() * 0.35;
      col[i * 3 + 0] = 1.0;
      col[i * 3 + 1] = 0.55 + Math.random() * 0.35;
      col[i * 3 + 2] = 0.15;
      sz[i] = 0.07 + Math.random() * 0.05;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sz, 1));
    const mat = new THREE.PointsMaterial({
      size: 0.11, transparent: true, opacity: 0.0, vertexColors: true,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    const pts = new THREE.Points(geo, mat);
    pts.userData.baseOpacity = 0.65;
    return pts;
  }
  const mainGlow = createThrusterGlow();
  mainGlow.scale.set(1.6, 1.6, 1.6);
  mainGlow.position.copy(engineGlow.position);
  group.add(mainGlow);
  group.userData.thrusterGlow = [mainGlow];

  // Wings
  function buildWing(angleDeg) {
    const wing = new THREE.Group();

    const strutGeo = new THREE.CylinderGeometry(0.09, 0.12, 1.5, 5);
    const strut = new THREE.Mesh(strutGeo, matPylon);
    strut.rotation.z = Math.PI / 2;
    strut.position.set(0.85, 0, 0.1);
    wing.add(strut);

    const panelGeo = new THREE.CylinderGeometry(1.05, 1.05, 0.06, 6);
    const panel = new THREE.Mesh(panelGeo, matPanel);
    panel.rotation.z = Math.PI / 2;
    panel.rotation.y = Math.PI / 6;
    panel.position.set(1.75, 0, 0.1);
    addEdges(panel, 0.55, 0xff6622);
    wing.add(panel);

    const cannonGeo = new THREE.CylinderGeometry(0.045, 0.05, 0.9, 5);
    const cannon = new THREE.Mesh(cannonGeo, matDark);
    cannon.rotation.x = Math.PI / 2;
    cannon.position.set(1.75, 0, -0.55);
    wing.add(cannon);
    const cannonTip = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.02, 5, 6), matOrange);
    cannonTip.rotation.x = Math.PI / 2;
    cannonTip.position.set(1.75, 0, -1.0);
    wing.add(cannonTip);

    const screenCanvas = document.createElement('canvas');
    screenCanvas.width = 32; screenCanvas.height = 32;
    const screenTex = new THREE.CanvasTexture(screenCanvas);
    screenTex.magFilter = THREE.NearestFilter;
    screenTex.minFilter = THREE.NearestFilter;
    const screenMat = new THREE.MeshBasicMaterial({ map: screenTex, transparent: true });
    const screenGeo = new THREE.PlaneGeometry(0.55, 0.55);
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(1.75, 0, 0.35);
    screen.rotation.y = Math.PI;
    wing.add(screen);
    wing.userData.gifScreen = { canvas: screenCanvas, ctx: screenCanvas.getContext('2d'), tex: screenTex, frame: 0, timer: 0 };

    wing.rotation.z = angleDeg * Math.PI / 180;
    wing.position.z = 0.15;
    return wing;
  }

  const wings = [45, 135, 225, 315].map(angle => buildWing(angle));
  wings.forEach(w => group.add(w));
  group.userData.gifScreens = wings.map(w => w.userData.gifScreen);

  // Spotlight
  const spotGroup = new THREE.Group();
  spotGroup.position.set(0, 0.62, -0.95);

  const mountArm = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.35, 6), matPylon);
  mountArm.position.set(0, -0.17, 0);
  spotGroup.add(mountArm);

  const housingGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.55, 10, 1, true);
  const housing = new THREE.Mesh(housingGeo, matChrome);
  housing.rotation.x = Math.PI / 2;
  addEdges(housing, 0.5);
  spotGroup.add(housing);

  const backCap = new THREE.Mesh(new THREE.CircleGeometry(0.42, 10), matDark);
  backCap.rotation.x = Math.PI / 2;
  backCap.position.set(0, 0, 0.27);
  spotGroup.add(backCap);

  const lensMat = new THREE.MeshBasicMaterial({ color: 0xeaffff });
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.4, 10), lensMat);
  lens.rotation.x = -Math.PI / 2;
  lens.position.set(0, 0, -0.275);
  spotGroup.add(lens);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.41, 0.045, 6, 10), matChrome);
  rim.rotation.x = Math.PI / 2;
  rim.position.set(0, 0, -0.27);
  spotGroup.add(rim);

  group.add(spotGroup);
  group.userData.spotlightHousing = spotGroup;

  const flashLight = new THREE.SpotLight(0xaaffff, 0, 90, Math.PI / 5, 0.35, 1.1);
  flashLight.position.set(0, 0, 0);
  spotGroup.add(flashLight);
  const flashTarget = new THREE.Object3D();
  flashTarget.position.set(0, 0, -20);
  spotGroup.add(flashTarget);
  flashLight.target = flashTarget;
  group.userData.flashlight = flashLight;

  const beamConeGeo = new THREE.ConeGeometry(2.6, 8, 12, 1, true);
  const beamConeMat = new THREE.MeshBasicMaterial({
    color: 0xaaffff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false
  });
  const beamCone = new THREE.Mesh(beamConeGeo, beamConeMat);
  beamCone.rotation.x = -Math.PI / 2;
  beamCone.position.set(0, 0, -4.3);
  spotGroup.add(beamCone);
  group.userData.spotBeamCone = beamCone;

  group.userData.velocity = new THREE.Vector3();
  group.userData.flashlightOn = false;

  // Laser cannon
  const barrelGeo = new THREE.CylinderGeometry(0.06, 0.09, 1.4, 6);
  const barrelMat = new THREE.MeshPhongMaterial({ color: 0x334455, shininess: 20, specular: 0x556677, flatShading: FLAT });
  const barrel = new THREE.Mesh(barrelGeo, barrelMat);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, -0.45, 2.7);
  group.add(barrel);

  const muzzleGeo = new THREE.TorusGeometry(0.10, 0.03, 5, 8);
  const muzzleMat = new THREE.MeshPhongMaterial({ color: 0xff4400, emissive: 0x441100, shininess: 25, flatShading: FLAT });
  const muzzle = new THREE.Mesh(muzzleGeo, muzzleMat);
  muzzle.rotation.x = Math.PI / 2;
  muzzle.position.set(0, -0.45, 3.4);
  group.add(muzzle);

  const beamPoints = [
    new THREE.Vector3(0, -0.35, 3.25),
    new THREE.Vector3(0, -0.35, 3.25)
  ];
  const beamGeo = new THREE.BufferGeometry().setFromPoints(beamPoints);
  const beamMat = new THREE.LineBasicMaterial({ color: 0xff3300, linewidth: 2, transparent: true, opacity: 0 });
  const beam = new THREE.Line(beamGeo, beamMat);
  group.add(beam);
  group.userData.beam = beam;
  group.userData.beamGeo = beamGeo;

  const laserLight = new THREE.PointLight(0xff3300, 0, 20);
  laserLight.position.set(0, -0.35, 3.3);
  group.add(laserLight);
  group.userData.laserLight = laserLight;

  // Nameplate
  const tagCanvas = document.createElement('canvas');
  tagCanvas.width = 256; tagCanvas.height = 48;
  const tagCtx = tagCanvas.getContext('2d');
  tagCtx.clearRect(0, 0, 256, 48);
  tagCtx.fillStyle = 'rgba(0,8,20,0.88)';
  const tr = 6;
  tagCtx.beginPath();
  tagCtx.moveTo(tr, 0); tagCtx.lineTo(256 - tr, 0);
  tagCtx.arcTo(256, 0, 256, tr, tr); tagCtx.lineTo(256, 48 - tr);
  tagCtx.arcTo(256, 48, 256 - tr, 48, tr); tagCtx.lineTo(tr, 48);
  tagCtx.arcTo(0, 48, 0, 48 - tr, tr); tagCtx.lineTo(0, tr);
  tagCtx.arcTo(0, 0, tr, 0, tr); tagCtx.closePath();
  tagCtx.fill();
  tagCtx.strokeStyle = '#00ccff';
  tagCtx.lineWidth = 1.5;
  tagCtx.stroke();
  tagCtx.font = 'bold 22px monospace';
  tagCtx.fillStyle = '#00eeff';
  tagCtx.textAlign = 'center';
  tagCtx.textBaseline = 'middle';
  tagCtx.shadowColor = '#00ffff';
  tagCtx.shadowBlur = 10;
  tagCtx.fillText('TOOTHPICK', 128, 24);
  const tagTex = new THREE.CanvasTexture(tagCanvas);
  const tagGeo = new THREE.PlaneGeometry(2.6, 0.5);
  const tagMat = new THREE.MeshBasicMaterial({ map: tagTex, transparent: true, opacity: 0.92, side: THREE.DoubleSide, depthWrite: false });
  const tagMesh = new THREE.Mesh(tagGeo, tagMat);
  tagMesh.rotation.x = Math.PI / 2;
  tagMesh.position.set(0, -0.7, -0.2);
  group.add(tagMesh);

  return group;
}

// Grok-generated ship mesh (approx from image) — low-poly Quake2 style with canvas overlay texture
function createGrokShip() {
  const group = new THREE.Group();
  const FLAT = true;

  const matHull = new THREE.MeshPhongMaterial({ color: 0x665544, flatShading: FLAT, shininess: 8 });
  const matWing = new THREE.MeshPhongMaterial({ color: 0x554433, flatShading: FLAT, shininess: 6 });
  const matEngine = new THREE.MeshPhongMaterial({ color: 0x333333, flatShading: FLAT, shininess: 10 });
  const matGlow = new THREE.MeshBasicMaterial({ color: 0xffdd88 });

  // Central body
  const body = new THREE.Mesh(new THREE.BoxGeometry(3, 1.5, 5), matHull);
  group.add(body);

  // Wings (large angled panels)
  const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4, 6), matWing);
  wingL.position.set(-2.5, 0, 0);
  wingL.rotation.z = 0.3;
  group.add(wingL);
  const wingR = wingL.clone();
  wingR.position.x = 2.5;
  wingR.rotation.z = -0.3;
  group.add(wingR);

  // Rear engines
  const engL = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 2, 8), matEngine);
  engL.position.set(-1.2, 0, -3.5);
  engL.rotation.x = Math.PI / 2;
  group.add(engL);
  const engR = engL.clone();
  engR.position.x = 1.2;
  group.add(engR);

  // Glow orbs
  const glowL = new THREE.Mesh(new THREE.SphereGeometry(0.7, 8, 8), matGlow);
  glowL.position.set(-1.2, 0, -4.5);
  group.add(glowL);
  const glowR = glowL.clone();
  glowR.position.x = 1.2;
  group.add(glowR);

  // Simple canvas overlay texture (metal panels / BMP style)
  const texCanvas = document.createElement('canvas');
  texCanvas.width = 128;
  texCanvas.height = 64;
  const ctx = texCanvas.getContext('2d');
  ctx.fillStyle = '#554433';
  ctx.fillRect(0, 0, 128, 64);
  ctx.strokeStyle = '#332211';
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.rect(10 + i * 14, 10, 12, 44);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(texCanvas);
  body.material.map = tex;
  body.material.needsUpdate = true;

  // Lights
  const light = new THREE.PointLight(0xffaa44, 1.5, 20);
  light.position.set(0, 0, -4);
  group.add(light);

  group.userData = { type: 'grokship' };
  return group;
}

// Sleek silver futuristic player ship (from zip reference images — complex
// multi-part low-poly mesh: tapered fuselage, swept delta wings with
// winglets + wing screens, twin engines with particle thrusters, nose
// flashlight spotlight, and a nose-mounted laser cannon).
// Convention: +Z = nose/front (matches thrust dir & weapon fire direction),
// -Z = tail/engine exhaust.
function createSilverShip() {
  const group = new THREE.Group();
  const FLAT = true;

  const matHull    = new THREE.MeshPhongMaterial({ color: 0xd4d7db, shininess: 45, specular: 0x999999, flatShading: FLAT });
  const matHullTex = new THREE.MeshPhongMaterial({ color: 0xd4d7db, shininess: 45, specular: 0x999999, flatShading: FLAT });
  const matDark    = new THREE.MeshPhongMaterial({ color: 0x3a3d42, shininess: 20, flatShading: FLAT });
  const matChrome  = new THREE.MeshPhongMaterial({ color: 0xeef2f5, shininess: 60, specular: 0xffffff, flatShading: FLAT });
  const matCanopy  = new THREE.MeshPhongMaterial({ color: 0x2299dd, emissive: 0x0a2233, shininess: 70, specular: 0xaaddff, flatShading: FLAT, transparent: true, opacity: 0.85 });
  const matGlow    = new THREE.MeshBasicMaterial({ color: 0xaaffff });
  const matWingDk  = new THREE.MeshPhongMaterial({ color: 0x8a9096, shininess: 25, specular: 0x777777, flatShading: FLAT, side: THREE.DoubleSide });

  function addEdges(mesh, opacity, color) {
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(mesh.geometry),
      new THREE.LineBasicMaterial({ color: color || 0x66d9ff, transparent: true, opacity: opacity !== undefined ? opacity : 0.35 })
    );
    mesh.add(edges);
  }

  // === Panel-line silver texture for the hull ===
  const texC = document.createElement('canvas');
  texC.width = 128; texC.height = 128;
  const tctx = texC.getContext('2d');
  tctx.fillStyle = '#d4d7db';
  tctx.fillRect(0, 0, 128, 128);
  tctx.strokeStyle = '#9aa0a6';
  tctx.lineWidth = 1.5;
  for (let y = 0; y < 128; y += 16) { tctx.beginPath(); tctx.moveTo(0, y); tctx.lineTo(128, y); tctx.stroke(); }
  for (let x = 0; x < 128; x += 32) { tctx.beginPath(); tctx.moveTo(x, 0); tctx.lineTo(x, 128); tctx.stroke(); }
  tctx.strokeStyle = '#c2c6ca';
  tctx.lineWidth = 3;
  tctx.strokeRect(4, 4, 120, 120);
  const hullTex = new THREE.CanvasTexture(texC);
  hullTex.wrapS = hullTex.wrapT = THREE.RepeatWrapping;
  hullTex.repeat.set(2, 4);
  matHullTex.map = hullTex;

  // === Fuselage: nose cone -> mid body -> rear taper -> tail taper ===
  const noseCone = new THREE.Mesh(new THREE.ConeGeometry(0.34, 1.1, 8), matHull);
  noseCone.rotation.x = -Math.PI / 2;
  noseCone.position.set(0, 0, 2.75);
  addEdges(noseCone, 0.3);
  group.add(noseCone);

  const midBody = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 2.0, 8), matHullTex);
  midBody.rotation.x = Math.PI / 2;
  midBody.position.set(0, 0, 1.4);
  addEdges(midBody, 0.25);
  group.add(midBody);

  const rearBody = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.32, 1.6, 8), matHull);
  rearBody.rotation.x = Math.PI / 2;
  rearBody.position.set(0, 0, -0.4);
  addEdges(rearBody, 0.25);
  group.add(rearBody);

  const tailTaper = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.14, 1.2, 8), matDark);
  tailTaper.rotation.x = Math.PI / 2;
  tailTaper.position.set(0, 0, -1.7);
  group.add(tailTaper);

  // Spine ridge / dorsal fairing
  const spine = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 2.4), matChrome);
  spine.position.set(0, 0.55, 0.6);
  addEdges(spine, 0.3);
  group.add(spine);

  // === Cockpit canopy ===
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.36, 8, 6), matCanopy);
  canopy.scale.set(1, 0.62, 1.5);
  canopy.position.set(0, 0.42, 1.7);
  group.add(canopy);

  const canopyFrame = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.035, 5, 8), matChrome);
  canopyFrame.rotation.x = Math.PI / 2;
  canopyFrame.position.set(0, 0.42, 1.7);
  group.add(canopyFrame);

  // === Swept delta wings (with winglets + gif screens) ===
  function buildWing(side) {
    const wing = new THREE.Group();

    const shape = new THREE.Shape();
    shape.moveTo(0, -0.9);     // root leading edge
    shape.lineTo(0, 0.9);      // root trailing edge
    shape.lineTo(2.3, 1.3);    // tip trailing edge (swept back)
    shape.lineTo(2.3, -0.1);   // tip leading edge
    shape.closePath();
    const wingGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.09, bevelEnabled: false });
    wingGeo.translate(0, 0, -0.045);
    const panel = new THREE.Mesh(wingGeo, matWingDk);
    panel.rotation.x = -Math.PI / 2;
    panel.position.set(side * 0.5, -0.05, 0.4);
    if (side < 0) panel.scale.x = -1;
    addEdges(panel, 0.5, 0xff6622);
    wing.add(panel);

    // Upturned winglet at the tip
    const winglet = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.55, 0.75), matDark);
    winglet.position.set(side * 2.75, 0.2, 0.0);
    winglet.rotation.x = 0.15;
    wing.add(winglet);

    // Small wingtip cannon
    const cannon = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.9, 6), matDark);
    cannon.rotation.x = Math.PI / 2;
    cannon.position.set(side * 2.3, -0.08, 1.1);
    wing.add(cannon);
    const cannonTip = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.018, 5, 6), matGlow);
    cannonTip.rotation.x = Math.PI / 2;
    cannonTip.position.set(side * 2.3, -0.08, 1.55);
    wing.add(cannonTip);

    // Wing-mounted status screen (animated by game.js updateGifScreens)
    const screenCanvas = document.createElement('canvas');
    screenCanvas.width = 32; screenCanvas.height = 32;
    const screenTex = new THREE.CanvasTexture(screenCanvas);
    screenTex.magFilter = THREE.NearestFilter;
    screenTex.minFilter = THREE.NearestFilter;
    const screenMat = new THREE.MeshBasicMaterial({ map: screenTex, transparent: true, side: THREE.DoubleSide });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.4), screenMat);
    screen.position.set(side * 1.3, 0.055, 0.55);
    screen.rotation.x = -Math.PI / 2;
    wing.add(screen);
    wing.userData.gifScreen = { canvas: screenCanvas, ctx: screenCanvas.getContext('2d'), tex: screenTex, frame: 0, timer: 0 };

    return wing;
  }
  const wingR = buildWing(1);
  const wingL = buildWing(-1);
  group.add(wingR, wingL);
  group.userData.gifScreens = [wingR.userData.gifScreen, wingL.userData.gifScreen];

  // === Twin tail fins (V-tail) ===
  function buildFin(side) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.95, 1.0), matWingDk);
    fin.position.set(side * 0.32, 0.4, -1.55);
    fin.rotation.z = side * -0.35;
    fin.rotation.x = -0.15;
    addEdges(fin, 0.4, 0xff6622);
    return fin;
  }
  group.add(buildFin(1), buildFin(-1));

  // === Twin engines with thruster glow ===
  function createThrusterGlow() {
    const count = 8;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 0.2;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.2;
      pos[i * 3 + 2] = -0.25 - Math.random() * 0.35;
      col[i * 3 + 0] = 0.6; col[i * 3 + 1] = 0.95; col[i * 3 + 2] = 1.0;
      sz[i] = 0.07 + Math.random() * 0.05;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sz, 1));
    const mat = new THREE.PointsMaterial({
      size: 0.1, transparent: true, opacity: 0.0, vertexColors: true,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    const pts = new THREE.Points(geo, mat);
    pts.userData.baseOpacity = 0.6;
    return pts;
  }

  function buildEngine(side) {
    const eng = new THREE.Group();
    const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.36, 1.0, 8), matDark);
    pod.rotation.x = Math.PI / 2;
    pod.position.set(side * 0.42, -0.05, -1.9);
    addEdges(pod, 0.25);
    eng.add(pod);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.05, 6, 8), matChrome);
    ring.position.set(side * 0.42, -0.05, -2.4);
    eng.add(ring);

    const glowDisc = new THREE.Mesh(new THREE.CircleGeometry(0.24, 8), matGlow);
    glowDisc.position.set(side * 0.42, -0.05, -2.42);
    eng.add(glowDisc);

    const glowLight = new THREE.PointLight(0xaaffff, 1.1, 10);
    glowLight.position.copy(glowDisc.position);
    eng.add(glowLight);

    const thruster = createThrusterGlow();
    thruster.scale.set(1.4, 1.4, 1.4);
    thruster.position.set(side * 0.42, -0.05, -2.4);
    eng.add(thruster);
    eng.userData.thruster = thruster;
    return eng;
  }
  const engR = buildEngine(1);
  const engL = buildEngine(-1);
  group.add(engR, engL);
  group.userData.thrusterGlow = [engR.userData.thruster, engL.userData.thruster];

  // === Nose-mounted flashlight spotlight ===
  const spotGroup = new THREE.Group();
  spotGroup.position.set(0, -0.32, 2.6);

  const mountArm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.28, 6), matDark);
  mountArm.rotation.x = Math.PI / 2;
  mountArm.position.set(0, 0, -0.15);
  spotGroup.add(mountArm);

  const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.45, 10, 1, true), matChrome);
  housing.rotation.x = Math.PI / 2;
  addEdges(housing, 0.4);
  spotGroup.add(housing);

  const backCap = new THREE.Mesh(new THREE.CircleGeometry(0.34, 10), matDark);
  backCap.rotation.x = -Math.PI / 2;
  backCap.position.set(0, 0, -0.22);
  spotGroup.add(backCap);

  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.32, 10), new THREE.MeshBasicMaterial({ color: 0xeaffff }));
  lens.rotation.x = Math.PI / 2;
  lens.position.set(0, 0, 0.225);
  spotGroup.add(lens);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.035, 6, 10), matChrome);
  rim.rotation.x = Math.PI / 2;
  rim.position.set(0, 0, 0.22);
  spotGroup.add(rim);

  group.add(spotGroup);
  group.userData.spotlightHousing = spotGroup;

  const flashLight = new THREE.SpotLight(0xaaffff, 0, 90, Math.PI / 5, 0.35, 1.1);
  flashLight.position.set(0, 0, 0);
  spotGroup.add(flashLight);
  const flashTarget = new THREE.Object3D();
  flashTarget.position.set(0, 0, 40);
  spotGroup.add(flashTarget);
  flashLight.target = flashTarget;
  group.userData.flashlight = flashLight;
  group.userData.flashlightOn = false;

  const beamConeGeo = new THREE.ConeGeometry(2.4, 7.5, 12, 1, true);
  const beamConeMat = new THREE.MeshBasicMaterial({
    color: 0xaaffff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false
  });
  const beamCone = new THREE.Mesh(beamConeGeo, beamConeMat);
  beamCone.rotation.x = Math.PI / 2;
  beamCone.position.set(0, 0, 4.0);
  spotGroup.add(beamCone);
  group.userData.spotBeamCone = beamCone;

  // === Nose laser cannon (aligned to game.js's hardcoded muzzle offset 0,-0.35,3.25) ===
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.1, 6), matDark);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, -0.35, 2.75);
  group.add(barrel);

  const muzzle = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.028, 5, 8), new THREE.MeshPhongMaterial({ color: 0xff4400, emissive: 0x441100, flatShading: FLAT }));
  muzzle.rotation.x = Math.PI / 2;
  muzzle.position.set(0, -0.35, 3.25);
  group.add(muzzle);

  const beamPoints = [new THREE.Vector3(0, -0.35, 3.25), new THREE.Vector3(0, -0.35, 3.25)];
  const beamGeo = new THREE.BufferGeometry().setFromPoints(beamPoints);
  const beamMat = new THREE.LineBasicMaterial({ color: 0xff3300, transparent: true, opacity: 0 });
  const beam = new THREE.Line(beamGeo, beamMat);
  group.add(beam);

  const laserLight = new THREE.PointLight(0xff3300, 0, 20);
  laserLight.position.set(0, -0.35, 3.25);
  group.add(laserLight);

  group.userData.type = 'silvership';
  group.userData.velocity = new THREE.Vector3();
  group.userData.beam = beam;
  group.userData.beamGeo = beamGeo;
  group.userData.laserLight = laserLight;

  return group;
}


