"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

function StarGeometry() {
  const starShape = useMemo(() => {
    const shape = new THREE.Shape();
    const pts = 4;
    const outer = 1;
    const inner = 0.12;
    for (let i = 0; i < pts * 2; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const a = (i / (pts * 2)) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
    return shape;
  }, []);

  const settings = {
    depth: 0.05,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.012,
    bevelSegments: 16,
  };

  return (
    <>
      <mesh>
        <extrudeGeometry args={[starShape, settings]} />
        <meshPhysicalMaterial
          color="#ffffff"
          metalness={0.95}
          roughness={0.04}
          clearcoat={1}
          clearcoatRoughness={0.03}
          envMapIntensity={3}
          emissive="#b8a1ff"
          emissiveIntensity={0.06}
        />
      </mesh>
      <mesh rotation={[Math.PI, 0, 0]}>
        <extrudeGeometry args={[starShape, settings]} />
        <meshPhysicalMaterial
          color="#ffffff"
          metalness={0.9}
          roughness={0.08}
          clearcoat={0.8}
          clearcoatRoughness={0.05}
          envMapIntensity={2}
        />
      </mesh>
    </>
  );
}

function CenterHub() {
  return (
    <mesh position={[0, 0, 0.04]}>
      <cylinderGeometry args={[0.06, 0.06, 0.015, 6]} />
      <meshPhysicalMaterial
        color="#e0d8ee"
        metalness={0.9}
        roughness={0.15}
        clearcoat={0.5}
        envMapIntensity={1}
      />
    </mesh>
  );
}

function CenterCrystal() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y += delta * 0.4;
    const t = state.clock.elapsedTime;
    meshRef.current.rotation.x = Math.sin(t * 1.5) * 0.08;
    const mat = meshRef.current.material as THREE.MeshPhysicalMaterial;
    mat.emissiveIntensity = 1.8 + Math.sin(t * 2) * 0.3;
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0.06]}>
      <octahedronGeometry args={[0.032, 0]} />
      <meshPhysicalMaterial
        color="#d0bbff"
        emissive="#b8a1ff"
        emissiveIntensity={2.5}
        metalness={0.1}
        roughness={0.2}
      />
    </mesh>
  );
}

function StableEnvironment() {
  const { scene, gl } = useThree();

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0x1a1a2e);
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
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 5, 5]} intensity={2} />
      <directionalLight position={[-3, -2, 3]} intensity={0.6} color="#b8a1ff" />
      <pointLight position={[0, -4, -5]} intensity={0.8} color="#b8a1ff" />
    </>
  );
}

function ChromeStarModel() {
  const groupRef = useRef<THREE.Group>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMouse = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", onMouse);
    return () => window.removeEventListener("mousemove", onMouse);
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.35;
    const tx = mouseRef.current.y * 0.02;
    groupRef.current.rotation.x += (tx - groupRef.current.rotation.x) * delta * 0.4;
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.2) * 0.04;
  });

  return (
    <group ref={groupRef}>
      <StarGeometry />
      <CenterHub />
      <CenterCrystal />
    </group>
  );
}

export default function ChromeStar({ size = 340 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size }}>
      <Canvas
        camera={{ position: [0, 0, 2.8], fov: 40 }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        }}
        dpr={[1, 2]}
        style={{ width: "100%", height: "100%" }}
      >
        <StableEnvironment />
        <SceneLights />
        <ChromeStarModel />
      </Canvas>
    </div>
  );
}
