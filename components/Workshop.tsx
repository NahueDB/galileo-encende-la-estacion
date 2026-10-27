'use client';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { Snapshot } from '@/lib/types';
import {
  getWorkshopView,
  workshopModules,
  type WorkshopMode,
  type WorkshopModule,
} from '@/lib/workshop-progress';
export default function Workshop({
  mode,
  completed = [],
  snapshot,
  mood = 'wait',
  large = false,
  fitToPanel = false,
}: {
  mode: WorkshopMode;
  completed?: readonly number[];
  snapshot?: Snapshot;
  mood?: 'wait' | 'attention' | 'help' | 'celebrate';
  large?: boolean;
  fitToPanel?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const view = getWorkshopView(mode, completed);
  const running = mode === 'campaign' && !!snapshot?.running;
  const current = useRef({ snapshot, mood, mode, visibleModules: view.visibleModules });
  current.current = { snapshot, mood, mode, visibleModules: view.visibleModules };
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
    // Stable groups: create once, change only visibility as permanent progress changes.
    const modules = Object.fromEntries(
      workshopModules.map((module) => {
        const group = new THREE.Group();
        group.name = module.key;
        group.visible = current.current.visibleModules[module.key];
        scene.add(group);
        return [module.key, group];
      }),
    ) as Record<WorkshopModule, THREE.Group>;
    // Keep the recovered terminal in front-left, clear of Gali's silhouette.
    modules.operator.position.set(-0.6, 0, 2.65);
    // 1: the station, conveyor and its floor connection are revealed together.
    box(modules.station, 2.15, 1.7, 1.35, 1, 0.8, -0.8, navy, true);
    box(modules.station, 2.1, 0.025, 0.045, -0.45, -0.065, -0.4, cyan);
    box(modules.station, 0.045, 0.025, 0.65, 0.6, -0.065, -0.7, cyan);
    // 2: the message panel is installed independently of the machine's running state.
    box(modules.panel, 1.7, 1.1, 0.12, 1, 1.05, -0.04, metal, true);
    box(modules.panel, 1.34, 0.68, 0.13, 1, 1.2, 0.04, dark, true);
    box(modules.panel, 1.05, 0.06, 0.06, 1, 1.32, 0.13, cyan);
    box(modules.panel, 0.67, 0.06, 0.06, 0.8, 1.12, 0.13, metal);
    // 3: power unit, cabling and beacon. Being installed never starts the belt.
    const lamp = box(modules.power, 0.18, 0.22, 0.18, 1.8, 1.9, -0.4, orange, true);
    const lampMaterial = mat(0x8d6741);
    lamp.material = lampMaterial;
    box(modules.power, 0.13, 1.4, 0.13, 2.1, 1.45, -0.8, metal);
    box(modules.power, 0.62, 0.6, 0.75, 2.35, 0.45, -0.8, metal, true);
    box(modules.power, 0.35, 0.2, 0.08, 2.35, 0.5, -0.38, cyan, true);
    box(modules.power, 0.08, 0.08, 1.1, 2.15, 0.1, 0.1, navy);
    box(modules.station, 2.9, 0.18, 1.15, 0.65, 0.56, 1.05, metal, true);
    box(modules.station, 2.7, 0.1, 0.85, 0.65, 0.69, 1.05, dark);
    for (const x of [-0.5, 1.8])
      for (const z of [0.65, 1.45]) box(modules.station, 0.12, 0.6, 0.12, x, 0.18, z, metal);
    const rollers: THREE.Mesh[] = [];
    for (let i = 0; i < 12; i++) {
      const x = -0.65 + i * 0.23;
      const b = box(modules.station, 0.035, 0.03, 0.83, x, 0.76, 1.05, navy);
      rollers.push(b);
    }
    const pieces: THREE.Mesh[] = [];
    for (let i = 0; i < 3; i++)
      pieces.push(
        box(
          modules.station,
          0.3,
          0.28,
          0.3,
          -0.3 + i * 0.8,
          0.92,
          1.05,
          i === 1 ? cyan : orange,
          true,
        ),
      );
    // 4: a two-button console, separate from the HTML controls used by students.
    box(modules.controls, 0.16, 0.65, 0.16, 2.6, 0.3, 1.3, metal);
    box(modules.controls, 0.85, 0.25, 0.65, 2.6, 0.72, 1.3, navy, true);
    box(modules.controls, 0.22, 0.09, 0.22, 2.38, 0.9, 1.3, green, true);
    box(modules.controls, 0.22, 0.09, 0.22, 2.78, 0.9, 1.3, orange, true);
    // 6: the validation gate is an installed module, not a fictitious registration.
    for (const z of [0.48, 1.62]) box(modules.validation, 0.12, 0.85, 0.12, 1.55, 1.15, z, metal);
    box(modules.validation, 0.2, 0.14, 1.4, 1.55, 1.62, 1.05, navy, true);
    box(modules.validation, 0.23, 0.08, 0.7, 1.55, 1.72, 1.05, cyan);
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
    const head = new THREE.Group();
    head.position.y = 1.35;
    robot.add(head);
    // Keep the original placement while giving the face a neck pivot.
    robot.children
      .filter((child) => child !== head && child.position.y > 1.5)
      .forEach((child) => head.attach(child));
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
    // 5: terminal; the live person's name remains in the DOM-derived credential.
    box(modules.operator, 0.8, 0.08, 0.55, -2.1, 0, -1.35, metal, true);
    box(modules.operator, 0.12, 0.8, 0.12, -2.1, 0.4, -1.35, metal);
    const terminal = box(modules.operator, 0.95, 0.65, 0.18, -2.1, 0.95, -1.35, navy, true);
    terminal.rotation.x = -0.18;
    box(modules.operator, 0.73, 0.4, 0.06, -2.1, 1, -1.21, dark, true);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.025, 6, 32), cyan);
    geometries.push(ring.geometry);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(1, 0.03, -0.65);
    modules.station.add(ring);
    const pulseMaterial = new THREE.MeshBasicMaterial({
      color: 0x65d5f3,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    materials.push(pulseMaterial);
    const pulseGeometry = new THREE.TorusGeometry(0.8, 0.018, 6, 48);
    geometries.push(pulseGeometry);
    const pulses = Array.from({ length: 3 }, () => {
      const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
      pulse.rotation.x = -Math.PI / 2;
      pulse.position.set(1, 0.04, -0.65);
      modules.station.add(pulse);
      return pulse;
    });
    // One instanced draw call for the celebration, with no textures or postprocessing.
    const sparkGeometry = new THREE.BoxGeometry(0.065, 0.12, 0.025);
    const sparkMaterial = new THREE.MeshBasicMaterial();
    geometries.push(sparkGeometry);
    materials.push(sparkMaterial);
    const sparks = new THREE.InstancedMesh(sparkGeometry, sparkMaterial, 36);
    sparks.frustumCulled = false;
    const sparkTransform = new THREE.Object3D();
    const sparkColors = [0x65d5f3, 0x7be5c4, 0xfff200];
    for (let i = 0; i < sparks.count; i++)
      sparks.setColorAt(i, new THREE.Color(sparkColors[i % sparkColors.length]));
    scene.add(sparks);
    let previousMood = '',
      celebration = 10,
      activation = 10,
      wasRunning = false;
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
      if (document.hidden) return;
      time += dt;
      const { snapshot: s, mood: m, mode: sceneMode, visibleModules } = current.current;
      for (const module of workshopModules)
        modules[module.key].visible = visibleModules[module.key];
      const running = sceneMode === 'campaign' && !!s?.running;
      const highlighted =
        sceneMode === 'campaign' &&
        (!!s?.selected || s?.text === 'El taller está disponible para trabajar');
      if (m === 'celebrate' && previousMood !== m) celebration = 0;
      if (m !== 'celebrate' && previousMood === 'celebrate') celebration = 10;
      if (running && !wasRunning) activation = 0;
      previousMood = m;
      wasRunning = running;
      celebration += dt;
      activation += dt;
      lampMaterial.color.set(running ? 0x47e1bb : highlighted ? 0x6bdfff : 0xa77c45);
      lampMaterial.emissive.set(running ? 0x26cba5 : highlighted ? 0x278fbe : 0x000000);
      ring.visible = !!s?.selected || m === 'celebrate';
      sparks.visible = !reduced && celebration < 2.8;
      pulses.forEach((pulse) => {
        pulse.visible = !reduced && (running || celebration < 2.8);
      });
      // Reset transforms too when the motion preference changes during a session.
      if (reduced) {
        robot.position.y = 0;
        robot.rotation.set(0, 0.18, 0);
        head.rotation.set(0, 0, 0);
        arms[0].rotation.z = m === 'celebrate' ? 2.25 : 0.15;
        arms[1].rotation.z = m === 'celebrate' ? -2.25 : -0.15;
        eyes.forEach((eye) => {
          eye.scale.y = 1;
        });
        ring.scale.setScalar(1);
        cyan.emissiveIntensity = 0.7;
        lampMaterial.emissiveIntensity = 0.7;
        camera.position.set(7, 5.1, 9);
        camera.lookAt(0, 1, 0);
      }
      if (!reduced) {
        const entrance = Math.min(time / 1.1, 1);
        const reveal = 1 - Math.pow(1 - entrance, 3);
        camera.position.set(7.8 - reveal * 0.8, 5.5 - reveal * 0.4, 10.2 - reveal * 1.2);
        camera.lookAt(0, 1, 0);
        robot.position.y =
          m === 'celebrate' && celebration < 2.8
            ? Math.abs(Math.sin(celebration * 5)) * 0.28 * Math.min(1, 2.8 - celebration)
            : Math.sin(time * 1.8) * 0.045;
        robot.rotation.z = m === 'celebrate' && celebration < 2.8 ? Math.sin(time * 5) * 0.07 : 0;
        head.rotation.y = Math.sin(time * 0.9) * (m === 'attention' ? 0.22 : 0.08);
        head.rotation.z = m === 'help' ? -0.13 : Math.sin(time * 1.5) * 0.035;
        arms[1].rotation.z =
          m === 'help'
            ? -1.7 + Math.sin(time * 3) * 0.15
            : m === 'celebrate'
              ? -2.25 + Math.sin(time * 7) * 0.18
              : m === 'attention' && time % 7 < 2.5
                ? -2.2 + Math.sin(time * 9) * 0.3
                : -0.15;
        arms[0].rotation.z =
          m === 'celebrate' ? 2.25 + Math.sin(time * 7) * 0.18 : m === 'attention' ? 0.65 : 0.15;
        eyes.forEach((e) => (e.scale.y = Math.sin(time * 1.2) > 0.996 ? 0.2 : 1));
        ring.scale.setScalar(1 + Math.sin(time * 3) * 0.08);
        cyan.emissiveIntensity = 0.7 + Math.sin(time * 2.5) * 0.2;
        pulseMaterial.opacity = running ? 0.45 : Math.max(0, 1 - celebration / 2.8) * 0.5;
        pulses.forEach((pulse, i) => {
          const phase = (time * 0.65 + i / 3) % 1;
          pulse.position.y = 0.08 + phase * 2.1;
          pulse.scale.setScalar(0.65 + phase * 0.5);
        });
        if (sparks.visible) {
          for (let i = 0; i < sparks.count; i++) {
            const angle = i * 2.39996;
            const speed = 0.6 + (i % 7) * 0.16;
            const age = Math.max(0, celebration - (i % 4) * 0.05);
            sparkTransform.position.set(
              -0.7 + Math.cos(angle) * speed * age,
              1.6 + (2.1 + (i % 5) * 0.22) * age - 1.9 * age * age,
              Math.sin(angle) * speed * age,
            );
            sparkTransform.rotation.set(age * 3 + i, age * 2, age * 4);
            sparkTransform.scale.setScalar(Math.max(0, 1 - age / 2.8));
            sparkTransform.updateMatrix();
            sparks.setMatrixAt(i, sparkTransform.matrix);
          }
          sparks.instanceMatrix.needsUpdate = true;
        }
        if (running) {
          lampMaterial.emissiveIntensity = 0.9 + Math.sin(time * 4) * 0.25;
          pieces.forEach((p) => {
            p.position.x += dt * 0.6;
            p.position.y = 0.92 + Math.sin(Math.min(activation * 4, Math.PI)) * 0.08;
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
      camera.zoom = fitToPanel ? Math.min(1.35, Math.max(0.8, camera.aspect / 1.8)) : 1;
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
      sparks.dispose();
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
  }, [attempt, fitToPanel]);
  return (
    <div
      className={'workshop ' + (large ? 'large' : '')}
      data-mode={mode}
      data-installed-modules={view.completedIds.join(',')}
      data-visible-modules={workshopModules
        .filter((module) => view.visibleModules[module.key])
        .map((module) => module.id)
        .join(',')}
      data-mood={mood}
      data-running={running ? 'true' : 'false'}
      role={fallback ? 'group' : 'img'}
      aria-label={
        'Taller Galileo. ' +
        (mode === 'preview'
          ? 'Demostración de la escena, sin logros de una partida.'
          : mode === 'summary'
            ? `Resumen: ${view.recoveredCount} de 6 módulos recuperados. Estación detenida.`
            : running
              ? 'Estación en funcionamiento. Cinta activa.'
              : 'Estación en espera. Cinta detenida.')
      }
      aria-description={
        mode === 'campaign'
          ? `Progreso permanente: ${view.recoveredCount} de 6 módulos recuperados.`
          : undefined
      }
    >
      <div ref={host} className="canvas-host" />
      {fallback && (
        <div className="fallback">
          <div className={'fallback-machine ' + (running ? 'on' : '')}>◉</div>
          <strong>{running ? 'Estación activa' : 'Estación en espera'}</strong>
          <p>
            WebGL no está disponible. Podés seguir con los controles HTML y los mensajes de estado.
            {mode !== 'preview' && ` Conservás ${view.recoveredCount} de 6 módulos recuperados.`}
          </p>
          <button className="secondary" onClick={() => setAttempt((value) => value + 1)}>
            Reintentar vista 3D
          </button>
        </div>
      )}
      <div className="scene-label">
        <span className={'status-dot ' + (running ? 'on' : '')} />
        {mode === 'preview'
          ? 'DEMOSTRACIÓN DEL TALLER'
          : mode === 'summary'
            ? 'RESUMEN DEL TALLER'
            : running
              ? 'ESTACIÓN ACTIVA'
              : 'TALLER EN ESPERA'}
        <span>
          {mode === 'preview'
            ? fallback
              ? 'VISTA ALTERNATIVA'
              : 'VISTA 3D'
            : `${view.recoveredCount}/6 MÓDULOS`}
        </span>
      </div>
    </div>
  );
}
