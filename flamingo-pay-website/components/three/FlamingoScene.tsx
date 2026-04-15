"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import {
  Float,
  MeshDistortMaterial,
  Sparkles,
  Environment,
  ContactShadows,
} from "@react-three/drei";
import { useRef, useMemo } from "react";
import type { Group, Mesh } from "three";
import { useReducedMotion } from "framer-motion";

/**
 * Low-poly, stylised flamingo made from primitives.
 * Light on CPU/GPU — no external models, no textures.
 *
 * Colours match the Flamingo Pink palette. If WebGL is unavailable
 * the hero falls back gracefully (we don't gate any content on the 3D scene).
 */

function StylisedFlamingo() {
  const group = useRef<Group>(null);
  const neck = useRef<Mesh>(null);
  const reduce = useReducedMotion();

  useFrame(({ clock, mouse }) => {
    const t = clock.getElapsedTime();
    if (group.current) {
      // Subtle idle bob + gentle mouse-tilt
      const bob = Math.sin(t * 1.1) * 0.12;
      group.current.position.y = 0.25 + bob;
      if (!reduce) {
        group.current.rotation.y = mouse.x * 0.35;
        group.current.rotation.x = mouse.y * 0.12;
      }
    }
    if (neck.current) {
      // Neck sway
      neck.current.rotation.z = Math.sin(t * 1.4) * 0.08;
    }
  });

  return (
    <group ref={group} position={[0, 0.25, 0]} rotation={[0, -0.2, 0]}>
      {/* Body — elongated sphere */}
      <mesh position={[0, 0.1, 0]} scale={[1.1, 0.85, 0.95]}>
        <sphereGeometry args={[0.9, 48, 48]} />
        <MeshDistortMaterial
          color="#FF5277"
          speed={1.2}
          distort={0.18}
          roughness={0.35}
          metalness={0.1}
        />
      </mesh>

      {/* Tail feathers — small sphere */}
      <mesh position={[-0.85, 0.15, 0]} scale={[0.55, 0.45, 0.55]}>
        <sphereGeometry args={[0.7, 24, 24]} />
        <meshStandardMaterial
          color="#FFB8C6"
          roughness={0.5}
          metalness={0.05}
        />
      </mesh>

      {/* Neck — a curved capsule via stretched cylinder */}
      <group ref={neck} position={[0.55, 0.75, 0]}>
        <mesh rotation={[0, 0, -0.5]} scale={[0.25, 1, 0.25]}>
          <cylinderGeometry args={[0.15, 0.2, 1.4, 24]} />
          <meshStandardMaterial color="#FF5277" roughness={0.45} />
        </mesh>
        {/* Head */}
        <mesh position={[0.48, 0.95, 0]}>
          <sphereGeometry args={[0.32, 32, 32]} />
          <meshStandardMaterial color="#FF5277" roughness={0.4} />
        </mesh>
        {/* Beak */}
        <mesh position={[0.82, 0.88, 0]} rotation={[0, 0, -0.4]}>
          <coneGeometry args={[0.1, 0.45, 24]} />
          <meshStandardMaterial color="#1A1A2E" roughness={0.3} />
        </mesh>
        {/* Eye */}
        <mesh position={[0.6, 1.05, 0.22]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial color="#fff" />
        </mesh>
        <mesh position={[0.63, 1.05, 0.26]}>
          <sphereGeometry args={[0.022, 16, 16]} />
          <meshStandardMaterial color="#1A1A2E" />
        </mesh>
      </group>

      {/* Legs — two thin cylinders */}
      <mesh position={[0.1, -0.75, 0.15]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 1, 12]} />
        <meshStandardMaterial color="#1A1A2E" />
      </mesh>
      <mesh position={[-0.1, -0.75, -0.15]}>
        <cylinderGeometry args={[0.04, 0.04, 1, 12]} />
        <meshStandardMaterial color="#1A1A2E" />
      </mesh>
    </group>
  );
}

/**
 * The Canvas wrapper. Set `compact` for smaller surfaces (e.g. merchant home).
 */
export function FlamingoScene({ compact = false }: { compact?: boolean }) {
  const camPos = useMemo<[number, number, number]>(
    () => (compact ? [0, 0.3, 4.2] : [0.4, 0.4, 3.6]),
    [compact],
  );

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: camPos, fov: 42 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ width: "100%", height: "100%", touchAction: "none" }}
    >
      <ambientLight intensity={0.45} />
      <directionalLight position={[3, 5, 2]} intensity={1.1} color="#FFE9B8" />
      <directionalLight position={[-3, 2, -2]} intensity={0.35} color="#BFE4FF" />
      <Float speed={1.6} rotationIntensity={0.3} floatIntensity={0.9}>
        <StylisedFlamingo />
      </Float>
      <Sparkles count={50} size={3} scale={[6, 3, 3]} color="#FF5277" speed={0.6} />
      <ContactShadows
        position={[0, -0.95, 0]}
        opacity={0.35}
        scale={6}
        blur={2.4}
        far={2}
        color="#B42A48"
      />
      <Environment preset="sunset" />
    </Canvas>
  );
}
