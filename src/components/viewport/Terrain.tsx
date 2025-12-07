import React, { useMemo } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import { Edges } from '@react-three/drei';
import { useCombatStore, type TerrainFeature } from '../../stores/combatStore';
import { TerrainTooltip } from './TerrainTooltip';

interface TerrainProps {
  feature: TerrainFeature;
  allTerrain: TerrainFeature[];
}

// Helper to check if two terrain pieces are adjacent
function areAdjacent(t1: TerrainFeature, t2: TerrainFeature): boolean {
  if (t1.type !== t2.type || t1.type !== 'wall') return false;
  
  const dx = Math.abs(t1.position.x - t2.position.x);
  const dz = Math.abs(t1.position.z - t2.position.z);
  const dy = Math.abs(t1.position.y - t2.position.y);
  
  // Adjacent if exactly 1 unit apart in x or z, and same y
  return dy < 0.1 && ((dx === 1 && dz < 0.1) || (dz === 1 && dx < 0.1));
}

// Helper to find connected wall group
function findConnectedWalls(start: TerrainFeature, all: TerrainFeature[]): TerrainFeature[] {
  const visited = new Set<string>();
  const group: TerrainFeature[] = [];
  const queue = [start];
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current.id)) continue;
    
    visited.add(current.id);
    group.push(current);
    
    // Find all adjacent walls
    for (const terrain of all) {
      if (!visited.has(terrain.id) && areAdjacent(current, terrain)) {
        queue.push(terrain);
      }
    }
  }
  
  return group;
}

export const Terrain: React.FC<TerrainProps> = ({ feature, allTerrain }) => {
  const { dimensions, position, color, type } = feature;
  const measureMode = useCombatStore((state) => state.measureMode);
  const measureStart = useCombatStore((state) => state.measureStart);
  const measureEnd = useCombatStore((state) => state.measureEnd);
  const setMeasureStart = useCombatStore((state) => state.setMeasureStart);
  const setMeasureEnd = useCombatStore((state) => state.setMeasureEnd);
  const setClickedTileCoord = useCombatStore((state) => state.setClickedTileCoord);
  const clickedTileCoord = useCombatStore((state) => state.clickedTileCoord);
  const setCursorPosition = useCombatStore((state) => state.setCursorPosition);
  const selectedTerrainId = useCombatStore((state) => state.selectedTerrainId);
  const selectTerrain = useCombatStore((state) => state.selectTerrain);
  
  const isSelected = selectedTerrainId === feature.id;
  
  const handlePointerMove = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const vizX = Math.floor(e.point.x);
    const vizZ = Math.floor(e.point.z);
    setCursorPosition({ x: vizX, y: vizZ });
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const vizX = Math.floor(e.point.x);
    const vizZ = Math.floor(e.point.z);
    const mcpX = vizX + 10;
    const mcpZ = vizZ + 10;

    if (measureMode) {
      if (!measureStart) {
        setMeasureStart({ x: vizX, y: vizZ }); 
      } else if (!measureEnd) {
        setMeasureEnd({ x: vizX, y: vizZ });
      } else {
        setMeasureStart({ x: vizX, y: vizZ });
        setMeasureEnd(null);
      }
    } else {
      // Toggle terrain selection
      selectTerrain(isSelected ? null : feature.id);
      
      // Update clicked tile for LOS/Highlight
      if (clickedTileCoord && clickedTileCoord.x === mcpX && clickedTileCoord.y === mcpZ) {
        setClickedTileCoord(null);
      } else {
        setClickedTileCoord({ x: mcpX, y: mcpZ });
      }
    }
    
    console.log('[Terrain] Clicked:', feature.type, 'at', {x: vizX, z: vizZ});
  };
  
  // For walls, calculate connected geometry
  const wallGeometry = useMemo(() => {
    if (type !== 'wall') return null;
    
    const connectedWalls = findConnectedWalls(feature, allTerrain.filter(t => t.type === 'wall'));
    
    // Calculate bounding box for all connected walls
    if (connectedWalls.length === 0) return null;
    
    const minX = Math.min(...connectedWalls.map(w => w.position.x - w.dimensions.width / 2));
    const maxX = Math.max(...connectedWalls.map(w => w.position.x + w.dimensions.width / 2));
    const minZ = Math.min(...connectedWalls.map(w => w.position.z - w.dimensions.depth / 2));
    const maxZ = Math.max(...connectedWalls.map(w => w.position.z + w.dimensions.depth / 2));
    
    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;
    const width = maxX - minX;
    const depth = maxZ - minZ;
    
    return {
      center: { x: centerX, y: position.y, z: centerZ },
      dimensions: { width, height: dimensions.height, depth },
      tiles: connectedWalls
    };
  }, [feature, allTerrain, type, position, dimensions]);

  // For walls, render merged geometry
  if (type === 'wall' && wallGeometry) {
    // Only render if this is the "leader" wall in the group (by ID) to avoid duplicates
    const isGroupLeader = wallGeometry.tiles.sort((a, b) => a.id.localeCompare(b.id))[0].id === feature.id;
    
    if (!isGroupLeader) return null;
    
    // Shift center by +0.5 to align with grid squares (0..1) instead of intersections
    return (
      <group onClick={handleClick} onPointerMove={handlePointerMove}>
        <mesh position={[wallGeometry.center.x + 0.5, wallGeometry.center.y, wallGeometry.center.z + 0.5]} castShadow receiveShadow>
          <boxGeometry args={[wallGeometry.dimensions.width, wallGeometry.dimensions.height, wallGeometry.dimensions.depth]} />
          <meshStandardMaterial 
            color={color}
            roughness={0.8}
            metalness={0.3}
          />
          <Edges color="#1a1a1a" linewidth={1.5} />
        </mesh>
        {isSelected && (
          <group position={[wallGeometry.center.x, wallGeometry.center.y + wallGeometry.dimensions.height / 2 + 0.5, wallGeometry.center.z]}>
            <TerrainTooltip feature={feature} />
          </group>
        )}
      </group>
    );
  }

  // Get material properties based on terrain type
  const getMaterialProps = () => {
    switch (type) {
      case 'water':
        return { roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.6 };
      case 'difficult':
        return { roughness: 0.9, metalness: 0.0, transparent: true, opacity: feature.opacity ?? 0.7 };
      case 'obstacle':
        return { roughness: 0.8, metalness: 0.2, transparent: false, opacity: 1.0 };
      case 'elevation':
      case 'floor':
        return { roughness: 0.6, metalness: 0.1, transparent: true, opacity: feature.opacity ?? 0.5 };
      case 'ceiling':
        return { roughness: 0.4, metalness: 0.2, transparent: true, opacity: feature.opacity ?? 0.3 };
      case 'prop':
        return { roughness: 0.6, metalness: 0.1, transparent: false, opacity: 1.0, emissive: true };
      default:
        return { roughness: 0.7, metalness: 0.1, transparent: false, opacity: 1.0 };
    }
  };

  const materialProps = getMaterialProps();

  // Render non-wall terrain with 2.5D styling
  return (
    <group onClick={handleClick} onPointerMove={handlePointerMove}>
      <mesh position={[position.x + 0.5, position.y, position.z + 0.5]} castShadow receiveShadow>
        <boxGeometry args={[dimensions.width, dimensions.height, dimensions.depth]} />
        <meshStandardMaterial 
          color={color}
          roughness={materialProps.roughness}
          metalness={materialProps.metalness}
          transparent={materialProps.transparent}
          opacity={materialProps.opacity}
        />
        {/* Add edge highlight for obstacles and props */}
        {(type === 'obstacle' || type === 'wall' || type === 'prop') && (
          <Edges color="#1a1a1a" linewidth={1.5} />
        )}
      </mesh>
      {isSelected && (
        <group position={[position.x, position.y + dimensions.height / 2 + 0.5, position.z]}>
          <TerrainTooltip feature={feature} />
        </group>
      )}
    </group>
  );
};

export const TerrainLayer: React.FC = () => {
  const terrain = useCombatStore((state) => state.terrain);

  return (
    <>
      {terrain.map((feature) => (
        <Terrain key={feature.id} feature={feature} allTerrain={terrain} />
      ))}
    </>
  );
};
