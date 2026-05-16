"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ThreeStarScene({ size = 340 }: { size?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    starGroup: THREE.Group;
    clock: THREE.Clock;
    animId: number;
  } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 3.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(size, size);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2);
    keyLight.position.set(2, 3, 4);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x9d4edd, 0.8);
    fillLight.position.set(-2, -1, 2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xc77dff, 1.5);
    rimLight.position.set(0, -2, -3);
    scene.add(rimLight);

    // Star group
    const starGroup = new THREE.Group();
    scene.add(starGroup);

    // Star material — WHITE with purple glow
    const starMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x9d4edd,
      emissiveIntensity: 1.2,
      metalness: 0.5,
      roughness: 0.1,
    });

    // 4 STRAIGHT POINTS — N/S/E/W
    const pointGeometry = new THREE.BoxGeometry(0.12, 1.0, 0.12);

    // North
    const northPoint = new THREE.Mesh(pointGeometry, starMaterial);
    northPoint.position.y = 1.0;
    northPoint.castShadow = true;
    starGroup.add(northPoint);

    // South
    const southPoint = new THREE.Mesh(pointGeometry, starMaterial);
    southPoint.position.y = -1.0;
    southPoint.castShadow = true;
    starGroup.add(southPoint);

    // East
    const eastPoint = new THREE.Mesh(pointGeometry, starMaterial);
    eastPoint.position.x = 1.0;
    eastPoint.rotation.z = Math.PI / 2;
    eastPoint.castShadow = true;
    starGroup.add(eastPoint);

    // West
    const westPoint = new THREE.Mesh(pointGeometry, starMaterial);
    westPoint.position.x = -1.0;
    westPoint.rotation.z = Math.PI / 2;
    westPoint.castShadow = true;
    starGroup.add(westPoint);

    // Center diamond (sharp crossing)
    const centerGeometry = new THREE.OctahedronGeometry(0.25);
    const centerMesh = new THREE.Mesh(centerGeometry, starMaterial);
    centerMesh.scale.set(1, 1, 0.5);
    centerMesh.castShadow = true;
    starGroup.add(centerMesh);

    // Subtle glow sphere behind
    const glowGeo = new THREE.SphereGeometry(0.8, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x9d4edd,
      transparent: true,
      opacity: 0.08,
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    starGroup.add(glowMesh);

    const clock = new THREE.Clock();

    // Drag interaction
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let velocityY = 0;
    let velocityX = 0;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouseX;
      const dy = e.clientY - prevMouseY;
      starGroup.rotation.y += dx * 0.01;
      starGroup.rotation.x += dy * 0.005;
      velocityY = dx * 0.01;
      velocityX = dy * 0.005;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    // Float animation
    const floatAmplitude = 0.02;
    const floatSpeed = 2;

    // Animation loop
    const animate = () => {
      const elapsed = clock.getElapsedTime();

      if (!isDragging) {
        starGroup.rotation.y += 0.003;
        velocityY *= 0.95;
        velocityX *= 0.95;
        starGroup.rotation.y += velocityY;
        starGroup.rotation.x += velocityX;
        // Clamp vertical rotation
        starGroup.rotation.x = Math.max(
          -0.5,
          Math.min(0.5, starGroup.rotation.x),
        );
      }

      // Float
      starGroup.position.y = Math.sin(elapsed * floatSpeed) * floatAmplitude;

      renderer.render(scene, camera);
      sceneRef.current!.animId = requestAnimationFrame(animate);
    };
    sceneRef.current = {
      scene,
      camera,
      renderer,
      starGroup,
      clock,
      animId: requestAnimationFrame(animate),
    };

    return () => {
      cancelAnimationFrame(sceneRef.current!.animId);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [size]);

  return (
    <div
      ref={containerRef}
      style={{
        width: size,
        height: size,
      }}
    />
  );
}
