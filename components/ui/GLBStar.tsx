"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three-stdlib";
import { EffectComposer } from "three-stdlib";
import { RenderPass } from "three-stdlib";
import { UnrealBloomPass } from "three-stdlib";

interface GLBStarProps {
  modelPath: string;
}

export default function GLBStar({ modelPath }: GLBStarProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0015);

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 3;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // Bloom
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(
      new UnrealBloomPass(new THREE.Vector2(width, height), 1.2, 0.5, 0.1),
    );

    // Lights
    const light1 = new THREE.DirectionalLight(0xffffff, 0.8);
    light1.position.set(5, 5, 5);
    scene.add(light1);
    const light2 = new THREE.DirectionalLight(0x9d4edd, 0.3);
    light2.position.set(-5, -5, 3);
    scene.add(light2);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    // Load GLB
    const loader = new GLTFLoader();
    let starGroup: THREE.Group | null = null;

    loader.load(
      modelPath,
      (gltf) => {
        starGroup = gltf.scene as THREE.Group;
        starGroup.scale.set(1.2, 1.2, 1.2);
        scene.add(starGroup);
      },
      undefined,
      (error) => console.error("Failed to load 3D model:", error),
    );

    // Drag state (refs to avoid stale closures)
    const drag = { active: false, prevX: 0, prevY: 0, velocity: 0 };
    let rotation = 0;

    const onPointerDown = (e: PointerEvent) => {
      drag.active = true;
      drag.prevX = e.clientX;
      drag.prevY = e.clientY;
      drag.velocity = 0;
      renderer.domElement.setPointerCapture(e.pointerId);
      renderer.domElement.style.cursor = "grabbing";
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!drag.active) return;
      const dx = e.clientX - drag.prevX;
      const dy = e.clientY - drag.prevY;
      rotation += dx * 0.005;
      drag.velocity = dx * 0.005;
      drag.prevX = e.clientX;
      drag.prevY = e.clientY;
    };

    const onPointerUp = () => {
      drag.active = false;
      renderer.domElement.style.cursor = "grab";
    };

    renderer.domElement.style.cursor = "grab";
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointerleave", onPointerUp);

    // Resize
    const onResize = () => {
      const w = container.clientWidth || width;
      const h = container.clientHeight || height;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    // Animation loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (starGroup) {
        if (!drag.active) {
          rotation += 0.003;
          if (Math.abs(drag.velocity) > 0.001) {
            rotation += drag.velocity;
            drag.velocity *= 0.96;
          }
        }
        starGroup.rotation.z = rotation;
        starGroup.position.y = Math.sin(Date.now() * 0.0005) * 0.1;
      }
      composer.render();
    };
    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointerleave", onPointerUp);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [modelPath]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}
