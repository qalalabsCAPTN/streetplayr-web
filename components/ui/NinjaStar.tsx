"use client";

import { useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

function buildBladeGeometry(): THREE.BufferGeometry {
  const W = 0.28;
  const T = 0.06;

  const sections = [
    { y: 0.00, w: W, t: T },
    { y: 0.06, w: 0.275, t: 0.058 },
    { y: 0.22, w: 0.26, t: 0.055 },
    { y: 0.50, w: 0.22, t: 0.048 },
    { y: 0.85, w: 0.17, t: 0.038 },
    { y: 1.22, w: 0.11, t: 0.026 },
    { y: 1.55, w: 0.05, t: 0.013 },
    { y: 1.75, w: 0.01, t: 0.003 },
  ];
  const tip = { y: 1.8, w: 0, t: 0 };

  // For each section: 4 vertices [left, right, frontRidge, backRidge]
  // For the tip: single vertex at (0, 1.8, 0)
  const verts: number[] = [];

  const addV = (x: number, y: number, z: number) => verts.push(x, y, z);

  // Cross-section vertices
  const secVerts = sections.map((s) => ({
    left: [-s.w / 2, s.y, 0] as [number, number, number],
    right: [s.w / 2, s.y, 0] as [number, number, number],
    fRidge: [0, s.y, s.t / 2] as [number, number, number],
    bRidge: [0, s.y, -s.t / 2] as [number, number, number],
  }));

  type V3 = [number, number, number];

  function tri(a: V3, b: V3, c: V3) {
    // Compute flat normal for CCW winding
    const ax = b[0] - a[0], ay = b[1] - a[1], az = b[2] - a[2];
    const bx = c[0] - a[0], by = c[1] - a[1], bz = c[2] - a[2];
    const nx = ay * bz - az * by;
    const ny = az * bx - ax * bz;
    const nz = ax * by - ay * bx;
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
    const nxf = nx / len, nyf = ny / len, nzf = nz / len;
    addV(a[0], a[1], a[2]); addV(nxf, nyf, nzf);
    addV(b[0], b[1], b[2]); addV(nxf, nyf, nzf);
    addV(c[0], c[1], c[2]); addV(nxf, nyf, nzf);
  }

  function quad(a: V3, b: V3, c: V3, d: V3) {
    tri(a, c, b);
    tri(b, c, d);
  }

  // Connect sections
  for (let i = 0; i < secVerts.length - 1; i++) {
    const s = secVerts[i];
    const n = secVerts[i + 1];

    // Front-left facet: fRidge(i) → left(i) → fRidge(i+1) → left(i+1)
    quad(s.fRidge, s.left, n.fRidge, n.left);
    // Front-right facet: fRidge(i) → right(i) → fRidge(i+1) → right(i+1)
    quad(s.fRidge, n.fRidge, s.right, n.right);
    // Back-left facet: bRidge(i) → left(i) → bRidge(i+1) → left(i+1)
    quad(s.bRidge, n.bRidge, s.left, n.left);
    // Back-right facet: bRidge(i) → right(i) → bRidge(i+1) → right(i+1)
    quad(s.bRidge, s.right, n.bRidge, n.right);
  }

  // Cap tip: connect last section to tip point
  const last = secVerts[secVerts.length - 1];
  const tipP: V3 = [0, tip.y, 0];
  tri(last.fRidge, last.left, tipP);
  tri(last.fRidge, tipP, last.right);
  tri(last.bRidge, tipP, last.left);
  tri(last.bRidge, last.right, tipP);

  // Cap base: close the base with 4 triangles
  const first = secVerts[0];
  const center: V3 = [0, 0, 0];
  tri(first.left, first.fRidge, center);
  tri(first.right, center, first.fRidge);
  tri(first.left, center, first.bRidge);
  tri(first.right, first.bRidge, center);

  const geo = new THREE.BufferGeometry();
  const stride = 6; // position(3) + normal(3)
  const pos = new Float32Array(verts.length / stride * 3);
  const norm = new Float32Array(verts.length / stride * 3);
  for (let i = 0; i < verts.length / stride; i++) {
    pos[i * 3] = verts[i * stride];
    pos[i * 3 + 1] = verts[i * stride + 1];
    pos[i * 3 + 2] = verts[i * stride + 2];
    norm[i * 3] = verts[i * stride + 3];
    norm[i * 3 + 1] = verts[i * stride + 4];
    norm[i * 3 + 2] = verts[i * stride + 5];
  }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("normal", new THREE.BufferAttribute(norm, 3));
  return geo;
}

const bladeGeo = buildBladeGeometry();

function Blade({ rotation }: { rotation: [number, number, number] }) {
  return (
    <mesh geometry={bladeGeo} rotation={rotation}>
      <meshPhysicalMaterial
        color="#f4f4f4"
        metalness={1}
        roughness={0.04}
        clearcoat={1}
        clearcoatRoughness={0.02}
        envMapIntensity={2.2}
      />
    </mesh>
  );
}

function Blades() {
  return (
    <group>
      <Blade rotation={[0, 0, 0]} />
      <Blade rotation={[0, 0, Math.PI / 2]} />
      <Blade rotation={[0, 0, Math.PI]} />
      <Blade rotation={[0, 0, -Math.PI / 2]} />
    </group>
  );
}

function CenterCrystal() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.z += delta * 0.3;
    const t = state.clock.elapsedTime;
    const mat = meshRef.current.material as THREE.MeshPhysicalMaterial;
    mat.emissiveIntensity = 1.6 + Math.sin(t * 1.8) * 0.25;
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <octahedronGeometry args={[0.18, 0]} />
      <meshPhysicalMaterial
        color="#c77dff"
        emissive="#9d4edd"
        emissiveIntensity={2.2}
        metalness={0.05}
        roughness={0.15}
      />
    </mesh>
  );
}

function StableEnvironment() {
  const { scene, gl } = useThree();

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0x14141e);
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444466, 1);
    envScene.add(hemi);
    const dir = new THREE.DirectionalLight(0xb8a1ff, 0.6);
    dir.position.set(1, 2, 1);
    envScene.add(dir);
    const envMap = pmrem.fromScene(envScene).texture;
    // eslint-disable-next-line react-hooks/immutability
    scene.environment = envMap;
    return () => {
      envMap.dispose();
      pmrem.dispose();
    };
  }, [scene, gl]);

  return null;
}

function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight position={[3, 5, 5]} intensity={1.8} />
      <directionalLight position={[-3, -2, 3]} intensity={0.6} color="#b8a1ff" />
      <pointLight position={[0, -4, -5]} intensity={0.5} color="#b8a1ff" />
    </>
  );
}

function CompassStarModel() {
  const groupRef = useRef<THREE.Group>(null);
  const isDragging = useRef(false);
  const prevX = useRef(0);
  const velocity = useRef(0);
  const lastMoveTime = useRef(0);
  const autoRotate = useRef(true);

  useEffect(() => {
    const el = document.querySelector("canvas");
    if (!el) return;

    const onPointerDown = (e: PointerEvent) => {
      isDragging.current = true;
      prevX.current = e.clientX;
      autoRotate.current = false;
      velocity.current = 0;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging.current || !groupRef.current) return;
      const dx = e.clientX - prevX.current;
      prevX.current = e.clientX;
      groupRef.current.rotation.z += dx * 0.008;
      velocity.current = dx * 0.008 * 0.9;
      lastMoveTime.current = Date.now();
    };

    const onPointerUp = () => {
      isDragging.current = false;
      lastMoveTime.current = Date.now();
    };

    el.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    if (isDragging.current) return;

    const idleTime = Date.now() - lastMoveTime.current;

    if (idleTime > 3000 && !autoRotate.current) {
      autoRotate.current = true;
    }

    if (velocity.current !== 0) {
      if (idleTime < 500) {
        groupRef.current.rotation.z += velocity.current;
        velocity.current *= 0.92;
        if (Math.abs(velocity.current) < 0.0001) velocity.current = 0;
      } else {
        velocity.current = 0;
      }
    }

    if (autoRotate.current && velocity.current === 0) {
      groupRef.current.rotation.z += delta * 0.15;
    }

    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.1) * 0.02;
  });

  return (
    <group ref={groupRef} scale={0.54}>
      <Blades />
      <CenterCrystal />
    </group>
  );
}

export default function NinjaStar({ size = 340 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size }}>
      <Canvas
        camera={{ position: [0, 0, 4], fov: 35 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        dpr={[1, 1.5]}
        style={{ width: "100%", height: "100%" }}
      >
        <StableEnvironment />
        <SceneLights />
        <CompassStarModel />
      </Canvas>
    </div>
  );
}
