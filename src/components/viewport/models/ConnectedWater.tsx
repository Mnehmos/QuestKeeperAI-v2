/**
 * ConnectedWater.tsx
 * Generates connected water bodies (rivers, streams, pools, lakes)
 * Water tiles form natural flowing/pooling patterns rather than random squares.
 * 
 * Supports negative Y for deep rivers/valleys below ground level.
 */
import React, { useMemo } from 'react';
import { TerrainFeature } from '../../../stores/combatStore';

interface ConnectedWaterProps {
  waterTiles: TerrainFeature[];
  gridSize: number;
}

/**
 * Analyze water tiles and group them into connected bodies
 */
function groupConnectedWater(tiles: TerrainFeature[]): TerrainFeature[][] {
  const visited = new Set<string>();
  const groups: TerrainFeature[][] = [];
  
  const getKey = (t: TerrainFeature) => `${Math.floor(t.position.x)},${Math.floor(t.position.z)}`;
  const tileMap = new Map<string, TerrainFeature>();
  tiles.forEach(t => tileMap.set(getKey(t), t));
  
  // BFS to find connected tiles
  const bfs = (start: TerrainFeature): TerrainFeature[] => {
    const group: TerrainFeature[] = [];
    const queue = [start];
    visited.add(getKey(start));
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      group.push(current);
      
      // Check 4-way adjacency
      const x = Math.floor(current.position.x);
      const z = Math.floor(current.position.z);
      const neighbors = [
        `${x+1},${z}`, `${x-1},${z}`,
        `${x},${z+1}`, `${x},${z-1}`
      ];
      
      for (const nKey of neighbors) {
        if (!visited.has(nKey) && tileMap.has(nKey)) {
          visited.add(nKey);
          queue.push(tileMap.get(nKey)!);
        }
      }
    }
    
    return group;
  };
  
  // Find all connected groups
  for (const tile of tiles) {
    const key = getKey(tile);
    if (!visited.has(key)) {
      groups.push(bfs(tile));
    }
  }
  
  return groups;
}

/**
 * Determine water body type based on shape analysis
 */
function analyzeWaterShape(group: TerrainFeature[]): 'river' | 'stream' | 'pool' | 'lake' {
  if (group.length <= 2) return 'stream';
  if (group.length <= 8) return 'pool';
  
  // Check aspect ratio for river vs lake
  const xs = group.map(t => t.position.x);
  const zs = group.map(t => t.position.z);
  const width = Math.max(...xs) - Math.min(...xs) + 1;
  const depth = Math.max(...zs) - Math.min(...zs) + 1;
  const aspectRatio = Math.max(width, depth) / Math.min(width, depth);
  
  if (aspectRatio > 3) return 'river';
  if (group.length > 20) return 'lake';
  return 'pool';
}

/**
 * Get water color based on body type and depth
 */
function getWaterColor(type: 'river' | 'stream' | 'pool' | 'lake', depth: number = 0): string {
  // Deeper water is darker
  const depthFactor = Math.min(Math.abs(depth) / 2, 1);
  
  const baseColors = {
    river: '#1a5f7a',   // Blue-teal flowing water
    stream: '#2a7f9a',  // Lighter stream
    pool: '#1a4f6a',    // Still darker pool
    lake: '#0a3f5a',    // Deep lake blue
  };
  
  // Darken based on depth
  const base = baseColors[type];
  if (depthFactor > 0.5) {
    return base.replace(/[0-9a-f]{2}/gi, (hex) => {
      const val = Math.max(0, parseInt(hex, 16) - Math.floor(depthFactor * 30));
      return val.toString(16).padStart(2, '0');
    });
  }
  
  return base;
}

export const ConnectedWater: React.FC<ConnectedWaterProps> = ({ waterTiles }) => {
  const waterGroups = useMemo(() => groupConnectedWater(waterTiles), [waterTiles]);
  
  return (
    <group>
      {waterGroups.map((group, groupIdx) => {
        const waterType = analyzeWaterShape(group);
        const avgDepth = group.reduce((sum, t) => sum + (t.position.y || 0), 0) / group.length;
        const color = getWaterColor(waterType, avgDepth);
        
        // Render individual tiles with connected appearance
        return (
          <group key={`water-group-${groupIdx}`}>
            {group.map((tile, tileIdx) => {
              // Calculate depth (negative Y = below ground)
              const depth = Math.abs(tile.position.y) || 0.1;
              const surfaceY = tile.position.y < 0 ? tile.position.y + 0.05 : 0.02;
              
              return (
                <group key={`water-${groupIdx}-${tileIdx}`}>
                  {/* Water surface */}
                  <mesh 
                    position={[tile.position.x + 0.5, surfaceY, tile.position.z + 0.5]} 
                    rotation={[-Math.PI / 2, 0, 0]}
                    receiveShadow
                  >
                    <planeGeometry args={[1.02, 1.02]} />
                    <meshStandardMaterial 
                      color={color}
                      roughness={0.1}
                      metalness={0.3}
                      transparent
                      opacity={0.75}
                      emissive={color}
                      emissiveIntensity={0.1}
                    />
                  </mesh>
                  
                  {/* Depth indication for deep water (negative Y) */}
                  {tile.position.y < -0.1 && (
                    <mesh 
                      position={[tile.position.x + 0.5, tile.position.y / 2, tile.position.z + 0.5]}
                    >
                      <boxGeometry args={[0.98, depth, 0.98]} />
                      <meshStandardMaterial 
                        color="#0a2530"
                        transparent
                        opacity={0.6}
                      />
                    </mesh>
                  )}
                </group>
              );
            })}
            
            {/* Flow direction indicator for rivers/streams */}
            {(waterType === 'river' || waterType === 'stream') && group.length > 3 && (
              <FlowIndicator tiles={group} color={color} />
            )}
          </group>
        );
      })}
    </group>
  );
};

/**
 * Subtle flow direction arrows for rivers
 */
const FlowIndicator: React.FC<{ tiles: TerrainFeature[]; color: string }> = ({ tiles, color }) => {
  // Calculate flow direction from tile positions
  const sorted = [...tiles].sort((a, b) => 
    (a.position.x + a.position.z) - (b.position.x + b.position.z)
  );
  
  if (sorted.length < 2) return null;
  
  const start = sorted[0];
  const end = sorted[sorted.length - 1];
  const midIdx = Math.floor(sorted.length / 2);
  const mid = sorted[midIdx];
  
  // Direction vector
  const dx = end.position.x - start.position.x;
  const dz = end.position.z - start.position.z;
  const angle = Math.atan2(dz, dx);
  
  return (
    <mesh 
      position={[mid.position.x + 0.5, 0.08, mid.position.z + 0.5]}
      rotation={[-Math.PI / 2, 0, -angle + Math.PI / 2]}
    >
      <coneGeometry args={[0.15, 0.4, 3]} />
      <meshStandardMaterial 
        color={color}
        emissive={color}
        emissiveIntensity={0.3}
        transparent
        opacity={0.6}
      />
    </mesh>
  );
};

export default ConnectedWater;
