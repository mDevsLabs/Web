// Implémentation de la visionneuse 3D de l'arsenal.
//
// Ce module est chargé À LA DEMANDE par `weapon-viewer.ts` : c'est lui qui
// importe `three`, et il ne doit jamais entrer dans le chunk d'entrée (le
// moteur est réservé au lancement d'une opération).
//
// Le reste du code est inchangé : viewer de l'arsenal, éclairage de studio,
// plateau tournant holographique, rotation au glisser, zoom à la molette.

import * as T from 'three';
import { createWeapon } from '../render/weapons.ts';
import type { SkinId } from '../skin-catalog.ts';
import { weaponById } from '../types.ts';
import type { UI } from '../ui.ts';
import {
  type ArsenalViewer,
  registerArsenalViewer,
} from './weapon-viewer.ts';

interface ActiveViewer extends ArsenalViewer {
  update(weaponId: string, skinId: SkinId): void;
  resetView(): void;
  dispose(): void;
}

export function mountArsenalViewer(ui: UI): void {
  const container = ui.app.querySelector<HTMLElement>('#arsenal-blueprint');
  const canvas = ui.app.querySelector<HTMLCanvasElement>('#weapon-3d-canvas');
  if (!container || !canvas) return;

  const weaponId = container.dataset.weaponId || ui.config.weapon;
  const skinId =
    (container.dataset.activeSkin as SkinId) ||
    (container.dataset.skin as SkinId) ||
    'factory';

  // Restore or initialize rotation state on UI
  ui.arsenalRotation ??= { yaw: Math.PI * 0.45, pitch: 0.04, zoomFactor: 1.0 };
  const state = ui.arsenalRotation;

  let animId = 0;
  let active = true;
  let isDragging = false;
  let prevX = 0;
  let prevY = 0;
  let velocityYaw = 0;
  let velocityPitch = 0;
  let lastInteractionTime = performance.now();

  const angleBadge = container.querySelector<HTMLElement>(
    '#weapon-angle-readout'
  );
  const resetBtn = container.querySelector<HTMLButtonElement>(
    '#weapon-reset-view'
  );

  const updateAngleBadge = () => {
    if (!angleBadge) return;
    const deg = Math.round(
      (((state.yaw % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) *
        (180 / Math.PI)
    );
    angleBadge.textContent = `⟳ 360° · ${deg.toString().padStart(3, '0')}° · GLISSER POUR TOURNER`;
  };

  const scene = new T.Scene();

  const rect = container.getBoundingClientRect();
  const width = rect.width > 0 ? rect.width : 700;
  const height = rect.height > 0 ? rect.height : 300;

  const camera = new T.PerspectiveCamera(36, width / height, 0.05, 50);

  let renderer: T.WebGLRenderer;
  try {
    renderer = new T.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
  } catch (e) {
    console.warn('WebGL not available for arsenal 3D viewer', e);
    return;
  }

  // Lighting setup for studio armory showcase
  const ambient = new T.AmbientLight(0xdde3da, 1.2);
  scene.add(ambient);

  const keyLight = new T.DirectionalLight(0xffffff, 2.2);
  keyLight.position.set(3, 4, 3);
  scene.add(keyLight);

  const rimLight = new T.DirectionalLight(0xaad874, 1.6);
  rimLight.position.set(-3, 2, -3);
  scene.add(rimLight);

  const fillLight = new T.DirectionalLight(0x456658, 0.9);
  fillLight.position.set(0, -3, 2);
  scene.add(fillLight);

  const topLight = new T.DirectionalLight(0xffffff, 0.8);
  topLight.position.set(0, 4, 0);
  scene.add(topLight);

  // Tactical holographic turntable base
  const baseGroup = new T.Group();
  const outerRing = new T.Mesh(
    new T.RingGeometry(0.78, 0.80, 64),
    new T.MeshBasicMaterial({
      color: 0xa8ce7c,
      transparent: true,
      opacity: 0.35,
      side: T.DoubleSide
    })
  );
  outerRing.rotation.x = Math.PI / 2;
  baseGroup.add(outerRing);

  const innerRing = new T.Mesh(
    new T.RingGeometry(0.38, 0.39, 48),
    new T.MeshBasicMaterial({
      color: 0xa8ce7c,
      transparent: true,
      opacity: 0.2,
      side: T.DoubleSide
    })
  );
  innerRing.rotation.x = Math.PI / 2;
  baseGroup.add(innerRing);

  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    const tick = new T.Mesh(
      new T.PlaneGeometry(0.015, 0.08),
      new T.MeshBasicMaterial({
        color: 0xc4e296,
        transparent: true,
        opacity: 0.5,
        side: T.DoubleSide
      })
    );
    tick.rotation.x = Math.PI / 2;
    tick.rotation.z = angle;
    tick.position.set(Math.cos(angle) * 0.79, 0, Math.sin(angle) * 0.79);
    baseGroup.add(tick);
  }
  scene.add(baseGroup);

  // Pivot group for the weapon
  const pivot = new T.Group();
  scene.add(pivot);

  let targetFitDist = 1.6;
  let currentDist = 1.6;

  function loadWeaponModel(id: string, skin: SkinId) {
    while (pivot.children.length > 0) {
      pivot.remove(pivot.children[0]);
    }

    const spec = weaponById(id);
    const mesh = createWeapon(spec, false, skin);

    // Compute bounding box and center the model
    const box = new T.Box3().setFromObject(mesh);
    const center = box.getCenter(new T.Vector3());
    const size = box.getSize(new T.Vector3());

    mesh.position.set(-center.x, -center.y, -center.z);
    pivot.add(mesh);

    // Position turntable beneath weapon
    baseGroup.position.y = -size.y * 0.62;
    const baseScale = Math.max(0.6, Math.max(size.x, size.z) * 0.75);
    baseGroup.scale.set(baseScale, baseScale, baseScale);

    // Compute optimal camera distance to frame the entire weapon nicely
    const maxDim = Math.max(size.x, size.y, size.z);
    const vFov = (camera.fov * Math.PI) / 180;
    targetFitDist = Math.max(0.9, (maxDim * 0.88) / Math.tan(vFov / 2));
    if (currentDist === 1.6) currentDist = targetFitDist;
  }

  loadWeaponModel(weaponId, skinId);
  updateAngleBadge();

  // Reset view handler
  const resetView = () => {
    state.yaw = Math.PI * 0.45;
    state.pitch = 0.04;
    state.zoomFactor = 1.0;
    velocityYaw = 0;
    velocityPitch = 0;
    lastInteractionTime = performance.now();
    updateAngleBadge();
  };

  if (resetBtn) {
    resetBtn.onclick = (e) => {
      e.stopPropagation();
      resetView();
    };
  }

  // Pointer drag interaction (mouse and touch)
  const onPointerDown = (e: PointerEvent) => {
    isDragging = true;
    prevX = e.clientX;
    prevY = e.clientY;
    velocityYaw = 0;
    velocityPitch = 0;
    lastInteractionTime = performance.now();
    try {
      container.setPointerCapture(e.pointerId);
    } catch {}
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - prevX;
    const dy = e.clientY - prevY;
    prevX = e.clientX;
    prevY = e.clientY;

    const sens = 0.007;
    state.yaw += dx * sens;
    state.pitch = Math.max(-0.6, Math.min(0.6, state.pitch + dy * sens));
    velocityYaw = dx * sens;
    velocityPitch = dy * sens;
    lastInteractionTime = performance.now();
    updateAngleBadge();
  };

  const onPointerUp = (e: PointerEvent) => {
    if (!isDragging) return;
    isDragging = false;
    lastInteractionTime = performance.now();
    try {
      container.releasePointerCapture(e.pointerId);
    } catch {}
  };

  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    state.zoomFactor = Math.max(
      0.65,
      Math.min(1.65, state.zoomFactor - e.deltaY * 0.001)
    );
    lastInteractionTime = performance.now();
  };

  const onDblClick = () => {
    resetView();
  };

  container.addEventListener('pointerdown', onPointerDown);
  container.addEventListener('pointermove', onPointerMove);
  container.addEventListener('pointerup', onPointerUp);
  container.addEventListener('pointercancel', onPointerUp);
  container.addEventListener('wheel', onWheel, { passive: false });
  container.addEventListener('dblclick', onDblClick);

  // Responsive resize
  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const cr = entry.contentRect;
      if (cr.width > 0 && cr.height > 0) {
        camera.aspect = cr.width / cr.height;
        camera.updateProjectionMatrix();
        renderer.setSize(cr.width, cr.height, false);
      }
    }
  });
  resizeObserver.observe(container);

  // Animation render loop
  const tick = (now: number) => {
    if (!active) return;
    animId = requestAnimationFrame(tick);

    if (isDragging) {
      // Rotation handled directly in onPointerMove
    } else {
      if (Math.abs(velocityYaw) > 0.0001) {
        state.yaw += velocityYaw;
        velocityYaw *= 0.92;
        updateAngleBadge();
      } else if (now - lastInteractionTime > 1500) {
        // Subtle idle 360 auto-rotation
        state.yaw += 0.005;
        updateAngleBadge();
      }

      if (Math.abs(velocityPitch) > 0.0001) {
        state.pitch = Math.max(
          -0.6,
          Math.min(0.6, state.pitch + velocityPitch)
        );
        velocityPitch *= 0.88;
      }
    }

    pivot.rotation.y = state.yaw;
    pivot.rotation.x = state.pitch;

    // Turntable counter-rotation for dynamic depth
    baseGroup.rotation.y = -state.yaw * 0.25;

    // Smooth camera distance interpolation (zoom)
    const desiredDist = targetFitDist * (1 / state.zoomFactor);
    currentDist += (desiredDist - currentDist) * 0.12;
    camera.position.set(0, 0.02, currentDist);
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  };

  animId = requestAnimationFrame(tick);

  const viewer: ActiveViewer = {
    update(id: string, skin: SkinId) {
      loadWeaponModel(id, skin);
    },
    resetView,
    dispose() {
      if (!active) return;
      active = false;
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();

      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerup', onPointerUp);
      container.removeEventListener('pointercancel', onPointerUp);
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('dblclick', onDblClick);

      while (pivot.children.length > 0) {
        pivot.remove(pivot.children[0]);
      }
      scene.clear();

      try {
        renderer.dispose();
        renderer.forceContextLoss();
      } catch {}

      registerArsenalViewer(null);
    }
  };

  registerArsenalViewer(viewer);
}
