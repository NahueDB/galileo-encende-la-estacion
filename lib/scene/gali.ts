import * as THREE from 'three';
import type { GaliPose } from '../gali-dialogue';

// Each renderer owns an independent, lightweight pearl-shell character.
export function createGali() {
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  function material(color: number, emissive = 0, glow = false) {
    const m = glow
      ? new THREE.MeshBasicMaterial({ color })
      : new THREE.MeshPhysicalMaterial({
          color,
          metalness: 0.06,
          roughness: 0.25,
          clearcoat: 1,
          clearcoatRoughness: 0.16,
          emissive,
          emissiveIntensity: 0.7,
        });
    materials.push(m);
    return m;
  }
  const pearl = material(0xe9f2f2),
    glass = material(0x03121f),
    blue = material(0x57dfff, 0x37b9eb, true),
    glint = material(0xeaffff, 0, true),
    green = material(0x79edcb, 0, true);
  const sphere = new THREE.SphereGeometry(1, 28, 20);
  geometries.push(sphere);
  function oval(
    parent: THREE.Object3D,
    scale: [number, number, number],
    position: [number, number, number],
    mat: THREE.Material,
  ) {
    const mesh = new THREE.Mesh(sphere, mat);
    mesh.scale.set(...scale);
    mesh.position.set(...position);
    parent.add(mesh);
    return mesh;
  }
  const root = new THREE.Group(),
    robot = new THREE.Group();
  root.add(robot);
  // A continuous tapered body, with no feet, joints or box-shaped chest.
  const profile = [
    [0, 0.16],
    [0.11, 0.18],
    [0.23, 0.3],
    [0.34, 0.51],
    [0.42, 0.79],
    [0.45, 1.03],
    [0.4, 1.23],
    [0.28, 1.35],
    [0, 1.39],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const shell = new THREE.LatheGeometry(profile, 32);
  shell.computeVertexNormals();
  geometries.push(shell);
  robot.add(new THREE.Mesh(shell, pearl));
  oval(robot, [0.12, 0.14, 0.035], [0, 1.04, 0.423], glass);
  oval(robot, [0.042, 0.064, 0.012], [0, 1.055, 0.46], green);
  const head = new THREE.Group();
  head.position.y = 1.51;
  robot.add(head);
  oval(head, [0.66, 0.46, 0.47], [0, 0.44, 0], pearl);
  oval(head, [0.565, 0.295, 0.145], [0, 0.455, 0.38], glass);
  const eyes = [-1, 1].map((side) => {
    const eye = new THREE.Group();
    eye.position.set(side * 0.225, 0.49, 0.511);
    head.add(eye);
    oval(eye, [0.133, 0.083, 0.027], [0, 0, 0], blue);
    oval(eye, [0.035, 0.018, 0.01], [-0.033, 0.024, 0.026], glint);
    eye.rotation.z = side * 0.12;
    return eye;
  });
  const arms = [-1, 1].map((side) => {
    const arm = new THREE.Group();
    arm.position.set(side * 0.48, 1.19, 0);
    robot.add(arm);
    const fin = oval(arm, [0.12, 0.39, 0.185], [side * 0.045, -0.24, 0.025], pearl);
    fin.rotation.z = side * -0.1;
    return arm;
  });
  const thrusters = new THREE.Group();
  robot.add(thrusters);
  const jetMaterial = new THREE.MeshBasicMaterial({
    color: 0x67ddff,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  materials.push(jetMaterial);
  oval(thrusters, [0.16, 0.33, 0.14], [0, -0.025, 0], jetMaterial);
  oval(thrusters, [0.075, 0.23, 0.07], [0, 0.01, 0], glint);
  const ringGeometry = new THREE.TorusGeometry(0.21, 0.012, 6, 32);
  geometries.push(ringGeometry);
  const ring = new THREE.Mesh(ringGeometry, blue);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.13;
  thrusters.add(ring);
  let previous: GaliPose = 'idle',
    began = 0;
  return {
    root,
    head,
    arms,
    body: robot,
    thrusters,
    update(pose: GaliPose, time: number, reduced: boolean) {
      if (pose !== previous) {
        previous = pose;
        began = time;
      }
      const age = time - began;
      robot.position.set(0, 0, 0);
      robot.rotation.set(0, 0, 0);
      head.rotation.set(0, 0, 0);
      arms[0].rotation.set(0, 0, 0.14);
      arms[1].rotation.set(0, 0, -0.14);
      eyes.forEach((e) => {
        e.scale.set(1, 1, 1);
      });
      thrusters.visible = !reduced && (pose === 'takeoff' || pose === 'landing');
      if (reduced) return;
      robot.position.y = Math.sin(time * 1.7) * 0.075;
      robot.rotation.z = Math.sin(time * 0.85) * 0.025;
      head.rotation.y = Math.sin(time * 0.8) * 0.09;
      const blink = Math.sin(time * 1.15) > 0.995 ? 0.12 : 1;
      eyes.forEach((e) => (e.scale.y = blink));
      if (pose === 'greeting' && age < 3) {
        arms[1].rotation.z = -1.95 + Math.sin(age * 8) * 0.22;
        head.rotation.z = -0.06;
      }
      if (pose === 'attention') {
        head.rotation.x = 0.1;
        eyes.forEach((e) => (e.scale.x = 1.08));
        arms[0].rotation.z = 0.45;
      }
      if (pose === 'explain') {
        arms[1].rotation.z = -1.3 + Math.sin(time * 2) * 0.1;
        head.rotation.z = -0.07;
      }
      if (pose === 'review') {
        head.rotation.z = -0.16;
        head.rotation.y = 0.12;
        arms[0].rotation.z = 0.4;
      }
      if (pose === 'celebrate' && age < 2.6) {
        const turn = Math.min(age / 1.6, 1);
        robot.rotation.y = turn * turn * (3 - 2 * turn) * Math.PI * 2;
        robot.position.y += Math.sin(Math.min(age / 2.6, 1) * Math.PI) * 0.3;
        arms[0].rotation.z = 1.15;
        arms[1].rotation.z = -1.15;
        eyes.forEach((e) => (e.scale.y = blink * 0.75));
      }
      if (thrusters.visible) {
        thrusters.scale.y = 0.85 + Math.sin(time * 16) * 0.12;
        robot.rotation.z = pose === 'takeoff' ? -0.16 : 0.08;
        arms[0].rotation.z = 0.3;
        arms[1].rotation.z = -0.3;
      }
    },
    dispose() {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    },
  };
}
