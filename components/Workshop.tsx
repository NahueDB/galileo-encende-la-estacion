'use client';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { Snapshot } from '@/lib/types';
export default function Workshop({
  snapshot,
  mood = 'wait',
  large = false,
}: {
  snapshot?: Snapshot;
  mood?: 'wait' | 'attention' | 'help' | 'celebrate';
  large?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const current = useRef({ snapshot, mood });
  current.current = { snapshot, mood };
  const [fallback, setFallback] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    setFallback(false);
    const canvas = document.createElement('canvas');
    let context: WebGL2RenderingContext | null = null;
    let renderer: THREE.WebGLRenderer;
    try {
      // Check before constructing Three: its constructor logs console.error on failure,
      // which opens the Next.js error overlay even when the exception is caught.
      // Conservative attributes also avoid forcing a particular GPU on Safari/macOS.
      context = canvas.getContext('webgl2', {
        alpha: true,
        antialias: false,
        powerPreference: 'default',
        failIfMajorPerformanceCaveat: false,
      });
      if (!context || context.isContextLost()) {
        setFallback(true);
        return;
      }
      renderer = new THREE.WebGLRenderer({
        canvas,
        context,
        antialias: false,
        alpha: true,
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    } catch {
      context?.getExtension('WEBGL_lose_context')?.loseContext();
      setFallback(true);
      return;
    }
    el.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-hidden', 'true');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 80);
    camera.position.set(7, 5.1, 9);
    camera.lookAt(0, 1, 0);
    scene.add(new THREE.HemisphereLight(0xbcefff, 0x132239, 2.5));
    const sun = new THREE.DirectionalLight(0xffffff, 3.4);
    sun.position.set(3, 7, 4);
    scene.add(sun);
    const blue = new THREE.PointLight(0x45cfff, 25, 12);
    blue.position.set(-3, 3, -2);
    scene.add(blue);
    const materials: THREE.Material[] = [];
    const geometries: THREE.BufferGeometry[] = [];
    function mat(color: number, metalness = 0.3, roughness = 0.4, emissive = 0) {
      const m = new THREE.MeshStandardMaterial({
        color,
        metalness,
        roughness,
        emissive,
        emissiveIntensity: 0.7,
      });
      materials.push(m);
      return m;
    }
    const navy = mat(0x17324b),
      metal = mat(0x7393a6, 0.6),
      white = mat(0xdce8e9, 0.2),
      dark = mat(0x071a29),
      cyan = mat(0x64e7ff, 0.2, 0.25, 0x27cdeb),
      orange = mat(0xdba65d),
      green = mat(0x57ddbd, 0.2, 0.3, 0x25b58d);
    function box(
      parent: THREE.Object3D,
      w: number,
      h: number,
      d: number,
      x: number,
      y: number,
      z: number,
      m: THREE.Material,
      rounded = false,
    ) {
      const g = rounded ? new RoundedBoxGeometry(w, h, d, 3, 0.1) : new THREE.BoxGeometry(w, h, d);
      geometries.push(g);
      const mesh = new THREE.Mesh(g, m);
      mesh.position.set(x, y, z);
      parent.add(mesh);
      return mesh;
    }
    function sphere(
      parent: THREE.Object3D,
      r: number,
      x: number,
      y: number,
      z: number,
      m: THREE.Material,
    ) {
      const g = new THREE.SphereGeometry(r, 16, 10);
      geometries.push(g);
      const mesh = new THREE.Mesh(g, m);
      mesh.position.set(x, y, z);
      parent.add(mesh);
      return mesh;
    }
    box(scene, 7, 0.18, 4.6, 0, -0.18, 0, navy, true);
    const grid = new THREE.GridHelper(6, 12, 0x356079, 0x244358);
    grid.position.y = -0.075;
    scene.add(grid);
    // Workcell and conveyor share one fixed workshop.
    box(scene, 2.15, 1.7, 1.35, 1, 0.8, -0.8, navy, true);
    box(scene, 1.7, 1.1, 0.12, 1, 1.05, -0.04, metal, true);
    box(scene, 1.34, 0.68, 0.13, 1, 1.2, 0.04, dark, true);
    box(scene, 1.05, 0.06, 0.06, 1, 1.32, 0.13, cyan);
    box(scene, 0.67, 0.06, 0.06, 0.8, 1.12, 0.13, metal);
    const lamp = box(scene, 0.18, 0.22, 0.18, 1.8, 1.9, -0.4, orange, true);
    const lampMaterial = mat(0x8d6741);
    lamp.material = lampMaterial;
    box(scene, 0.13, 1.4, 0.13, 2.1, 1.45, -0.8, metal);
    box(scene, 2.9, 0.18, 1.15, 0.65, 0.56, 1.05, metal, true);
    box(scene, 2.7, 0.1, 0.85, 0.65, 0.69, 1.05, dark);
    for (const x of [-0.5, 1.8])
      for (const z of [0.65, 1.45]) box(scene, 0.12, 0.6, 0.12, x, 0.18, z, metal);
    const rollers: THREE.Mesh[] = [];
    for (let i = 0; i < 12; i++) {
      const x = -0.65 + i * 0.23;
      const b = box(scene, 0.035, 0.03, 0.83, x, 0.76, 1.05, navy);
      rollers.push(b);
    }
    const pieces: THREE.Mesh[] = [];
    for (let i = 0; i < 3; i++)
      pieces.push(
        box(scene, 0.3, 0.28, 0.3, -0.3 + i * 0.8, 0.92, 1.05, i === 1 ? cyan : orange, true),
      );
    // Rounded guide robot with dark face, cyan eyes, jointed arms.
    const robot = new THREE.Group();
    robot.position.set(-1.85, 0, 0.35);
    robot.rotation.y = 0.18;
    scene.add(robot);
    box(robot, 0.55, 0.19, 0.62, -0.25, 0.12, 0.05, navy, true);
    box(robot, 0.55, 0.19, 0.62, 0.25, 0.12, 0.05, navy, true);
    box(robot, 0.16, 0.35, 0.17, -0.24, 0.35, 0, metal, true);
    box(robot, 0.16, 0.35, 0.17, 0.24, 0.35, 0, metal, true);
    box(robot, 0.78, 0.77, 0.57, 0, 0.87, 0, white, true);
    box(robot, 0.36, 0.26, 0.08, 0, 0.93, 0.3, navy, true);
    box(robot, 0.23, 0.045, 0.03, 0, 0.93, 0.35, cyan);
    sphere(robot, 0.14, 0, 1.35, 0, metal);
    box(robot, 1.16, 0.85, 0.81, 0, 1.9, 0, white, true);
    box(robot, 0.99, 0.58, 0.12, 0, 1.91, 0.43, dark, true);
    const eyes = [
      box(robot, 0.14, 0.2, 0.055, -0.23, 1.96, 0.51, cyan, true),
      box(robot, 0.14, 0.2, 0.055, 0.23, 1.96, 0.51, cyan, true),
    ];
    box(robot, 0.2, 0.035, 0.03, 0, 1.76, 0.51, cyan);
    const arms: THREE.Group[] = [];
    for (const side of [-1, 1]) {
      const arm = new THREE.Group();
      arm.position.set(side * 0.55, 1.13, 0);
      robot.add(arm);
      sphere(arm, 0.16, 0, 0, 0, metal);
      box(arm, 0.22, 0.4, 0.24, 0, -0.25, 0, white, true);
      sphere(arm, 0.12, 0, -0.48, 0, metal);
      box(arm, 0.2, 0.3, 0.22, 0, -0.65, 0, white, true);
      sphere(arm, 0.14, 0, -0.83, 0.03, navy);
      arm.rotation.z = side * 0.12;
      arms.push(arm);
    }
    box(scene, 0.8, 0.08, 0.55, -2.1, 0, -1.35, metal, true);
    box(scene, 0.12, 0.8, 0.12, -2.1, 0.4, -1.35, metal);
    const terminal = box(scene, 0.95, 0.65, 0.18, -2.1, 0.95, -1.35, navy, true);
    terminal.rotation.x = -0.18;
    box(scene, 0.73, 0.4, 0.06, -2.1, 1, -1.21, dark, true);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.025, 6, 32), cyan);
    geometries.push(ring.geometry);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(1, 0.03, -0.65);
    scene.add(ring);
    let reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMotion = () => {
      reduced = media.matches;
    };
    media.addEventListener('change', onMotion);
    let disposed = false,
      contextLost = false,
      frame = 0,
      last = 0,
      time = 0;
    function render(now: number) {
      if (disposed || contextLost) return;
      frame = requestAnimationFrame(render);
      if (now - last < 33) return;
      const dt = Math.min((now - last) / 1000, 0.06);
      last = now;
      time += dt;
      const { snapshot: s, mood: m } = current.current;
      const running = !!s?.running;
      const highlighted = !!s?.selected || s?.text === 'El taller está disponible para trabajar';
      lampMaterial.color.set(running ? 0x47e1bb : highlighted ? 0x6bdfff : 0xa77c45);
      lampMaterial.emissive.set(running ? 0x26cba5 : highlighted ? 0x278fbe : 0x000000);
      ring.visible = !!s?.selected || m === 'celebrate';
      if (!reduced) {
        robot.position.y =
          m === 'celebrate' ? Math.abs(Math.sin(time * 4)) * 0.11 : Math.sin(time * 1.8) * 0.025;
        arms[1].rotation.z =
          m === 'help'
            ? -1.7 + Math.sin(time * 3) * 0.15
            : m === 'celebrate'
              ? -2.25 + Math.sin(time * 7) * 0.18
              : -0.15;
        arms[0].rotation.z =
          m === 'celebrate' ? 2.25 + Math.sin(time * 7) * 0.18 : m === 'attention' ? 0.65 : 0.15;
        eyes.forEach((e) => (e.scale.y = Math.sin(time * 1.2) > 0.996 ? 0.2 : 1));
        if (running) {
          pieces.forEach((p) => {
            p.position.x += dt * 0.6;
            if (p.position.x > 1.9) p.position.x = -0.65;
          });
          rollers.forEach((r) => {
            r.position.x += dt * 0.6;
            if (r.position.x > 1.95) r.position.x = -0.65;
          });
        }
      }
      renderer.render(scene, camera);
    }
    const resize = new ResizeObserver(() => {
      const w = el.clientWidth,
        h = el.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
    });
    resize.observe(el);
    frame = requestAnimationFrame(render);
    const lost = (e: Event) => {
      e.preventDefault();
      contextLost = true;
      cancelAnimationFrame(frame);
      setFallback(true);
    };
    const restored = () => {
      if (disposed) return;
      contextLost = false;
      setFallback(false);
      last = performance.now();
      frame = requestAnimationFrame(render);
    };
    renderer.domElement.addEventListener('webglcontextlost', lost);
    renderer.domElement.addEventListener('webglcontextrestored', restored);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resize.disconnect();
      media.removeEventListener('change', onMotion);
      renderer.domElement.removeEventListener('webglcontextlost', lost);
      renderer.domElement.removeEventListener('webglcontextrestored', restored);
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      grid.geometry.dispose();
      (grid.material as THREE.Material).dispose();
      renderer.dispose();
      // dispose releases Three resources; explicitly release the browser context too.
      // This matters when React Strict Mode remounts or users navigate repeatedly.
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [attempt]);
  return (
    <div
      className={'workshop ' + (large ? 'large' : '')}
      role={fallback ? 'group' : 'img'}
      aria-label={
        'Taller Galileo. ' +
        (snapshot?.running
          ? 'Estación en funcionamiento. Cinta activa.'
          : 'Estación en espera. Cinta detenida.')
      }
    >
      <div ref={host} className="canvas-host" />
      {fallback && (
        <div className="fallback">
          <div className={'fallback-machine ' + (snapshot?.running ? 'on' : '')}>◉</div>
          <strong>{snapshot?.running ? 'Estación activa' : 'Estación en espera'}</strong>
          <p>
            WebGL no está disponible. Podés completar toda la práctica con los controles HTML y los
            mensajes de estado.
          </p>
          <button className="secondary" onClick={() => setAttempt((value) => value + 1)}>
            Reintentar vista 3D
          </button>
        </div>
      )}
      <div className="scene-label">
        <span className={'status-dot ' + (snapshot?.running ? 'on' : '')} />
        {snapshot?.running ? 'ESTACIÓN ACTIVA' : 'TALLER EN ESPERA'}
        <span>{fallback ? 'VISTA ALTERNATIVA' : 'VISTA 3D'}</span>
      </div>
    </div>
  );
}
