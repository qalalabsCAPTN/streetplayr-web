"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

function BladeGeometry() {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    // 8 wide-diamond blades — broad shoulders for a luxury sci-fi compass look
    const pts: [number, number][] = [
      [0, 1.0],
      [0.3, 0.4],
      [0.04, 0.04],
      [0.4, 0.3],
      [1.0, 0],
      [0.4, -0.3],
      [0.04, -0.04],
      [0.3, -0.4],
      [0, -1.0],
      [-0.3, -0.4],
      [-0.04, -0.04],
      [-0.4, -0.3],
      [-1.0, 0],
      [-0.4, 0.3],
      [-0.04, 0.04],
      [-0.3, 0.4],
    ];
    s.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
    s.closePath();
    return s;
  }, []);

  const settings = {
    depth: 0.025,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.004,
    bevelSegments: 6,
  };

  return (
    <>
      <mesh>
        <extrudeGeometry args={[shape, settings]} />
        <meshPhysicalMaterial
          color="#ffffff"
          metalness={1}
          roughness={0.08}
          clearcoat={1}
          clearcoatRoughness={0.03}
          envMapIntensity={1.5}
        />
      </mesh>
      <mesh rotation={[Math.PI, 0, 0]}>
        <extrudeGeometry args={[shape, settings]} />
        <meshPhysicalMaterial
          color="#ffffff"
          metalness={0.95}
          roughness={0.1}
          clearcoat={0.8}
          clearcoatRoughness={0.05}
          envMapIntensity={1.2}
        />
      </mesh>
    </>
  );
}

function CenterHub() {
  return (
    <mesh position={[0, 0, 0.02]}>
      <cylinderGeometry args={[0.05, 0.05, 0.012, 6]} />
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
    <mesh ref={meshRef} position={[0, 0, 0.04]}>
      <octahedronGeometry args={[0.028, 0]} />
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
      <ambientLight intensity={0.3} />
      <directionalLight position={[3, 5, 5]} intensity={1.5} />
      <directionalLight position={[-3, -2, 3]} intensity={0.5} color="#b8a1ff" />
      <pointLight position={[0, -4, -5]} intensity={0.6} color="#b8a1ff" />
    </>
  );
}

function NinjaStarModel() {
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
    groupRef.current.rotation.y += delta * 0.3;
    const tx = mouseRef.current.y * 0.02;
    groupRef.current.rotation.x += (tx - groupRef.current.rotation.x) * delta * 0.4;
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.2) * 0.04;
  });

  return (
    <group ref={groupRef}>
      <BladeGeometry />
      <CenterHub />
      <CenterCrystal />
    </group>
  );
}

export default function NinjaStar({ size = 340 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size }}>
      <Canvas
        camera={{ position: [0, 0, 4], fov: 45 }}
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
        <NinjaStarModel />
      </Canvas>
    </div>
  );
}
