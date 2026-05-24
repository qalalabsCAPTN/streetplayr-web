"use client";

import { useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// ─── Blade geometry ───────────────────────────────────────────────────────────
function buildBladeGeo(length: number, maxW: number, maxT: number): THREE.BufferGeometry {
  // 6-vertex cross-section: left, left-front, right-front, right, back
  // Extra inner-front verts create a sharper spine ridge for luxury chrome facets.
  const profile = [
    { u: 0.00, wf: 1.00, tf: 1.00 },
    { u: 0.03, wf: 0.99, tf: 0.98 },
    { u: 0.09, wf: 0.94, tf: 0.94 },
    { u: 0.18, wf: 0.85, tf: 0.88 },
    { u: 0.30, wf: 0.72, tf: 0.79 },
    { u: 0.44, wf: 0.56, tf: 0.68 },
    { u: 0.59, wf: 0.40, tf: 0.54 },
    { u: 0.73, wf: 0.25, tf: 0.39 },
    { u: 0.85, wf: 0.13, tf: 0.24 },
    { u: 0.94, wf: 0.05, tf: 0.11 },
    { u: 0.99, wf: 0.01, tf: 0.03 },
  ];

  type V3 = [number, number, number];
  const positions: number[] = [];
  const normals: number[] = [];

  function tri(a: V3, b: V3, c: V3) {
    const ax = b[0]-a[0], ay = b[1]-a[1], az = b[2]-a[2];
    const bx = c[0]-a[0], by = c[1]-a[1], bz = c[2]-a[2];
    let nx = ay*bz - az*by, ny = az*bx - ax*bz, nz = ax*by - ay*bx;
    const l = Math.sqrt(nx*nx + ny*ny + nz*nz) || 1;
    nx /= l; ny /= l; nz /= l;
    for (const v of [a, b, c]) { positions.push(v[0], v[1], v[2]); normals.push(nx, ny, nz); }
  }
  function quad(a: V3, b: V3, c: V3, d: V3) { tri(a, b, c); tri(a, c, d); }

  const sv = profile.map(p => {
    const y  = p.u  * length;
    const w  = p.wf * maxW * 0.5;
    const t  = p.tf * maxT * 0.5;
    const wi = w * 0.38; // inner ridge x-offset (creates two front facet planes)
    return {
      L:  [-w,  y, 0  ] as V3,
      LF: [-wi, y, t*0.82] as V3, // left-front sub-ridge
      RF: [ wi, y, t*0.82] as V3, // right-front sub-ridge
      R:  [ w,  y, 0  ] as V3,
      B:  [ 0,  y,-t  ] as V3,
    };
  });

  const tip: V3 = [0, length, 0];

  for (let i = 0; i < sv.length - 1; i++) {
    const s = sv[i], n = sv[i+1];
    // Front: two sub-planes (left-front and right-front facets)
    quad(s.LF, n.LF, n.L,  s.L );  // outer-left front
    quad(n.LF, s.LF, s.RF, n.RF);  // center-front (spine)
    quad(n.RF, s.RF, s.R,  n.R );  // outer-right front
    // Back: two planes
    quad(n.B, s.B, s.L, n.L);      // back-left
    quad(s.B, n.B, n.R, s.R);      // back-right
  }

  // Tip
  const e = sv[sv.length - 1];
  tri(e.LF, e.L,  tip); tri(e.LF, tip, e.RF);
  tri(e.RF, tip, e.R);
  tri(e.B,  tip, e.L);  tri(e.B,  e.R, tip);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
  geo.setAttribute("normal",   new THREE.BufferAttribute(new Float32Array(normals),   3));
  return geo;
}

const vGeo = buildBladeGeo(2.05, 0.30, 0.11); // vertical (top/bottom) — taller
const hGeo = buildBladeGeo(1.55, 0.27, 0.08); // horizontal (left/right) — wider, flatter

// ─── Chrome material ──────────────────────────────────────────────────────────
// metalness < 1 lets direct lights contribute diffuse → visible even in dark scenes.
// Low roughness keeps sharp specular highlights for the luxury feel.
const CHROME = {
  color:               "#c8c8e0" as const,
  metalness:           0.82,
  roughness:           0.05,
  clearcoat:           1.0,
  clearcoatRoughness:  0.02,
  envMapIntensity:     3.0,
  emissive:            "#1a1a2e" as const,
  emissiveIntensity:   0.35,
} as const;

// ─── Blades ───────────────────────────────────────────────────────────────────
function StarBlades() {
  return (
    <group>
      <mesh geometry={vGeo} rotation={[0, 0, 0]}>
        <meshPhysicalMaterial {...CHROME} />
      </mesh>
      <mesh geometry={vGeo} rotation={[0, 0, Math.PI]}>
        <meshPhysicalMaterial {...CHROME} />
      </mesh>
      <mesh geometry={hGeo} rotation={[0, 0, -Math.PI / 2]}>
        <meshPhysicalMaterial {...CHROME} />
      </mesh>
      <mesh geometry={hGeo} rotation={[0, 0,  Math.PI / 2]}>
        <meshPhysicalMaterial {...CHROME} />
      </mesh>
    </group>
  );
}

// ─── Center crystal + bezel ───────────────────────────────────────────────────
function CrystalCore() {
  const crystalRef = useRef<THREE.Mesh>(null);
  const lightRef   = useRef<THREE.PointLight>(null);
  const halo1Ref   = useRef<THREE.Mesh>(null);
  const halo2Ref   = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const pulse = Math.sin(t * 2.0) * 0.5 + 0.5; // 0→1

    if (crystalRef.current) {
      const m = crystalRef.current.material as THREE.MeshPhysicalMaterial;
      m.emissiveIntensity = 2.8 + pulse * 1.4;
    }
    if (lightRef.current) {
      lightRef.current.intensity = 5.0 + pulse * 3.5;
    }
    if (halo1Ref.current) {
      const m = halo1Ref.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.10 + pulse * 0.08;
    }
    if (halo2Ref.current) {
      const m = halo2Ref.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.04 + pulse * 0.04;
    }
  });

  return (
    <>
      {/* Purple point light — bleeds onto chrome blades */}
      <pointLight ref={lightRef} color="#9933ff" intensity={5.5} distance={4.5} decay={2} />

      {/* Layered fake-bloom halos */}
      <mesh ref={halo1Ref}>
        <sphereGeometry args={[0.38, 20, 20]} />
        <meshBasicMaterial color="#7700cc" transparent opacity={0.12} depthWrite={false} />
      </mesh>
      <mesh ref={halo2Ref}>
        <sphereGeometry args={[0.65, 20, 20]} />
        <meshBasicMaterial color="#5500aa" transparent opacity={0.05} depthWrite={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.95, 20, 20]} />
        <meshBasicMaterial color="#330077" transparent opacity={0.02} depthWrite={false} />
      </mesh>

      {/* Chrome bezel ring — luxury watch detail */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.195, 0.022, 10, 60]} />
        <meshPhysicalMaterial
          color="#e8e8ff"
          metalness={1}
          roughness={0.02}
          clearcoat={1}
          envMapIntensity={5}
        />
      </mesh>

      {/* Faceted diamond crystal */}
      <mesh ref={crystalRef} rotation={[Math.PI / 4, 0.3, Math.PI / 4]}>
        <octahedronGeometry args={[0.155, 1]} />
        <meshPhysicalMaterial
          color="#cc88ff"
          emissive="#8800ff"
          emissiveIntensity={3.2}
          metalness={0.0}
          roughness={0.05}
          transparent
          opacity={0.92}
          clearcoat={1}
          clearcoatRoughness={0.05}
        />
      </mesh>
    </>
  );
}

// ─── High-contrast studio environment ────────────────────────────────────────
// Chrome needs bright patches in the env + darkness everywhere else.
function Environment() {
  const { scene, gl } = useThree();

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env   = new THREE.Scene();

    const setup: [number, number, [number, number, number]][] = [
      [0xffffff, 20.0, [ 2,  5,  3]],  // top-right studio key
      [0xffffff, 12.0, [-3,  2,  2]],  // left secondary
      [0xffffff,  8.0, [ 0, -2,  5]],  // front-low fill
      [0xcc88ff,  6.0, [ 0,  1, -4]],  // purple back
      [0x88aaff,  5.0, [ 4, -1, -2]],  // blue-right rim
      [0xffffff, 10.0, [ 0,  0,  6]],  // direct front boost
    ];

    for (const [col, int, pos] of setup) {
      const d = new THREE.DirectionalLight(col, int);
      d.position.set(...pos);
      env.add(d);
    }
    env.add(new THREE.AmbientLight(0x9988cc, 2.5));

    const envMap = pmrem.fromScene(env).texture;
    scene.environment = envMap;
    return () => { envMap.dispose(); pmrem.dispose(); };
  }, [scene, gl]);

  return null;
}

// ─── Scene lights ─────────────────────────────────────────────────────────────
function SceneLights() {
  return (
    <>
      {/* Ambient just enough to reveal blade shape in shadows */}
      <ambientLight intensity={0.55} color="#9988bb" />

      {/* Top-right key — bright white, creates the main highlight */}
      <directionalLight position={[ 1,  5,  4]} intensity={8.0}  color="#ffffff" />

      {/* Left fill — reveals left blade faces */}
      <directionalLight position={[-4,  1,  3]} intensity={4.0}  color="#ddeeff" />

      {/* Front-low — lifts bottom blade, prevents total darkness */}
      <directionalLight position={[ 0, -2,  5]} intensity={3.0}  color="#bbbbff" />

      {/* Purple back rim — separates from bg */}
      <directionalLight position={[ 0,  1, -4]} intensity={2.5}  color="#9933ff" />

      {/* Strong point light near camera for specular pop */}
      <pointLight position={[1, 3, 5]} intensity={8.0} color="#ffffff" distance={16} />

      {/* Low purple point to illuminate underside with glow */}
      <pointLight position={[0, -3, 2]} intensity={3.0} color="#7722cc" distance={8} />
    </>
  );
}

// ─── Full 3-D trackball ───────────────────────────────────────────────────────
function CompassStar({ scale = 0.70 }: { scale?: number }) {
  const groupRef     = useRef<THREE.Group>(null);
  const dragging     = useRef(false);
  const lastPos      = useRef({ x: 0, y: 0 });
  const vel          = useRef({ x: 0, y: 0 });
  const lastMoveTime = useRef(0);
  const autoRotate   = useRef(true);

  useEffect(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;

    // Prevent browser scroll / zoom from intercepting touch on the canvas
    canvas.style.touchAction = "none";

    const onDown = (e: PointerEvent) => {
      dragging.current   = true;
      lastPos.current    = { x: e.clientX, y: e.clientY };
      vel.current        = { x: 0, y: 0 };
      autoRotate.current = false;
      try { canvas.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
    };

    const onMove = (e: PointerEvent) => {
      if (!dragging.current || !groupRef.current) return;
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      lastPos.current = { x: e.clientX, y: e.clientY };

      // Touch pointers are less precise — use slightly higher sensitivity
      const sens = e.pointerType === "touch" ? 0.014 : 0.011;

      groupRef.current.rotation.y += dx * sens;
      groupRef.current.rotation.x += dy * sens;
      groupRef.current.rotation.x = Math.max(-Math.PI * 0.55, Math.min(Math.PI * 0.55, groupRef.current.rotation.x));

      vel.current = { x: dy * sens, y: dx * sens };
      lastMoveTime.current = Date.now();
    };

    const onUp = () => { dragging.current = false; lastMoveTime.current = Date.now(); };

    canvas.addEventListener("pointerdown",  onDown, { passive: false });
    canvas.addEventListener("pointermove",  onMove, { passive: false });
    canvas.addEventListener("pointerup",    onUp);
    canvas.addEventListener("pointercancel", onUp);

    return () => {
      canvas.removeEventListener("pointerdown",  onDown);
      canvas.removeEventListener("pointermove",  onMove);
      canvas.removeEventListener("pointerup",    onUp);
      canvas.removeEventListener("pointercancel", onUp);
    };
  }, []);

  useFrame(({ clock }, delta) => {
    if (!groupRef.current || dragging.current) return;

    const idle = Date.now() - lastMoveTime.current;

    if (Math.abs(vel.current.x) > 0.0001 || Math.abs(vel.current.y) > 0.0001) {
      if (idle < 1200) {
        groupRef.current.rotation.x += vel.current.x;
        groupRef.current.rotation.y += vel.current.y;
        vel.current.x *= 0.92;
        vel.current.y *= 0.92;
      } else {
        vel.current = { x: 0, y: 0 };
      }
    }

    if (idle > 3000) autoRotate.current = true;

    if (autoRotate.current && Math.abs(vel.current.y) < 0.0002) {
      groupRef.current.rotation.x *= 0.982; // gently return to face-on
      groupRef.current.rotation.y += delta * 0.22;
    }

    groupRef.current.position.y = Math.sin(clock.elapsedTime * 0.8) * 0.020;
  });

  return (
    <group ref={groupRef} scale={scale}>
      <StarBlades />
      <CrystalCore />
    </group>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────
// Fills 100% of parent container — size is controlled by .star-container in CSS.
// touch-action: none on the wrapper prevents browser scroll from hijacking drag.
export default function NinjaStar({ scale = 0.70 }: { scale?: number }) {
  return (
    <div style={{ width: "100%", height: "100%", touchAction: "none" }}>
      <Canvas
        camera={{ position: [0, 0, 4], fov: 44 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        dpr={[1, 1.5]}
        style={{ width: "100%", height: "100%", touchAction: "none" }}
      >
        <Environment />
        <SceneLights />
        <CompassStar scale={scale} />
      </Canvas>
    </div>
  );
}
