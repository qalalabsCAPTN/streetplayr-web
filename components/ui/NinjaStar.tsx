"use client";

import { useRef, useEffect, useState, Suspense, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Environment as DreiEnvironment } from "@react-three/drei";
import * as THREE from "three";
import React from "react";

// ─── Preset Configurations ───────────────────────────────────────────────────
// Easily toggle between presets. To revert to the previous look,
// simply change ACTIVE_PRESET to 'PURPLE_GLASS' or 'CHROME_PREVIOUS'.
type PresetName = 'CHROME' | 'PURPLE_GLASS' | 'CHROME_PREVIOUS';
const ACTIVE_PRESET: PresetName = 'PURPLE_GLASS';

const PRESETS = {
  PURPLE_GLASS: {
    // Star body
    starColor: "#f3eaff",
    starRoughness: 0.06,
    starMetalness: 1.0,
    starEnvMapIntensity: 5.0,
    starEmissive: "#0d041a",
    starEmissiveIntensity: 0.2,
    starIridescence: 0.65,
    starIridescenceIOR: 1.7,
    starIridescenceThicknessRange: [100, 320] as [number, number],
    starUseMap: true,
    
    // Lights
    ambientLightColor: "#442288",
    ambientLightIntensity: 0.45,
    keyLightColor: "#ffffff",
    keyLightIntensity: 6.0,
    purpleLightColor: "#bf55ff",
    purpleLightIntensity: 8.0,
    cyanLightColor: "#33bbff",
    cyanLightIntensity: 5.0,
    frontPointLightColor: "#dfa0ff",
    frontPointLightIntensity: 4.0,
    
    // Core (Diamond)
    coreColor: "#bf55ff",
    coreEmissive: "#7b2cbf",
    coreEmissiveIntensityMin: 0.5,
    coreEmissiveIntensityMax: 0.9,
    corePointLightColor: "#bf55ff",
    corePointLightIntensityMin: 0.6,
    corePointLightIntensityMax: 1.0,
    corePointLightDistance: 1.5,
    corePointLightDecay: 2.0,
    corePointLightZ: 0.04,
    coreHaloColor: "#9d4edd",
    coreHaloOpacity: 0.35,
    flareColor: "#d1b3ff",
    flareOpacity: 0.5,
    flareLength: 0.26,
    centerGlowColor: "#dfbfff",
    centerGlowOpacity: 0.7,
    envPreset: "city" as const,
  },
  CHROME_PREVIOUS: {
    // Star body - Pure silver-chrome base
    starColor: "#ffffff",
    starRoughness: 0.02,
    starMetalness: 1.0,
    starEnvMapIntensity: 9.0,
    starEmissive: "#000000",
    starEmissiveIntensity: 0.0,
    starIridescence: 0.0,
    starIridescenceIOR: 1.5,
    starIridescenceThicknessRange: [100, 300] as [number, number],
    starUseMap: false,
    
    // Lights
    ambientLightColor: "#05050a",
    ambientLightIntensity: 0.15,
    keyLightColor: "#ffffff",
    keyLightIntensity: 8.0,
    purpleLightColor: "#c084fc",
    purpleLightIntensity: 1.2,
    cyanLightColor: "#ffffff",
    cyanLightIntensity: 3.0,
    frontPointLightColor: "#d8b4fe",
    frontPointLightIntensity: 1.0,
    
    // Core (Diamond)
    coreColor: "#c084fc",
    coreEmissive: "#a855f7",
    coreEmissiveIntensityMin: 2.0,
    coreEmissiveIntensityMax: 3.5,
    corePointLightColor: "#bf55ff",
    corePointLightIntensityMin: 40.0,
    corePointLightIntensityMax: 55.0,
    corePointLightDistance: 2.5,
    corePointLightDecay: 1.1,
    corePointLightZ: 0.12,
    coreHaloColor: "#a855f7",
    coreHaloOpacity: 0.65,
    flareColor: "#e9d5ff",
    flareOpacity: 1.0,
    flareLength: 0.65,
    centerGlowColor: "#ffffff",
    centerGlowOpacity: 1.0,
    envPreset: "city" as const,
  },
  CHROME: {
    // Star body - Pure silver-chrome base matching the reference image
    starColor: "#ffffff",
    starRoughness: 0.05, // polished chrome with smooth gradient reflections
    starMetalness: 1.0,
    starEnvMapIntensity: 7.5, // strong environment reflection for realistic chrome look
    starEmissive: "#000000",
    starEmissiveIntensity: 0.0,
    starIridescence: 0.0,
    starIridescenceIOR: 1.5,
    starIridescenceThicknessRange: [100, 300] as [number, number],
    starUseMap: false,
    
    // Lights - Clean studio lighting to keep chrome silver/white, avoiding tinting outer facets purple
    ambientLightColor: "#030308", // very dark background ambient
    ambientLightIntensity: 0.15,
    keyLightColor: "#ffffff", // bright white key
    keyLightIntensity: 9.0,
    purpleLightColor: "#bf55ff", // rich purple rim light
    purpleLightIntensity: 0.8,
    cyanLightColor: "#ffffff", // clean white fill
    cyanLightIntensity: 3.0,
    frontPointLightColor: "#ffffff", // pure white front fill to keep outer blades clean chrome
    frontPointLightIntensity: 1.2,
    
    // Core (Diamond) - Bright glowing amethyst core
    coreColor: "#bf55ff", // saturated purple gemstone core
    coreEmissive: "#a855f7", // vivid purple emissive
    coreEmissiveIntensityMin: 2.5, // strong glow
    coreEmissiveIntensityMax: 4.0,
    corePointLightColor: "#bf55ff", // saturated purple glow bleeding onto blades
    corePointLightIntensityMin: 18.0, // adjusted for closer Z position
    corePointLightIntensityMax: 26.0,
    corePointLightDistance: 1.2, // limit distance so the purple doesn't reach blade tips
    corePointLightDecay: 1.8, // standard physics decay to concentrate glow near center
    corePointLightZ: 0.04, // placed closer/inside the star to light up inner bevels/crevices
    coreHaloColor: "#a855f7",
    coreHaloOpacity: 0.7,
    flareColor: "#f3eaff", // bright off-white flare
    flareOpacity: 0.95,
    flareLength: 0.60, // needle-like lens flare
    centerGlowColor: "#ffffff", // bright white center flare star
    centerGlowOpacity: 1.0,
    envPreset: "studio" as const, // studio environment for clean black and white softbox reflections
  }
};

const current = PRESETS[ACTIVE_PRESET];

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

const vGeo = buildBladeGeo(2.28, 0.48, 0.52); // vertical (top/bottom) — length 2.28m, maxW 0.48m, maxT 0.52m
const hGeo = buildBladeGeo(2.14, 0.44, 0.52); // horizontal (left/right) — length 2.14m, maxW 0.44m, maxT 0.52m

// CHROME material constants are now driven dynamically by the ACTIVE_PRESET configuration.

// ─── GLB Star Loader with Fallback ──────────────────────────────────────────
class GLBErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.warn("Failed to load GLB model, falling back to procedural geometry:", error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function GLBStar() {
  const { scene } = useGLTF("/models/3-d Star.glb");

  const clonedScene = useMemo(() => {
    const clone = scene.clone();
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const originalMaterial = child.material as THREE.MeshStandardMaterial;
        const originalMap = originalMaterial?.map || null;
        const originalNormalMap = originalMaterial?.normalMap || null;
        const originalNormalScale = originalMaterial?.normalScale || new THREE.Vector2(1, 1);

        // Apply our premium chrome material with iridescence for streaks, retaining the original map texture!
        child.material = new THREE.MeshPhysicalMaterial({
          map: current.starUseMap ? originalMap : null,
          normalMap: originalNormalMap,
          normalScale: originalNormalScale,
          color: current.starColor,
          metalness: current.starMetalness,
          roughness: current.starRoughness,
          clearcoat: 1.0,
          clearcoatRoughness: current.starRoughness === 0.04 ? 0.01 : 0.02,
          envMapIntensity: current.starEnvMapIntensity,
          emissive: current.starEmissive,
          emissiveIntensity: current.starEmissiveIntensity,
          iridescence: current.starIridescence,
          iridescenceIOR: current.starIridescenceIOR,
          iridescenceThicknessRange: current.starIridescenceThicknessRange,
        });
      }
    });
    return clone;
  }, [scene]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).glbScene = clonedScene;
    }
  }, [clonedScene]);

  return <primitive object={clonedScene} />;
}

function StarBody() {
  return (
    <GLBErrorBoundary fallback={<StarBlades />}>
      <Suspense fallback={<StarBlades />}>
        <GLBStar />
      </Suspense>
    </GLBErrorBoundary>
  );
}

// ─── Blades ───────────────────────────────────────────────────────────────────
function StarBlades() {
  return (
    <group>
      <mesh geometry={vGeo} rotation={[0, 0, 0]}>
        <meshPhysicalMaterial
          color={current.starColor}
          metalness={current.starMetalness}
          roughness={current.starRoughness}
          clearcoat={1.0}
          clearcoatRoughness={current.starRoughness === 0.04 ? 0.01 : 0.02}
          envMapIntensity={current.starEnvMapIntensity}
          emissive={current.starEmissive}
          emissiveIntensity={current.starEmissiveIntensity}
          iridescence={current.starIridescence}
          iridescenceIOR={current.starIridescenceIOR}
          iridescenceThicknessRange={current.starIridescenceThicknessRange}
        />
      </mesh>
      <mesh geometry={vGeo} rotation={[0, 0, Math.PI]}>
        <meshPhysicalMaterial
          color={current.starColor}
          metalness={current.starMetalness}
          roughness={current.starRoughness}
          clearcoat={1.0}
          clearcoatRoughness={current.starRoughness === 0.04 ? 0.01 : 0.02}
          envMapIntensity={current.starEnvMapIntensity}
          emissive={current.starEmissive}
          emissiveIntensity={current.starEmissiveIntensity}
          iridescence={current.starIridescence}
          iridescenceIOR={current.starIridescenceIOR}
          iridescenceThicknessRange={current.starIridescenceThicknessRange}
        />
      </mesh>
      <mesh geometry={hGeo} rotation={[0, 0, -Math.PI / 2]}>
        <meshPhysicalMaterial
          color={current.starColor}
          metalness={current.starMetalness}
          roughness={current.starRoughness}
          clearcoat={1.0}
          clearcoatRoughness={current.starRoughness === 0.04 ? 0.01 : 0.02}
          envMapIntensity={current.starEnvMapIntensity}
          emissive={current.starEmissive}
          emissiveIntensity={current.starEmissiveIntensity}
          iridescence={current.starIridescence}
          iridescenceIOR={current.starIridescenceIOR}
          iridescenceThicknessRange={current.starIridescenceThicknessRange}
        />
      </mesh>
      <mesh geometry={hGeo} rotation={[0, 0,  Math.PI / 2]}>
        <meshPhysicalMaterial
          color={current.starColor}
          metalness={current.starMetalness}
          roughness={current.starRoughness}
          clearcoat={1.0}
          clearcoatRoughness={current.starRoughness === 0.04 ? 0.01 : 0.02}
          envMapIntensity={current.starEnvMapIntensity}
          emissive={current.starEmissive}
          emissiveIntensity={current.starEmissiveIntensity}
          iridescence={current.starIridescence}
          iridescenceIOR={current.starIridescenceIOR}
          iridescenceThicknessRange={current.starIridescenceThicknessRange}
        />
      </mesh>
    </group>
  );
}

const FlareMaterial = ({ color = "#f0d5ff", opacity = 0.9 }) => {
  const uniforms = useMemo(() => ({
    color: { value: new THREE.Color(color) },
    opacity: { value: opacity }
  }), [color, opacity]);

  return (
    <shaderMaterial
      vertexShader={`
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `}
      fragmentShader={`
        varying vec2 vUv;
        uniform vec3 color;
        uniform float opacity;
        void main() {
          // Fade out from the center along the X axis
          float dist = abs(vUv.x - 0.5) * 2.0; // 0.0 in middle, 1.0 at ends
          float alpha = 1.0 - smoothstep(0.0, 1.0, dist);
          
          // Add a subtle fade on the edges of the line width too
          float widthFade = 1.0 - smoothstep(0.0, 1.0, abs(vUv.y - 0.5) * 2.0);
          
          gl_FragColor = vec4(color, alpha * widthFade * opacity);
        }
      `}
      uniforms={uniforms}
      transparent
      depthWrite={false}
      blending={THREE.AdditiveBlending}
    />
  );
};

const GlowCircleMaterial = ({ color = "#ffffff", opacity = 0.9 }) => {
  const uniforms = useMemo(() => ({
    color: { value: new THREE.Color(color) },
    opacity: { value: opacity }
  }), [color, opacity]);

  return (
    <shaderMaterial
      vertexShader={`
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `}
      fragmentShader={`
        varying vec2 vUv;
        uniform vec3 color;
        uniform float opacity;
        void main() {
          // Circular fade out from the center (0.5, 0.5)
          float dist = distance(vUv, vec2(0.5));
          float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
          gl_FragColor = vec4(color, alpha * opacity);
        }
      `}
      uniforms={uniforms}
      transparent
      depthWrite={false}
      blending={THREE.AdditiveBlending}
    />
  );
};

// ─── Center element: Flat diamond/rhombus with subtle glow ──────────────────
function FlatDiamondCore() {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const pulse = Math.sin(t * 1.5) * 0.15 + 0.85; // 0.7 → 1.0 (subtle pulse)

    if (meshRef.current) {
      const m = meshRef.current.material as THREE.MeshPhysicalMaterial;
      m.emissiveIntensity = current.coreEmissiveIntensityMin + pulse * (current.coreEmissiveIntensityMax - current.coreEmissiveIntensityMin);
    }
    if (glowRef.current) {
      glowRef.current.intensity = current.corePointLightIntensityMin + pulse * (current.corePointLightIntensityMax - current.corePointLightIntensityMin);
    }
  });

  // Small sleek flat diamond shape (rhombus)
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0.095);      // top tip (slightly smaller for premium look)
    s.lineTo(0.065, 0);     // right corner
    s.lineTo(0, -0.095);     // bottom tip
    s.lineTo(-0.065, 0);    // left corner
    s.closePath();
    return s;
  }, []);

  const extrudeSettings = {
    depth: 0.005,           // very flat
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.002,
    bevelThickness: 0.002,
  };

  // Dynamically scale Z positions of the core assembly
  const coreZ = current.corePointLightZ;
  const haloZ = coreZ - 0.005;
  const diamondZ = coreZ - 0.02;
  const flareZ = coreZ - 0.015;
  const glowZ = coreZ - 0.014;

  return (
    <>
      {/* Subtle purple point light behind the diamond */}
      <pointLight
        ref={glowRef}
        color={current.corePointLightColor}
        intensity={current.corePointLightIntensityMin}
        distance={current.corePointLightDistance}
        decay={current.corePointLightDecay}
        position={[0, 0, coreZ]}
      />

      {/* Subtle soft glowing back-plane halo */}
      <mesh position={[0, 0, haloZ]}>
        <planeGeometry args={[0.22, 0.22]} />
        <GlowCircleMaterial color={current.coreHaloColor} opacity={current.coreHaloOpacity} />
      </mesh>

      {/* Flat beveled diamond core - upgraded to high-end purple gemstone glass */}
      <mesh ref={meshRef} position={[0, 0, diamondZ]}>
        <extrudeGeometry args={[shape, extrudeSettings]} />
        <meshPhysicalMaterial
          color={current.coreColor} // Elegant deep purple
          emissive={current.coreEmissive} // Rich purple glow
          emissiveIntensity={current.coreEmissiveIntensityMin}
          metalness={0.1} // Low metalness for glass-like behavior
          roughness={0.02} // High gloss
          transmission={0.9} // Glass-like transmission
          thickness={0.05} // Glass thickness
          ior={1.7} // Amethyst / Diamond index of refraction
          clearcoat={1.0}
          clearcoatRoughness={0.01}
          envMapIntensity={3.0}
        />
      </mesh>

      {/* Horizontal flare line (much thinner, needle-like and subtle) */}
      <mesh position={[0, 0, flareZ]} rotation={[0, 0, 0]}>
        <planeGeometry args={[current.flareLength, 0.003]} />
        <FlareMaterial color={current.flareColor} opacity={current.flareOpacity} />
      </mesh>

      {/* Vertical flare line (much thinner, needle-like and subtle) */}
      <mesh position={[0, 0, flareZ]} rotation={[0, 0, Math.PI / 2]}>
        <planeGeometry args={[current.flareLength, 0.003]} />
        <FlareMaterial color={current.flareColor} opacity={current.flareOpacity} />
      </mesh>

      {/* Central soft glow point (smaller and purple-tinted to avoid washing out) */}
      <mesh position={[0, 0, glowZ]}>
        <planeGeometry args={[0.02, 0.02]} />
        <GlowCircleMaterial color={current.centerGlowColor} opacity={current.centerGlowOpacity} />
      </mesh>
    </>
  );
}

// Custom environment function removed in favor of Drei's photorealistic Environment component.

// ─── Scene lights ─────────────────────────────────────────────────────────────
function SceneLights() {
  return (
    <>
      {/* Ambient just enough to reveal blade shape in shadows */}
      <ambientLight intensity={current.ambientLightIntensity} color={current.ambientLightColor} />

      {/* Main white key light for sharp reflections */}
      <directionalLight position={[ 2,  5,  3]} intensity={current.keyLightIntensity}  color={current.keyLightColor} />

      {/* Cyberpunk neon purple light hitting the front-left edges */}
      <directionalLight position={[-3,  1,  2]} intensity={current.purpleLightIntensity}  color={current.purpleLightColor} />

      {/* Subtle deep blue/cyan rim light hitting the right edges */}
      <directionalLight position={[ 3, -1, -2]} intensity={current.cyanLightIntensity}  color={current.cyanLightColor} />

      {/* Bright front point light for highlight pops */}
      <pointLight position={[0, 0, 3]} intensity={current.frontPointLightIntensity} color={current.frontPointLightColor} distance={8} />
    </>
  );
}

// ─── Full 3-D trackball ───────────────────────────────────────────────────────
function CompassStar({ scale = 0.70, scrollReactive = true }: { scale?: number; scrollReactive?: boolean }) {
  const { gl } = useThree();
  const groupRef     = useRef<THREE.Group>(null);
  const scrollRef    = useRef<THREE.Group>(null);
  const dragging     = useRef(false);
  const lastPos      = useRef({ x: 0, y: 0 });
  const vel          = useRef({ x: 0, y: 0 });
  const lastMoveTime = useRef(0);
  const autoRotate   = useRef(true);
  // Interaction gate — cursor parallax only runs while the pointer is
  // actually inside the star region. Idle on load, lerps back on leave.
  const interactive  = useRef(false);

  useEffect(() => {
    const canvas = gl.domElement;
    if (!canvas) return;

    // Allow vertical scrolling (pan-y) to prevent scroll traps on mobile
    canvas.style.touchAction = "pan-y";

    const onEnter = () => { interactive.current = true; };
    const onLeave = () => { interactive.current = false; };

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

    canvas.addEventListener("pointerenter",  onEnter);
    canvas.addEventListener("pointerleave",  onLeave);
    canvas.addEventListener("pointerdown",  onDown, { passive: false });
    canvas.addEventListener("pointermove",  onMove, { passive: false });
    canvas.addEventListener("pointerup",    onUp);
    canvas.addEventListener("pointercancel", onUp);

    return () => {
      canvas.removeEventListener("pointerenter",  onEnter);
      canvas.removeEventListener("pointerleave",  onLeave);
      canvas.removeEventListener("pointerdown",  onDown);
      canvas.removeEventListener("pointermove",  onMove);
      canvas.removeEventListener("pointerup",    onUp);
      canvas.removeEventListener("pointercancel", onUp);
    };
  }, [gl]);

  useFrame(({ clock, pointer }, delta) => {
    if (!groupRef.current || dragging.current) return;

    const now = Date.now();
    const idle = now - lastMoveTime.current;

    // Drag inertia deceleration physics
    if (Math.abs(vel.current.x) > 0.0001 || Math.abs(vel.current.y) > 0.0001) {
      if (idle < 1200) {
        groupRef.current.rotation.x += vel.current.x;
        groupRef.current.rotation.y += vel.current.y;
        vel.current.x *= 0.92;
        vel.current.y *= 0.92;
      } else {
        vel.current.x = 0;
        vel.current.y = 0;
      }
    }

    if (idle > 3000) autoRotate.current = true;

    if (autoRotate.current && Math.abs(vel.current.y) < 0.0002) {
      // Cursor parallax only while the pointer is inside the star; otherwise
      // the target is neutral so the star smoothly lerps back to rest (idle).
      const targetX = interactive.current ? pointer.y * 0.28 : 0; // Tilt up/down
      const targetZ = interactive.current ? -pointer.x * 0.15 : 0; // Tilt left/right

      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetX, 0.05);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, targetZ, 0.05);

      // Continuous gentle auto-spin
      groupRef.current.rotation.y += delta * 0.22;
    }

    // Hover bobbing animation
    groupRef.current.position.y = Math.sin(clock.elapsedTime * 0.8) * 0.020;

    // Scroll-driven 3D rotation, tilt, and depth translation
    if (scrollReactive && scrollRef.current && typeof window !== "undefined") {
      const scrollY = (window as any).__scrollDampingY !== undefined ? (window as any).__scrollDampingY : window.scrollY;

      const targetScrollRotY = scrollY * 0.0015;
      const targetScrollRotX = scrollY * 0.0008;
      const targetScrollZ = -Math.min(scrollY * 0.002, 1.8); // Recede back in depth (Z axis)

      const sr = scrollRef.current;
      // Skip the lerp + matrix update once the values have settled onto their
      // targets — avoids redundant transform work when nothing is scrolling.
      if (
        Math.abs(sr.rotation.y - targetScrollRotY) > 1e-5 ||
        Math.abs(sr.rotation.x - targetScrollRotX) > 1e-5 ||
        Math.abs(sr.position.z - targetScrollZ) > 1e-5
      ) {
        sr.rotation.y = THREE.MathUtils.lerp(sr.rotation.y, targetScrollRotY, 0.08);
        sr.rotation.x = THREE.MathUtils.lerp(sr.rotation.x, targetScrollRotX, 0.08);
        sr.position.z = THREE.MathUtils.lerp(sr.position.z, targetScrollZ, 0.08);
      }
    }
  });

  return (
    <group ref={groupRef} scale={scale}>
      <group ref={scrollRef}>
        <StarBody />
        <FlatDiamondCore />
      </group>
    </group>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────
// Fills 100% of parent container — size is controlled by .star-container in CSS.
// touch-action: pan-y on the wrapper and Canvas allows page scrolling on mobile swipe.
export default function NinjaStar({ scale = 0.70, scrollReactive = true }: { scale?: number; scrollReactive?: boolean }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  // Pause the render loop entirely while the star is scrolled out of view.
  // Invisible to the user, but reclaims all GPU/CPU spent re-rendering the
  // expensive physical material + HDR environment off-screen.
  const [onScreen, setOnScreen] = useState(true);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setOnScreen(entry.isIntersecting),
      { rootMargin: "150px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrapRef} style={{ width: "100%", height: "100%", touchAction: "pan-y" }}>
      <Canvas
        frameloop={onScreen ? "always" : "never"}
        camera={{ position: [0, 0, 4], fov: 44 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        dpr={[1, 1.5]}
        style={{ width: "100%", height: "100%", touchAction: "pan-y" }}
      >
        <Suspense fallback={null}>
          <DreiEnvironment preset={current.envPreset} />
        </Suspense>
        <SceneLights />
        <CompassStar scale={scale} scrollReactive={scrollReactive} />
      </Canvas>
    </div>
  );
}
