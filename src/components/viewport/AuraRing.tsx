import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { type Aura, type Vector3 } from '../../stores/combatStore';

interface AuraRingProps {
  aura: Aura;
  position: Vector3;
}

/**
 * AuraRing - 3D visual representation of an active aura effect
 * Renders as a semi-transparent ring/cylinder centered on the owner
 */
export const AuraRing: React.FC<AuraRingProps> = ({ aura, position }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Convert feet to grid units (5 feet = 1 grid square)
  const radiusUnits = aura.radius / 5;
  
  // Determine ring color
  const color = useMemo(() => {
    if (aura.color) return aura.color;
    if (aura.affectsEnemies) return '#ff4444'; // Red for damage auras
    if (aura.affectsAllies) return '#4488ff';  // Blue for buff auras
    return '#ffcc44'; // Gold for neutral
  }, [aura]);
  
  // Subtle pulse animation
  useFrame((state) => {
    if (meshRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.05 + 1;
      meshRef.current.scale.set(pulse, 1, pulse);
    }
  });
  
  // Create ring geometry (thin cylinder)
  const ringGeometry = useMemo(() => {
    // Use torus for ring effect
    return new THREE.TorusGeometry(radiusUnits, 0.05, 8, 64);
  }, [radiusUnits]);
  
  // Create fill geometry (flat cylinder for area indication)
  const fillGeometry = useMemo(() => {
    return new THREE.CylinderGeometry(radiusUnits, radiusUnits, 0.02, 64);
  }, [radiusUnits]);
  
  return (
    <group position={[position.x, 0.1, position.z]}>
      {/* Semi-transparent fill showing the area */}
      <mesh geometry={fillGeometry}>
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={0.15}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      
      {/* Outer ring edge */}
      <mesh ref={meshRef} geometry={ringGeometry} rotation={[Math.PI / 2, 0, 0]}>
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Concentration indicator - small pulsing dot if requires concentration */}
      {aura.requiresConcentration && (
        <mesh position={[0, 0.3, 0]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshBasicMaterial 
            color="#ffffff" 
            transparent 
            opacity={0.8}
          />
        </mesh>
      )}
    </group>
  );
};
