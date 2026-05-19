// LeverageIQ — 3D hero scenes (Three.js)
// Renders a slowly rotating glassy icosahedron in the hero,
// and a parallax wireframe lattice in the offer section.

import * as THREE from 'three';

const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

function makeRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  return renderer;
}

/* ---------- HERO SCENE: glassy icosahedron with halo ---------- */
function initHero() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const renderer = makeRenderer(canvas);
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 6);

  // Lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.55);
  scene.add(ambient);
  const key = new THREE.PointLight(0x00aaff, 80, 30, 2);
  key.position.set(4, 3, 4);
  scene.add(key);
  const fill = new THREE.PointLight(0x7dd6ff, 40, 30, 2);
  fill.position.set(-4, -2, 3);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffffff, 0.6);
  rim.position.set(-3, 4, -2);
  scene.add(rim);

  // Group so we can orbit smoothly
  const group = new THREE.Group();
  scene.add(group);

  // Core: icosahedron with refraction-ish look
  const geo = new THREE.IcosahedronGeometry(1.6, 1);
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0x0b1620,
    metalness: 0.35,
    roughness: 0.18,
    transmission: 0.85,
    thickness: 1.2,
    ior: 1.35,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
    attenuationColor: new THREE.Color(0x00aaff),
    attenuationDistance: 3.2,
    envMapIntensity: 0.8,
  });
  const core = new THREE.Mesh(geo, mat);
  group.add(core);

  // Wireframe shell
  const shellGeo = new THREE.IcosahedronGeometry(1.85, 1);
  const shellMat = new THREE.MeshBasicMaterial({
    color: 0x00aaff,
    wireframe: true,
    transparent: true,
    opacity: 0.22,
  });
  const shell = new THREE.Mesh(shellGeo, shellMat);
  group.add(shell);

  // Orbiting particles
  const particleCount = 220;
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    const r = 2.6 + Math.random() * 2.4;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const pMat = new THREE.PointsMaterial({
    color: 0xb9e6ff, size: 0.025, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(pGeo, pMat);
  scene.add(points);

  // Pointer parallax
  const target = { x: 0, y: 0 };
  const current = { x: 0, y: 0 };
  window.addEventListener('pointermove', (e) => {
    target.x = (e.clientX / window.innerWidth - 0.5) * 0.5;
    target.y = (e.clientY / window.innerHeight - 0.5) * 0.4;
  }, { passive: true });

  function resize() {
    const rect = canvas.getBoundingClientRect();
    renderer.setSize(rect.width, rect.height, false);
    camera.aspect = rect.width / Math.max(rect.height, 1);
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  const clock = new THREE.Clock();
  let running = true;
  document.addEventListener('visibilitychange', () => { running = !document.hidden; });

  function render() {
    if (!running) { requestAnimationFrame(render); return; }
    const t = clock.getElapsedTime();
    const speed = prefersReducedMotion ? 0 : 1;

    current.x += (target.x - current.x) * 0.05;
    current.y += (target.y - current.y) * 0.05;

    group.rotation.y = t * 0.18 * speed + current.x;
    group.rotation.x = Math.sin(t * 0.15) * 0.15 * speed + current.y;
    shell.rotation.y = -t * 0.12 * speed;
    shell.rotation.x = t * 0.08 * speed;
    points.rotation.y = t * 0.04 * speed;
    points.rotation.x = -t * 0.025 * speed;

    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }
  render();
}

/* ---------- OFFER SCENE: floating wireframe lattice ---------- */
function initOffer() {
  const canvas = document.getElementById('offer-canvas');
  if (!canvas) return;

  const renderer = makeRenderer(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  camera.position.set(0, 0, 8);

  // Lattice — a torus knot with a wireframe overlay
  const knot = new THREE.Mesh(
    new THREE.TorusKnotGeometry(2.2, 0.55, 200, 24),
    new THREE.MeshBasicMaterial({ color: 0x00aaff, wireframe: true, transparent: true, opacity: 0.35 }),
  );
  scene.add(knot);

  // Soft glow sphere behind it
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(1.2, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0x0a4d77, transparent: true, opacity: 0.22 }),
  );
  glow.position.set(2.4, -0.5, -1);
  scene.add(glow);

  // Scroll-driven rotation
  let scrollY = window.scrollY;
  window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

  function resize() {
    const rect = canvas.getBoundingClientRect();
    renderer.setSize(rect.width, rect.height, false);
    camera.aspect = rect.width / Math.max(rect.height, 1);
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  const clock = new THREE.Clock();
  function render() {
    const t = clock.getElapsedTime();
    const speed = prefersReducedMotion ? 0 : 1;
    knot.rotation.x = t * 0.18 * speed + scrollY * 0.0008;
    knot.rotation.y = t * 0.12 * speed;
    glow.position.x = Math.sin(t * 0.5) * 2 * speed;
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }
  render();
}

window.addEventListener('DOMContentLoaded', () => {
  try { initHero(); } catch (e) { console.warn('hero scene failed', e); }
  try { initOffer(); } catch (e) { console.warn('offer scene failed', e); }
});
