"use client";

import { Suspense, useRef, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";

/* ── Auto-scale + center the GLTF model ── */
function Model({ path }: { path: string }) {
  const { scene } = useGLTF(path);
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    const g = groupRef.current;
    if (!g) return;

    const box = new THREE.Box3().setFromObject(g);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = maxDim > 0 ? 2.4 / maxDim : 1;

    g.scale.setScalar(scale);

    // Re-center after scale
    box.setFromObject(g);
    const newCenter = box.getCenter(new THREE.Vector3());
    g.position.sub(newCenter);
  }, [scene]);

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}

/* ── Fit camera to scene on load ── */
function CameraRig() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 0.4, 4.5);
    camera.lookAt(0, 0, 0);
  }, [camera]);
  return null;
}

/* ── Studio lighting ── */
function StudioLights() {
  return (
    <>
      {/* Ambient fill */}
      <ambientLight intensity={0.35} />
      {/* Key light — upper front right */}
      <directionalLight position={[4, 6, 5]} intensity={1.6} />
      {/* Fill light — left with brand tint */}
      <directionalLight position={[-5, 3, 2]} intensity={0.5} color="#ddb7ff" />
      {/* Rim / backlight */}
      <directionalLight position={[0, -4, -6]} intensity={0.2} color="#ffffff" />
      {/* Ground bounce */}
      <hemisphereLight args={["#ffffff", "#111111", 0.3]} />
    </>
  );
}

interface ProductViewer3DProps {
  modelPath: string;
}

export default function ProductViewer3D({ modelPath }: ProductViewer3DProps) {
  return (
    <Canvas
      camera={{ position: [0, 0.4, 4.5], fov: 38 }}
      gl={{ antialias: true, alpha: false }}
      dpr={[1, 2]}
      shadows={false}
    >
      <color attach="background" args={["#050505"]} />

      <StudioLights />

      <Suspense fallback={null}>
        <Model path={modelPath} />
        <CameraRig />
      </Suspense>

      <OrbitControls
        enablePan={false}
        enableZoom={true}
        enableRotate={true}
        zoomSpeed={0.6}
        rotateSpeed={0.6}
        minDistance={1.5}
        maxDistance={12}
        minPolarAngle={Math.PI * 0.1}
        maxPolarAngle={Math.PI * 0.85}
        autoRotate
        autoRotateSpeed={0.8}
        makeDefault
      />
    </Canvas>
  );
}

/* Preload hint — call from parent on button hover (safe outside React tree) */
export function preload3DModel(path: string) {
  useGLTF.preload(path);  // useGLTF.preload is a static method, not a hook
}
