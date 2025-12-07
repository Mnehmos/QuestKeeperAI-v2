/**
 * ProceduralProps.tsx
 * Low-poly procedural environment props using Three.js primitives
 * 
 * Props include: cliffs, walls, bridges, trees, rocks, columns, stairs
 * All support negative Y for valleys/rivers below ground level.
 */
import React from 'react';
import { Edges } from '@react-three/drei';

// Prop types that can be generated
export type PropType = 
  | 'cliff'         // Stacked irregular boxes - tall vertical terrain
  | 'wall'          // Connected segments - dungeon/building walls
  | 'bridge'        // Plank + supports - spanning gaps
  | 'tree'          // Cone foliage + cylinder trunk
  | 'rock'          // Irregular polyhedron
  | 'column'        // Tall cylinder with capital
  | 'stairs'        // Stepped boxes
  | 'pit'           // Negative space (goes below ground)
  | 'water_pool'    // Recessed water area
  | 'boulder';      // Large round rock

interface ProceduralPropProps {
  propType: PropType;
  heightFeet?: number;  // Visual height (5ft = 1 grid unit)
  widthTiles?: number;  // Width in grid tiles
  depthTiles?: number;  // Depth in grid tiles
  color?: string;
  isSelected?: boolean;
  rotation?: number;    // Y-axis rotation in radians
}

// Convert feet to grid units (5ft = 1 tile = 1 unit)
const feetToUnits = (feet: number) => feet / 5;

/**
 * Cliff: Stacked irregular boxes creating rocky terrain
 */
const CliffProp: React.FC<{ height: number; width: number; depth: number; color: string; selected: boolean }> = 
  ({ height, width, depth, color, selected }) => {
  const layers = Math.max(2, Math.ceil(height / 0.8));
  
  return (
    <group>
      {Array.from({ length: layers }).map((_, i) => {
        const y = i * (height / layers);
        const layerScale = 1 - (i / layers) * 0.3; // Taper toward top
        const offset = { x: (Math.random() - 0.5) * 0.2, z: (Math.random() - 0.5) * 0.2 };
        
        return (
          <mesh 
            key={i} 
            position={[offset.x, y + (height / layers) / 2, offset.z]} 
            castShadow 
            receiveShadow
          >
            <boxGeometry args={[width * layerScale, height / layers, depth * layerScale]} />
            <meshStandardMaterial 
              color={color} 
              roughness={0.9} 
              metalness={0.1}
              emissive={selected ? color : '#000000'}
              emissiveIntensity={selected ? 0.2 : 0}
            />
            <Edges color="#1a1a1a" linewidth={1} />
          </mesh>
        );
      })}
    </group>
  );
};

/**
 * Wall: Stone/brick wall segment
 */
const WallProp: React.FC<{ height: number; width: number; depth: number; color: string; selected: boolean }> = 
  ({ height, width, depth, color, selected }) => {
  return (
    <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
      <boxGeometry args={[width, height, depth]} />
      <meshStandardMaterial 
        color={color} 
        roughness={0.85} 
        metalness={0.15}
        emissive={selected ? color : '#000000'}
        emissiveIntensity={selected ? 0.2 : 0}
      />
      <Edges color="#1a1a1a" linewidth={1.5} />
    </mesh>
  );
};

/**
 * Bridge: Plank spanning a gap with support posts
 */
const BridgeProp: React.FC<{ height: number; width: number; depth: number; color: string; selected: boolean }> = 
  ({ height, width, depth, selected }) => {
  const plankThickness = 0.15;
  
  return (
    <group>
      {/* Main plank */}
      <mesh position={[0, height, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, plankThickness, depth]} />
        <meshStandardMaterial 
          color="#5c4033" 
          roughness={0.9}
          emissive={selected ? '#5c4033' : '#000000'}
          emissiveIntensity={selected ? 0.2 : 0}
        />
        <Edges color="#2a1a0a" linewidth={1} />
      </mesh>
      
      {/* Support posts at ends */}
      {[-width / 2 + 0.1, width / 2 - 0.1].map((x, i) => (
        <mesh key={i} position={[x, height / 2, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.1, height, 6]} />
          <meshStandardMaterial color="#3a2a1a" roughness={0.95} />
        </mesh>
      ))}
      
      {/* Railings */}
      <mesh position={[0, height + 0.4, -depth / 2 + 0.05]} castShadow>
        <boxGeometry args={[width, 0.08, 0.08]} />
        <meshStandardMaterial color="#5c4033" roughness={0.9} />
      </mesh>
      <mesh position={[0, height + 0.4, depth / 2 - 0.05]} castShadow>
        <boxGeometry args={[width, 0.08, 0.08]} />
        <meshStandardMaterial color="#5c4033" roughness={0.9} />
      </mesh>
    </group>
  );
};

/**
 * Tree: Conical foliage on cylindrical trunk
 */
const TreeProp: React.FC<{ height: number; width: number; color: string; selected: boolean }> = 
  ({ height, width, color, selected }) => {
  const trunkHeight = height * 0.35;
  const foliageHeight = height * 0.65;
  const trunkRadius = width * 0.15;
  const foliageRadius = width * 0.45;
  
  return (
    <group>
      {/* Trunk */}
      <mesh position={[0, trunkHeight / 2, 0]} castShadow>
        <cylinderGeometry args={[trunkRadius * 0.8, trunkRadius, trunkHeight, 8]} />
        <meshStandardMaterial color="#4a3020" roughness={0.95} />
      </mesh>
      
      {/* Foliage - stacked cones for layered look */}
      {[0, 0.25, 0.5].map((offset, i) => (
        <mesh 
          key={i} 
          position={[0, trunkHeight + foliageHeight * (0.3 + offset * 0.4), 0]} 
          castShadow
        >
          <coneGeometry args={[foliageRadius * (1 - offset * 0.3), foliageHeight * 0.5, 8]} />
          <meshStandardMaterial 
            color={color} 
            roughness={0.8}
            emissive={selected ? color : '#000000'}
            emissiveIntensity={selected ? 0.15 : 0}
          />
        </mesh>
      ))}
    </group>
  );
};

/**
 * Rock: Irregular polyhedron
 */
const RockProp: React.FC<{ height: number; width: number; depth: number; color: string; selected: boolean }> = 
  ({ height, width, depth, color, selected }) => {
  return (
    <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
      <dodecahedronGeometry args={[Math.max(width, depth, height) / 2, 0]} />
      <meshStandardMaterial 
        color={color} 
        roughness={0.9} 
        metalness={0.05}
        emissive={selected ? color : '#000000'}
        emissiveIntensity={selected ? 0.2 : 0}
      />
    </mesh>
  );
};

/**
 * Boulder: Large round rock
 */
const BoulderProp: React.FC<{ height: number; width: number; depth: number; color: string; selected: boolean }> = 
  ({ height, width, depth, color, selected }) => {
  const radius = Math.max(width, depth, height) / 2;
  
  return (
    <mesh position={[0, radius * 0.7, 0]} castShadow receiveShadow>
      <sphereGeometry args={[radius, 8, 6]} />
      <meshStandardMaterial 
        color={color} 
        roughness={0.85}
        emissive={selected ? color : '#000000'}
        emissiveIntensity={selected ? 0.2 : 0}
      />
    </mesh>
  );
};

/**
 * Column: Tall cylinder with capital
 */
const ColumnProp: React.FC<{ height: number; width: number; color: string; selected: boolean }> = 
  ({ height, width, color, selected }) => {
  const radius = width / 2.5;
  
  return (
    <group>
      {/* Base */}
      <mesh position={[0, 0.1, 0]} castShadow>
        <cylinderGeometry args={[radius * 1.3, radius * 1.4, 0.2, 8]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      
      {/* Shaft */}
      <mesh position={[0, height / 2, 0]} castShadow>
        <cylinderGeometry args={[radius * 0.9, radius, height - 0.4, 12]} />
        <meshStandardMaterial 
          color={color} 
          roughness={0.6}
          emissive={selected ? color : '#000000'}
          emissiveIntensity={selected ? 0.2 : 0}
        />
      </mesh>
      
      {/* Capital */}
      <mesh position={[0, height - 0.1, 0]} castShadow>
        <cylinderGeometry args={[radius * 1.4, radius, 0.3, 8]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
    </group>
  );
};

/**
 * Stairs: Stepped boxes ascending
 */
const StairsProp: React.FC<{ height: number; width: number; depth: number; color: string; selected: boolean }> = 
  ({ height, width, depth, color, selected }) => {
  const steps = Math.max(2, Math.ceil(height / 0.3));
  const stepHeight = height / steps;
  const stepDepth = depth / steps;
  
  return (
    <group>
      {Array.from({ length: steps }).map((_, i) => (
        <mesh 
          key={i} 
          position={[0, (i + 0.5) * stepHeight, -depth / 2 + (i + 0.5) * stepDepth]} 
          castShadow 
          receiveShadow
        >
          <boxGeometry args={[width, stepHeight, stepDepth]} />
          <meshStandardMaterial 
            color={color} 
            roughness={0.8}
            emissive={selected ? color : '#000000'}
            emissiveIntensity={selected ? 0.15 : 0}
          />
          <Edges color="#1a1a1a" linewidth={1} />
        </mesh>
      ))}
    </group>
  );
};

/**
 * Pit: Negative space going below ground (represented as dark box below y=0)
 */
const PitProp: React.FC<{ height: number; width: number; depth: number; color: string; selected: boolean }> = 
  ({ height, width, depth, color, selected }) => {
  // Height here represents depth below ground (negative Y)
  const pitDepth = Math.abs(height);
  
  return (
    <group>
      {/* Dark pit interior */}
      <mesh position={[0, -pitDepth / 2, 0]} receiveShadow>
        <boxGeometry args={[width, pitDepth, depth]} />
        <meshStandardMaterial 
          color="#0a0a0a" 
          roughness={0.95}
          emissive={selected ? '#1a1a1a' : '#000000'}
          emissiveIntensity={selected ? 0.5 : 0}
        />
      </mesh>
      
      {/* Rim edges */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[Math.min(width, depth) / 2 - 0.1, Math.min(width, depth) / 2, 4]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
};

/**
 * Water Pool: Recessed water area (below ground level)
 */
const WaterPoolProp: React.FC<{ height: number; width: number; depth: number; selected: boolean }> = 
  ({ height, width, depth, selected }) => {
  // Height = depth of water below surface
  const waterDepth = Math.abs(height) || 0.3;
  
  return (
    <group>
      {/* Water surface - slightly below ground */}
      <mesh position={[0, -waterDepth + 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial 
          color="#1a5f7a" 
          roughness={0.1} 
          metalness={0.3}
          transparent
          opacity={0.75}
          emissive={selected ? '#1a5f7a' : '#0a2f3a'}
          emissiveIntensity={selected ? 0.4 : 0.1}
        />
      </mesh>
      
      {/* Depth indication - darker bottom */}
      <mesh position={[0, -waterDepth / 2 - 0.05, 0]}>
        <boxGeometry args={[width * 0.95, waterDepth, depth * 0.95]} />
        <meshStandardMaterial 
          color="#0a2530" 
          transparent
          opacity={0.6}
        />
      </mesh>
    </group>
  );
};

/**
 * Main exported component - selects prop based on type
 */
export const ProceduralProp: React.FC<ProceduralPropProps> = ({
  propType,
  heightFeet = 10,
  widthTiles = 1,
  depthTiles = 1,
  color = '#666666',
  isSelected = false,
  rotation = 0,
}) => {
  const height = feetToUnits(heightFeet);
  const width = widthTiles;
  const depth = depthTiles;
  
  const PropComponent = () => {
    switch (propType) {
      case 'cliff':
        return <CliffProp height={height} width={width} depth={depth} color={color} selected={isSelected} />;
      case 'wall':
        return <WallProp height={height} width={width} depth={depth} color={color} selected={isSelected} />;
      case 'bridge':
        return <BridgeProp height={height} width={width} depth={depth} color={color} selected={isSelected} />;
      case 'tree':
        return <TreeProp height={height} width={Math.max(width, depth)} color={color} selected={isSelected} />;
      case 'rock':
        return <RockProp height={height} width={width} depth={depth} color={color} selected={isSelected} />;
      case 'boulder':
        return <BoulderProp height={height} width={width} depth={depth} color={color} selected={isSelected} />;
      case 'column':
        return <ColumnProp height={height} width={Math.max(width, depth)} color={color} selected={isSelected} />;
      case 'stairs':
        return <StairsProp height={height} width={width} depth={depth} color={color} selected={isSelected} />;
      case 'pit':
        return <PitProp height={height} width={width} depth={depth} color={color} selected={isSelected} />;
      case 'water_pool':
        return <WaterPoolProp height={height} width={width} depth={depth} selected={isSelected} />;
      default:
        return <RockProp height={height} width={width} depth={depth} color={color} selected={isSelected} />;
    }
  };
  
  return (
    <group rotation={[0, rotation, 0]}>
      <PropComponent />
    </group>
  );
};

export default ProceduralProp;
