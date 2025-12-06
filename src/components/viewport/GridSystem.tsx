import React, { useMemo } from 'react';
import { Html } from '@react-three/drei';
import { useCombatStore } from '../../stores/combatStore';

export const GridSystem: React.FC = () => {
  const entities = useCombatStore((state) => state.entities);
  const terrain = useCombatStore((state) => state.terrain);
  
  // Calculate dynamic bounds from all entities and terrain
  const bounds = useMemo(() => {
    let minX = 0, maxX = 20, minZ = 0, maxZ = 20;
    
    // Check entity positions (in MCP coords)
    entities.forEach(entity => {
      const mcpX = entity.position.x + 10; // Convert viz to MCP
      const mcpZ = entity.position.z + 10;
      minX = Math.min(minX, mcpX);
      maxX = Math.max(maxX, mcpX);
      minZ = Math.min(minZ, mcpZ);
      maxZ = Math.max(maxZ, mcpZ);
    });
    
    // Check terrain positions (in MCP coords)
    terrain.forEach(t => {
      const mcpX = t.position.x + 10; // Convert viz to MCP
      const mcpZ = t.position.z + 10;
      minX = Math.min(minX, mcpX);
      maxX = Math.max(maxX, mcpX);
      minZ = Math.min(minZ, mcpZ);
      maxZ = Math.max(maxZ, mcpZ);
    });
    
    // Add padding and round to nice numbers
    const padding = 5;
    minX = Math.floor((minX - padding) / 5) * 5;
    maxX = Math.ceil((maxX + padding) / 5) * 5;
    minZ = Math.floor((minZ - padding) / 5) * 5;
    maxZ = Math.ceil((maxZ + padding) / 5) * 5;
    
    // Calculate the center offset for visualization
    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;
    const rangeX = maxX - minX;
    const rangeZ = maxZ - minZ;
    const gridSize = Math.max(rangeX, rangeZ, 20);
    
    return { minX, maxX, minZ, maxZ, centerX, centerZ, gridSize };
  }, [entities, terrain]);
  
  const gridSize = Math.max(bounds.gridSize, 100);
  const divisions = Math.max(bounds.gridSize, 100);
  const labelInterval = bounds.gridSize > 50 ? 10 : 5;
  const labels: React.ReactElement[] = [];
  
  // Helper to convert MCP coord to visualizer coord  
  const toViz = (mcpCoord: number) => mcpCoord - 10;
  
  // CENTER AXIS LABELS (X-axis at z=centerZ, horizontal)
  for (let mcpX = bounds.minX; mcpX <= bounds.maxX; mcpX += labelInterval) {
    const vizX = toViz(mcpX);
    labels.push(
      <Html
        key={`center-x-${mcpX}`}
        position={[vizX, 0.15, toViz(bounds.centerZ)]}
        center
        style={{
          color: '#00ff41',
          fontSize: '12px',
          fontFamily: 'monospace',
          fontWeight: 'bold',
          pointerEvents: 'none',
          userSelect: 'none',
          opacity: 0.9,
          textShadow: '0 0 2px #00ff41',
        }}
      >
        {mcpX}
      </Html>
    );
  }

  // CENTER AXIS LABELS (Z-axis at x=centerX, vertical)
  for (let mcpZ = bounds.minZ; mcpZ <= bounds.maxZ; mcpZ += labelInterval) {
    const vizZ = toViz(mcpZ);
    labels.push(
      <Html
        key={`center-z-${mcpZ}`}
        position={[toViz(bounds.centerX), 0.15, vizZ]}
        center
        style={{
          color: '#00ff41',
          fontSize: '12px',
          fontFamily: 'monospace',
          fontWeight: 'bold',
          pointerEvents: 'none',
          userSelect: 'none',
          opacity: 0.9,
          textShadow: '0 0 2px #00ff41',
        }}
      >
        {mcpZ}
      </Html>
    );
  }

  return (
    <group>
      {/* Size 100, Divisions 100, Center Color (terminal-green), Grid Color (terminal-dim) */}
      <gridHelper args={[gridSize, divisions, '#00ff41', '#1a1a1a']} />
      
      {/* Grid coordinate labels - MCP style (dynamic) */}
      {labels}
      
      {/* Origin label showing MCP (0,0) */}
      <Html
        position={[-10, 0.2, -10]}
        center
        style={{
          color: '#00ff41',
          fontSize: '14px',
          fontFamily: 'monospace',
          pointerEvents: 'none',
          userSelect: 'none',
          opacity: 0.7,
          fontWeight: 'bold',
          textShadow: '0 0 3px #00ff41',
        }}
      >
        0,0
      </Html>
      
      {/* Compass Rose - positioned dynamically based on bounds */}
      <group position={[toViz(bounds.maxX - 5), 0.2, toViz(bounds.minZ + 5)]}>
        {/* North */}
        <Html
          position={[0, 0, -3]}
          center
          style={{
            color: '#ff4444',
            fontSize: '16px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            pointerEvents: 'none',
            userSelect: 'none',
            textShadow: '0 0 4px #ff4444',
          }}
        >
          N
        </Html>
        
        {/* East */}
        <Html
          position={[3, 0, 0]}
          center
          style={{
            color: '#00ff41',
            fontSize: '14px',
            fontFamily: 'monospace',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          E
        </Html>
        
        {/* South */}
        <Html
          position={[0, 0, 3]}
          center
          style={{
            color: '#00ff41',
            fontSize: '14px',
            fontFamily: 'monospace',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          S
        </Html>
        
        {/* West */}
        <Html
          position={[-3, 0, 0]}
          center
          style={{
            color: '#00ff41',
            fontSize: '14px',
            fontFamily: 'monospace',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          W
        </Html>
        
        {/* Compass center indicator */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.1, 16]} />
          <meshStandardMaterial color="#00ff41" emissive="#00ff41" emissiveIntensity={0.5} />
        </mesh>
        
        {/* North pointer arrow */}
        <mesh position={[0, 0.1, -1.5]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.4, 1.2, 3]} />
          <meshStandardMaterial color="#ff4444" emissive="#ff4444" emissiveIntensity={0.8} />
        </mesh>
      </group>
      
      {/* Invisible plane for raycasting and shadows */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[gridSize, gridSize]} />
        <meshBasicMaterial visible={false} />
      </mesh>
    </group>
  );
};