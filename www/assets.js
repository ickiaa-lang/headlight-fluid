// assets.js — Quake2 themed game asset models (low-poly flat-shaded)
// Extracted for separate library use. Include via script tag before game.js

function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function createEnhancedAsteroid(seededSize) {
  const group = new THREE.Group();
  const size = seededSize !== undefined ? seededSize : (1.8 + Math.random() * 2.2);
  
  const geo = new THREE.IcosahedronGeometry(size, 2);
  const posAttr = geo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const vx = posAttr.getX(i), vy = posAttr.getY(i), vz = posAttr.getZ(i);
    const noise = seededRandom(size + vx + vy + vz) * 0.3;
    const scale = 1.0 + noise;
    posAttr.setXYZ(i, vx * scale, vy * scale, vz * scale);
  }
  posAttr.needsUpdate = true;
  geo.computeVertexNormals();
  
  const matSolid = new THREE.MeshPhongMaterial({
    color: 0x554433,
    flatShading: true,
    shininess: 4,
    emissive: 0x221100
  });
  const solid = new THREE.Mesh(geo, matSolid);
  group.add(solid);
  
  const wireMat = new THREE.LineBasicMaterial({ color: 0x88aaff, transparent: true, opacity: 0.5 });
  const wire = new THREE.LineSegments(new THREE.EdgesGeometry(geo), wireMat);
  group.add(wire);
  
  const debrisCount = 3 + Math.floor(seededRandom(seededSize + 10) * 4);
  for (let i = 0; i < debrisCount; i++) {
    const chunkSize = 0.3 + seededRandom(seededSize + i + 100) * 0.6;
    const chunkGeo = new THREE.IcosahedronGeometry(chunkSize, 1);
    const chunkMat = new THREE.MeshPhongMaterial({
      color: 0x553333,
      flatShading: true,
      shininess: 4
    });
    const chunk = new THREE.Mesh(chunkGeo, chunkMat);
    chunk.position.set(
      (seededRandom(seededSize + i + 200) - 0.5) * size * 2.5,
      (seededRandom(seededSize + i + 300) - 0.5) * size * 2.5,
      (seededRandom(seededSize + i + 400) - 0.5) * size * 2.5
    );
    chunk.rotation.set(
      seededRandom(seededSize + i + 500) * 6,
      seededRandom(seededSize + i + 600) * 6,
      seededRandom(seededSize + i + 700) * 6
    );
    group.add(chunk);
  }
  
  group.userData = { hazard: true, size, type: 'asteroid' };
  return group;
}

function createEnhancedWreck(seed) {
  const group = new THREE.Group();
  
  const matHull = new THREE.MeshPhongMaterial({
    color: 0x4a3a2a,
    flatShading: true,
    shininess: 3,
    emissive: 0x110000
  });
  
  const mainGeo = new THREE.BoxGeometry(4.2, 1.6, 2.4);
  const mainHull = new THREE.Mesh(mainGeo, matHull);
  mainHull.rotation.z = seededRandom(seed) * 0.5;
  group.add(mainHull);
  
  const segmentCount = 5 + Math.floor(seededRandom(seed + 10) * 3);
  const matFracture = new THREE.MeshPhongMaterial({
    color: 0x3a2a1a,
    flatShading: true,
    shininess: 2
  });
  
  for (let i = 0; i < segmentCount; i++) {
    const w = 0.4 + seededRandom(seed + i + 100) * 1.0;
    const h = 0.3 + seededRandom(seed + i + 200) * 0.5;
    const d = 0.5 + seededRandom(seed + i + 300) * 0.8;
    
    const fracGeo = new THREE.BoxGeometry(w, h, d);
    const frac = new THREE.Mesh(fracGeo, matFracture);
    
    frac.position.set(
      (seededRandom(seed + i + 400) - 0.5) * 5.5,
      (seededRandom(seed + i + 500) - 0.5) * 3.0,
      (seededRandom(seed + i + 600) - 0.5) * 4.0
    );
    frac.rotation.set(
      seededRandom(seed + i + 700) * 6,
      seededRandom(seed + i + 800) * 6,
      seededRandom(seed + i + 900) * 6
    );
    group.add(frac);
  }
  
  const wireGeo = new THREE.EdgesGeometry(mainGeo);
  const wireMat = new THREE.LineBasicMaterial({ color: 0x994433, transparent: true, opacity: 0.4 });
  const wire = new THREE.LineSegments(wireGeo, wireMat);
  wire.rotation.copy(mainHull.rotation);
  group.add(wire);
  
  const beacon = new THREE.PointLight(0xff6600, 0, 18);
  beacon.position.set(1.5, 1.2, 0);
  group.add(beacon);

  // Complex Quake2 pipes/panels
  const pipeMat = new THREE.MeshPhongMaterial({ color: 0x3a2a1a, flatShading: true, shininess: 2 });
  for (let i = 0; i < 3; i++) {
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.5, 5), pipeMat);
    pipe.position.set((i - 1) * 1.8, 2.2, 0);
    pipe.rotation.z = seededRandom(seed + i) * 1.2;
    group.add(pipe);
  }
  
  group.userData = { landmark: true, kind: 'wreck', blinkPhase: Math.random() * Math.PI * 2, beacon, type: 'wreck' };
  return group;
}

function createEnhancedGrowFarm(type) {
  const group = new THREE.Group();
  
  const plateCount = 5;
  const plateSpacing = 0.6;
  const matScaffold = new THREE.MeshPhongMaterial({
    color: 0x2a3a2a,
    flatShading: true,
    shininess: 6
  });
  
  for (let i = 0; i < plateCount; i++) {
    const plateGeo = new THREE.CylinderGeometry(1.4, 1.4, 0.2, 6);
    const plate = new THREE.Mesh(plateGeo, matScaffold);
    plate.position.y = (i - 2) * plateSpacing;
    group.add(plate);
    
    const wireGeo = new THREE.EdgesGeometry(plateGeo);
    const wireMat = new THREE.LineBasicMaterial({ color: 0xffaa44, transparent: true, opacity: 0.6 });
    const wire = new THREE.LineSegments(wireGeo, wireMat);
    wire.position.copy(plate.position);
    group.add(wire);
  }
  
  const growCanvas = document.createElement('canvas');
  growCanvas.width = 64;
  growCanvas.height = 64;
  const growCtx = growCanvas.getContext('2d');
  const growTex = new THREE.CanvasTexture(growCanvas);
  const growMat = new THREE.MeshBasicMaterial({ map: growTex, transparent: true, blending: THREE.AdditiveBlending });
  
  const growMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 3.0), growMat);
  growMesh.position.z = 0.3;
  group.add(growMesh);
  
  let animPhase = Math.random() * Math.PI * 2;
  growMesh.userData.animate = (t) => {
    animPhase += 0.02;
    growCtx.clearRect(0, 0, 64, 64);
    
    growCtx.fillStyle = '#5f8';
    const scale = 16 + Math.sin(animPhase) * 6;
    growCtx.fillRect(32 - scale/2, 32 - scale, scale, scale);
    
    growCtx.strokeStyle = 'rgba(85, 255, 136, 0.4)';
    growCtx.lineWidth = 2;
    growCtx.beginPath();
    growCtx.arc(32, 32, 20 + Math.sin(animPhase * 1.5) * 4, 0, Math.PI * 2);
    growCtx.stroke();
    
    growTex.needsUpdate = true;
  };
  
  group.userData = { kind: 'growplate', animate: growMesh.userData.animate, type: 'farm' };
  return group;
}

function createEnhancedSpaceStation() {
  const group = new THREE.Group();
  
  const hubGeo = new THREE.OctahedronGeometry(3.0, 2);
  const hubMat = new THREE.MeshPhongMaterial({
    color: 0x3a4a3a,
    flatShading: true,
    shininess: 8,
    emissive: 0x112211
  });
  const hub = new THREE.Mesh(hubGeo, hubMat);
  group.add(hub);
  
  const hubWireGeo = new THREE.EdgesGeometry(hubGeo);
  const hubWireMat = new THREE.LineBasicMaterial({ color: 0xffaa44, transparent: true, opacity: 0.6 });
  const hubWire = new THREE.LineSegments(hubWireGeo, hubWireMat);
  group.add(hubWire);
  
  const bayPositions = [
    { y: 2.0, rot: 0 },
    { y: -2.0, rot: Math.PI / 3 },
    { y: 0, rot: Math.PI * 2/3 }
  ];
  
  bayPositions.forEach(bay => {
    const bayGeo = new THREE.TorusGeometry(2.8, 0.25, 6, 12);
    const bayWireGeo = new THREE.EdgesGeometry(bayGeo);
    const bayWire = new THREE.LineSegments(bayWireGeo, hubWireMat);
    bayWire.position.y = bay.y;
    bayWire.rotation.z = bay.rot;
    group.add(bayWire);
  });
  
  for (let i = 0; i < 4; i++) {
    const angle = (Math.PI * 2 / 4) * i;
    const antGeo = new THREE.ConeGeometry(0.3, 2.0, 6);
    const antMat = new THREE.MeshPhongMaterial({ color: 0x4a5a4a, flatShading: true, shininess: 6 });
    const ant = new THREE.Mesh(antGeo, antMat);
    ant.position.x = Math.cos(angle) * 4.0;
    ant.position.z = Math.sin(angle) * 4.0;
    ant.lookAt(0, 0, 0);
    group.add(ant);
  }

  // Complex Quake2 modules: angular boxes + struts
  const modMat = new THREE.MeshPhongMaterial({ color: 0x2a3a2a, flatShading: true, shininess: 4 });
  for (let i = 0; i < 4; i++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 1.8), modMat);
    const a = (Math.PI * 2 / 4) * i + 0.4;
    m.position.set(Math.cos(a) * 3.2, 1.5, Math.sin(a) * 3.2);
    m.rotation.y = a;
    group.add(m);
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.5, 5), modMat);
    strut.position.set(Math.cos(a) * 2.2, 0, Math.sin(a) * 2.2);
    strut.rotation.z = Math.PI / 2;
    group.add(strut);
  }
  
  const coreCanvas = document.createElement('canvas');
  coreCanvas.width = 128;
  coreCanvas.height = 128;
  const coreCtx = coreCanvas.getContext('2d');
  const coreTex = new THREE.CanvasTexture(coreCanvas);
  const coreMat = new THREE.MeshBasicMaterial({ map: coreTex, transparent: true, blending: THREE.AdditiveBlending });
  const core = new THREE.Mesh(new THREE.SphereGeometry(1.5, 16, 16), coreMat);
  group.add(core);
  
  let corePhase = 0;
  core.userData.animate = (t) => {
    corePhase += 0.03;
    coreCtx.clearRect(0, 0, 128, 128);
    
    for (let ring = 0; ring < 3; ring++) {
      const opacity = Math.sin(corePhase + ring) * 0.25 + 0.35;
      coreCtx.strokeStyle = `rgba(0, 255, 200, ${opacity})`;
      coreCtx.lineWidth = 3;
      coreCtx.beginPath();
      coreCtx.arc(64, 64, 30 + ring * 15, 0, Math.PI * 2);
      coreCtx.stroke();
    }
    
    const r = 15 + Math.sin(corePhase) * 5;
    coreCtx.fillStyle = 'rgba(0, 255, 200, 0.6)';
    coreCtx.beginPath();
    coreCtx.arc(64, 64, r, 0, Math.PI * 2);
    coreCtx.fill();
    
    coreTex.needsUpdate = true;
  };
  
  group.userData = { kind: 'station', animate: core.userData.animate, type: 'station' };
  return group;
}

function createEnhancedSatellite(seed) {
  const group = new THREE.Group();
  
  const bodyGeo = new THREE.BoxGeometry(1.0, 1.0, 3.5);
  const bodyMat = new THREE.MeshPhongMaterial({
    color: 0x3a3a3a,
    flatShading: true,
    shininess: 10,
    emissive: 0x111111
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  group.add(body);
  
  const panelGeo = new THREE.BoxGeometry(4.0, 0.1, 2.0);
  const panelMat = new THREE.MeshPhongMaterial({
    color: 0x2a2a2a,
    flatShading: true,
    shininess: 20,
    emissive: 0x0a0a0a
  });
  
  const panelL = new THREE.Mesh(panelGeo, panelMat);
  panelL.position.x = -2.5;
  panelL.position.y = 0.2;
  group.add(panelL);
  
  const panelR = new THREE.Mesh(panelGeo, panelMat);
  panelR.position.x = 2.5;
  panelR.position.y = 0.2;
  group.add(panelR);
  
  const dishGeo = new THREE.ConeGeometry(0.7, 0.3, 6);
  const dishMat = new THREE.MeshPhongMaterial({
    color: 0x5a5a4a,
    flatShading: true,
    shininess: 10
  });
  const dish = new THREE.Mesh(dishGeo, dishMat);
  dish.position.z = 1.8;
  dish.position.y = 0.5;
  group.add(dish);
  
  const wireGeo = new THREE.EdgesGeometry(bodyGeo);
  const wireMat = new THREE.LineBasicMaterial({ color: 0x88aa44, transparent: true, opacity: 0.5 });
  const wire = new THREE.LineSegments(wireGeo, wireMat);
  group.add(wire);

  // Complex Quake2 addons: equipment boxes + struts
  const eqMat = new THREE.MeshPhongMaterial({ color: 0x2a2a2a, flatShading: true, shininess: 6 });
  const box1 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 1.2), eqMat);
  box1.position.set(0, 0.8, -1.2);
  group.add(box1);
  const box2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.9), eqMat);
  box2.position.set(0.7, -0.6, 1.5);
  group.add(box2);
  const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.8, 5), eqMat);
  strut.position.set(-0.8, 0.3, 0);
  strut.rotation.z = Math.PI / 3;
  group.add(strut);
  
  const light = new THREE.PointLight(0x00ff99, 0.8, 12);
  light.position.set(0, 0.6, -1.5);
  group.add(light);
  
  const signalCanvas = document.createElement('canvas');
  signalCanvas.width = 64;
  signalCanvas.height = 64;
  const signalCtx = signalCanvas.getContext('2d');
  const signalTex = new THREE.CanvasTexture(signalCanvas);
  const signalMat = new THREE.MeshBasicMaterial({ map: signalTex, transparent: true });
  const signalMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.0), signalMat);
  signalMesh.position.y = -1.0;
  signalMesh.position.z = 0.2;
  group.add(signalMesh);
  
  let signalPhase = 0;
  signalMesh.userData.animate = (t) => {
    signalPhase += 0.04;
    signalCtx.clearRect(0, 0, 64, 64);
    
    signalCtx.fillStyle = '#0f0';
    for (let bar = 0; bar < 4; bar++) {
      const h = 8 + Math.sin(signalPhase + bar * 0.3) * 10;
      signalCtx.fillRect(12 + bar * 10, 32 - h/2, 6, h);
    }
    
    signalTex.needsUpdate = true;
  };
  
  group.userData = {
    landmark: true,
    kind: 'satellite',
    blinkPhase: Math.random() * Math.PI * 2,
    beacon: light,
    animate: signalMesh.userData.animate,
    type: 'satellite'
  };
  return group;
}

// Futuristic ISS-style pink space station (Quake2 low-poly angular)
function createPinkStation() {
  const group = new THREE.Group();
  const matPink = new THREE.MeshPhongMaterial({ color: 0xff88cc, flatShading: true, shininess: 10, emissive: 0x331122 });
  const matGray = new THREE.MeshPhongMaterial({ color: 0x445566, flatShading: true, shininess: 8 });
  const matTruss = new THREE.MeshPhongMaterial({ color: 0x334455, flatShading: true, shininess: 6 });

  // Central module (ISS-like)
  const core = new THREE.Mesh(new THREE.BoxGeometry(4, 2, 3), matPink);
  group.add(core);

  // Truss segments
  for (let i = 0; i < 4; i++) {
    const truss = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 6), matTruss);
    truss.position.x = (i % 2 === 0 ? -3.5 : 3.5);
    truss.position.z = (i < 2 ? -2 : 2);
    group.add(truss);
  }

  // Solar arrays (X-wing style panels)
  const panelMat = new THREE.MeshPhongMaterial({ color: 0x112233, flatShading: true, shininess: 20 });
  const panelL = new THREE.Mesh(new THREE.BoxGeometry(6, 0.1, 2.5), panelMat);
  panelL.position.set(-5, 1.5, 0);
  group.add(panelL);
  const panelR = panelL.clone();
  panelR.position.x = 5;
  group.add(panelR);

  // Radiators / modules
  for (let i = 0; i < 3; i++) {
    const mod = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1, 1), matGray);
    mod.position.set(0, 2 + i * 0.8, (i - 1) * 2);
    group.add(mod);
  }

  // Pink beacon light
  const light = new THREE.PointLight(0xff88cc, 1.2, 30);
  light.position.set(0, 4, 0);
  group.add(light);

  group.userData = { kind: 'pinkstation', type: 'station', landmark: true };
  return group;
}

// Themed space farms (Quake2 style, fitting resource)
function createO2Farm() {
  const g = createEnhancedGrowFarm();
  g.children.forEach(c => { if (c.material) c.material.color.set(0x00ff88); });
  g.userData.type = 'o2farm';
  return g;
}
function createH2OFarm() {
  const g = createEnhancedGrowFarm();
  g.children.forEach(c => { if (c.material) c.material.color.set(0x4488ff); });
  g.userData.type = 'h2ofarm';
  return g;
}
function createFoodFarm() {
  const g = createEnhancedGrowFarm();
  g.children.forEach(c => { if (c.material) c.material.color.set(0xffcc44); });
  g.userData.type = 'foodfarm';
  return g;
}
function createFuelFarm() {
  const g = createEnhancedGrowFarm();
  g.children.forEach(c => { if (c.material) c.material.color.set(0xff4444); });
  g.userData.type = 'fuelfarm';
  return g;
}


