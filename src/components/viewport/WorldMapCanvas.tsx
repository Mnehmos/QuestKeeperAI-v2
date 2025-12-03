import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useGameStateStore } from '../../stores/gameStateStore';
import { mcpManager } from '../../services/mcpClient';
import { WorldEnvironmentOverlay } from './WorldEnvironmentOverlay';
import { POIDetailPanel } from './POIDetailPanel';

// Biome color mapping
const BIOME_COLORS: Record<string, string> = {
  ocean: '#1a5f7a',
  deep_ocean: '#0d3d54',
  lake: '#4169e1',
  hot_desert: '#c2b280',
  savanna: '#bdb76b',
  tropical_rainforest: '#228b22',
  grassland: '#7cba3d',
  temperate_deciduous_forest: '#2d5a27',
  wetland: '#556b2f',
  taiga: '#2e8b57',
  tundra: '#b0c4de',
  glacier: '#e0ffff',
  mountain: '#8b8b8b',
  desert: '#d4a574',
  forest: '#228b22',
  plains: '#90b060',
  swamp: '#4a5d23',
  beach: '#f0e68c',
  snow: '#fffafa',
};

// Structure icons - larger and more prominent
const STRUCTURE_ICONS: Record<string, string> = {
  city: '🏙️',
  town: '🏘️',
  village: '🏠',
  castle: '🏰',
  ruins: '🏛️',
  dungeon: '⚔️',
  temple: '⛪',
  camp: '⛺',
  landmark: '🗿',
  shrine: '⛩️',
  fortress: '🏰',
};

type VisualizationMode = 'biomes' | 'heightmap' | 'temperature' | 'moisture' | 'rivers';

interface TileData {
  width: number;
  height: number;
  biomes: string[];
  tiles: number[][];
  regions: Array<{
    id: number;
    name: string;
    biome: string;
    capitalX: number;
    capitalY: number;
  }>;
  structures: Array<{
    type: string;
    name: string;
    x: number;
    y: number;
  }>;
}

interface TooltipData {
  x: number;
  y: number;
  biome: string;
  elevation: number;
  region: string | null;
  structure: { type: string; name: string } | null;
  hasRiver: boolean;
}

export const WorldMapCanvas: React.FC = () => {
  const activeWorldId = useGameStateStore((state) => state.activeWorldId);
  const worlds = useGameStateStore((state) => state.worlds);
  const world = useGameStateStore((state) => state.world);
  
  const [tileData, setTileData] = useState<TileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingTime, setLoadingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [selectedPOI, setSelectedPOI] = useState<{ type: string; name: string; x: number; y: number } | null>(null);
  const [hoveredPOI, setHoveredPOI] = useState<{ x: number; y: number } | null>(null);
  const [visualizationMode, setVisualizationMode] = useState<VisualizationMode>('biomes');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const loadingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fetchInProgressRef = useRef(false);
  
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const TILE_SIZE = 10;
  const activeWorld = worlds.find(w => w.id === activeWorldId);

  // Get tile color based on visualization mode
  const getTileColor = useCallback((
    biomeName: string,
    elevation: number,
    hasRiver: boolean,
    mode: VisualizationMode
  ): string => {
    const isWater = biomeName === 'ocean' || biomeName === 'deep_ocean' || biomeName === 'lake';

    switch (mode) {
      case 'heightmap': {
        // Grayscale based on elevation (0-100)
        const gray = Math.floor((elevation / 100) * 255);
        return `rgb(${gray}, ${gray}, ${gray})`;
      }

      case 'temperature': {
        // Blue (cold) to red (hot) gradient
        // Assume elevation affects temperature: higher = colder
        const temp = 100 - elevation * 0.3; // Simple temperature model
        const normalized = Math.max(0, Math.min(100, temp)) / 100;
        const r = Math.floor(normalized * 255);
        const b = Math.floor((1 - normalized) * 255);
        return `rgb(${r}, 0, ${b})`;
      }

      case 'moisture': {
        // Brown (dry) to blue-green (wet)
        const isMoist = hasRiver || isWater;
        if (isWater) return '#1e90ff';
        if (isMoist) return '#4682b4';
        
        // Dry land - brown to tan
        const moisture = hasRiver ? 80 : elevation > 70 ? 20 : 50;
        const normalized = moisture / 100;
        const r = Math.floor(139 + (222 - 139) * (1 - normalized));
        const g = Math.floor(69 + (184 - 69) * (1 - normalized));
        const b = Math.floor(19 + (135 - 19) * normalized);
        return `rgb(${r}, ${g}, ${b})`;
      }

      case 'rivers': {
        // Show only water features
        if (hasRiver) return '#1e90ff';
        if (isWater) return '#0066cc';
        return '#1a1a1a'; // Dark gray for land
      }

      case 'biomes':
      default: {
        const color = BIOME_COLORS[biomeName] || '#666666';
        if (isWater) return color;
        
        // Adjust brightness based on elevation
        const elevMod = (elevation - 50) / 100;
        return adjustBrightness(color, elevMod * 30);
      }
    }
  }, []);

  // Fetch tile data from MCP
  const fetchTileData = useCallback(async () => {
    if (!activeWorldId) {
      setError('No world selected');
      setLoading(false);
      return;
    }

    if (fetchInProgressRef.current) {
      console.log('[WorldMapCanvas] Fetch already in progress, skipping duplicate');
      return;
    }
    fetchInProgressRef.current = true;

    setLoading(true);
    setError(null);
    setLoadingTime(0);

    const startTime = Date.now();
    loadingTimerRef.current = setInterval(() => {
      setLoadingTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    try {
      if (!mcpManager.gameStateClient.isConnected()) {
        throw new Error('MCP client not available');
      }

      console.log('[WorldMapCanvas] Fetching tiles for world:', activeWorldId);
      const result = await mcpManager.gameStateClient.callTool('get_world_tiles', { worldId: activeWorldId });

      const content = result.content?.[0];
      if (content?.type === 'text') {
        const data = JSON.parse(content.text);
        console.log('[WorldMapCanvas] Received tile data:', data.width, 'x', data.height);
        setTileData(data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('[WorldMapCanvas] Failed to fetch tiles:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to load map';
      
      if (errorMsg.includes('timed out')) {
        setError('World generation timed out. Large worlds with complex terrain (lakes, rivers) may take longer to generate. Try again or select a smaller world.');
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
      if (loadingTimerRef.current) {
        clearInterval(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
    }
  }, [activeWorldId]);

  useEffect(() => {
    return () => {
      if (loadingTimerRef.current) {
        clearInterval(loadingTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    fetchTileData();
  }, [fetchTileData]);

  // Draw the map on canvas
  useEffect(() => {
    if (!tileData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height, biomes, tiles, structures } = tileData;
    const tileSize = TILE_SIZE * zoom;

    canvas.width = width * tileSize;
    canvas.height = height * tileSize;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw tiles based on visualization mode
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tileIdx = x * 5;
        const row = tiles[y];
        if (!row) continue;

        const biomeIdx = row[tileIdx];
        const elevation = row[tileIdx + 1];
        const hasRiver = row[tileIdx + 3] === 1;

        const biomeName = biomes[biomeIdx] || 'unknown';
        const color = getTileColor(biomeName, elevation, hasRiver, visualizationMode);

        ctx.fillStyle = color;
        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
      }
    }

    // Draw structures with enhanced visibility
    structures.forEach((struct) => {
      const icon = STRUCTURE_ICONS[struct.type] || '📍';
      const x = struct.x * tileSize + tileSize / 2;
      const y = struct.y * tileSize + tileSize / 2;
      
      // Draw background circle for contrast
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.beginPath();
      ctx.arc(x, y, tileSize * 0.8, 0, Math.PI * 2);
      ctx.fill();

      // Add glow effect if hovered
      if (hoveredPOI && hoveredPOI.x === struct.x && hoveredPOI.y === struct.y) {
        ctx.shadowColor = '#00ff41';
        ctx.shadowBlur = 15;
      }

      // Draw icon larger
      ctx.font = `${Math.max(14, tileSize * 1.2)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(icon, x, y);

      // Reset shadow
      ctx.shadowBlur = 0;
    });

    // Draw grid lines if zoomed in
    if (zoom >= 1.5) {
      ctx.strokeStyle = 'rgba(0, 255, 65, 0.2)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= width; x++) {
        ctx.beginPath();
        ctx.moveTo(x * tileSize, 0);
        ctx.lineTo(x * tileSize, height * tileSize);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * tileSize);
        ctx.lineTo(width * tileSize, y * tileSize);
        ctx.stroke();
      }
    }
  }, [tileData, zoom, visualizationMode, hoveredPOI, getTileColor]);

  // Handle mouse move for tooltips and hover detection
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!tileData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const tileSize = TILE_SIZE * zoom;

    const x = Math.floor((e.clientX - rect.left) / tileSize);
    const y = Math.floor((e.clientY - rect.top) / tileSize);

    if (x < 0 || x >= tileData.width || y < 0 || y >= tileData.height) {
      setTooltip(null);
      setHoveredPOI(null);
      return;
    }

    // Check if hovering over a structure
    const structure = tileData.structures.find(s => s.x === x && s.y === y);
    if (structure) {
      setHoveredPOI({ x, y });
      // Change cursor to pointer
      if (canvas.style.cursor !== 'pointer') {
        canvas.style.cursor = 'pointer';
      }
    } else {
      setHoveredPOI(null);
      if (canvas.style.cursor !== 'grab' && !isDragging) {
        canvas.style.cursor = 'grab';
      } else if (isDragging && canvas.style.cursor !== 'grabbing') {
        canvas.style.cursor = 'grabbing';
      }
    }

    if (isDragging) return;

    const row = tileData.tiles[y];
    if (!row) return;

    const tileIdx = x * 5;
    const biomeIdx = row[tileIdx];
    const elevation = row[tileIdx + 1];
    const regionId = row[tileIdx + 2];
    const hasRiver = row[tileIdx + 3] === 1;

    const region = tileData.regions.find(r => r.id === regionId);

    setTooltip({
      x,
      y,
      biome: tileData.biomes[biomeIdx] || 'unknown',
      elevation,
      region: region?.name || null,
      structure: structure || null,
      hasRiver,
    });

    setTooltipPos({
      x: e.clientX - rect.left + 15,
      y: e.clientY - rect.top + 15,
    });
  }, [tileData, zoom, isDragging]);

  // Handle POI click
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!tileData || !canvasRef.current || isDragging) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const tileSize = TILE_SIZE * zoom;

    const x = Math.floor((e.clientX - rect.left) / tileSize);
    const y = Math.floor((e.clientY - rect.top) / tileSize);

    const structure = tileData.structures.find(s => s.x === x && s.y === y);
    if (structure) {
      setSelectedPOI(structure);
    }
  }, [tileData, zoom, isDragging]);

  // Handle zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.min(4, Math.max(0.5, prev + delta)));
  }, []);

  // Handle pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0 && !hoveredPOI) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  }, [offset, hoveredPOI]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrag = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  }, [isDragging, dragStart]);

  // ESC key to close POI panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedPOI) {
        setSelectedPOI(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPOI]);

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center font-mono text-terminal-green">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4 animate-pulse">🌍</div>
          <div className="text-xl mb-2">Generating World Map...</div>
          {activeWorld && (
            <div className="text-sm text-terminal-green/70 mb-4">
              {activeWorld.name} ({activeWorld.width}×{activeWorld.height} tiles)
            </div>
          )}
          <div className="text-lg text-terminal-green-bright mb-2">
            {loadingTime}s elapsed
          </div>
          <div className="text-xs text-terminal-green/50 space-y-1">
            <p>Generating terrain, rivers, and lakes...</p>
            {loadingTime > 10 && (
              <p className="text-yellow-500/70">Large worlds with complex hydrology may take 30-60 seconds</p>
            )}
            {loadingTime > 30 && (
              <p className="text-orange-500/70">Still working... The lake/river algorithms are computationally intensive</p>
            )}
          </div>
          <div className="mt-4 w-64 mx-auto h-2 bg-terminal-green/20 rounded overflow-hidden">
            <div 
              className="h-full bg-terminal-green animate-pulse"
              style={{ 
                width: `${Math.min(95, loadingTime * 1.5)}%`,
                transition: 'width 1s ease-out'
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center font-mono text-terminal-green">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <div className="text-xl mb-4 text-red-500">Map Loading Failed</div>
          <div className="text-sm text-terminal-green/70 mb-4 whitespace-pre-wrap">{error}</div>
          <button
            onClick={fetchTileData}
            className="px-4 py-2 bg-terminal-green text-terminal-black font-bold uppercase hover:bg-terminal-green-bright transition-colors"
          >
            🔄 Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!tileData) {
    return (
      <div className="h-full w-full flex items-center justify-center font-mono text-terminal-green">
        <div className="text-center text-terminal-green/60">
          No world map data available
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col font-mono text-terminal-green overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center p-3 border-b border-terminal-green-dim flex-shrink-0">
        <h2 className="text-xl font-bold uppercase tracking-wider text-glow">
          🗺️ World Map
        </h2>
        <div className="flex items-center gap-4">
          {/* Visualization Mode Selector */}
          <select
            value={visualizationMode}
            onChange={(e) => setVisualizationMode(e.target.value as VisualizationMode)}
            className="px-2 py-1 bg-terminal-black border border-terminal-green text-terminal-green text-xs uppercase"
          >
            <option value="biomes">Biomes</option>
            <option value="heightmap">Heightmap</option>
            <option value="temperature">Temperature</option>
            <option value="moisture">Moisture</option>
            <option value="rivers">Rivers</option>
          </select>

          <span className="text-sm text-terminal-green/70">
            {tileData.width}×{tileData.height} tiles | {tileData.structures.length} structures | {tileData.regions.length} regions
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom(prev => Math.max(0.5, prev - 0.25))}
              className="px-2 py-1 bg-terminal-green/10 border border-terminal-green hover:bg-terminal-green/20"
            >
              -
            </button>
            <span className="text-sm w-16 text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(prev => Math.min(4, prev + 0.25))}
              className="px-2 py-1 bg-terminal-green/10 border border-terminal-green hover:bg-terminal-green/20"
            >
              +
            </button>
          </div>
          <button
            onClick={fetchTileData}
            className="px-3 py-1 text-xs bg-terminal-green/10 border border-terminal-green hover:bg-terminal-green/20 transition-colors uppercase tracking-wider"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden relative bg-terminal-black"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseMove={handleDrag}
      >
        <canvas
          ref={canvasRef}
          className="absolute"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px)`,
            imageRendering: 'pixelated',
            cursor: hoveredPOI ? 'pointer' : isDragging ? 'grabbing' : 'grab',
          }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => {
            setTooltip(null);
            setHoveredPOI(null);
          }}
          onClick={handleCanvasClick}
          onWheel={handleWheel}
        />

        {/* World Environment Overlay */}
        <WorldEnvironmentOverlay
          worldState={{
            name: activeWorld?.name,
            time: world?.time,
            date: world?.date,
            moonPhase: world?.environment?.moon_phase,
            weather: world?.weather,
            temperature: world?.environment?.temperature,
            season: world?.environment?.season,
            hazards: world?.environment?.hazards,
          }}
          position="top-right"
        />

        {/* Tooltip */}
        {tooltip && !selectedPOI && (
          <div
            className="absolute pointer-events-none bg-terminal-black/90 border border-terminal-green p-2 text-xs z-50"
            style={{ left: tooltipPos.x, top: tooltipPos.y }}
          >
            <div className="font-bold text-terminal-green-bright mb-1">
              ({tooltip.x}, {tooltip.y})
            </div>
            <div className="space-y-0.5">
              <div><span className="text-terminal-green/60">Biome:</span> {tooltip.biome.replace(/_/g, ' ')}</div>
              <div><span className="text-terminal-green/60">Elevation:</span> {tooltip.elevation}</div>
              {tooltip.region && (
                <div><span className="text-terminal-green/60">Region:</span> {tooltip.region}</div>
              )}
              {tooltip.hasRiver && (
                <div className="text-blue-400">🌊 River</div>
              )}
              {tooltip.structure && (
                <div className="text-yellow-400 font-bold">
                  {STRUCTURE_ICONS[tooltip.structure.type]} {tooltip.structure.name}
                  <div className="text-xs text-terminal-green/60 mt-0.5">(click for details)</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* POI Detail Panel */}
        {selectedPOI && (
          <POIDetailPanel
            poi={selectedPOI}
            biome={tooltip?.biome}
            region={tooltip?.region || undefined}
            onClose={() => setSelectedPOI(null)}
            onEnter={() => {
              console.log('Enter location:', selectedPOI.name);
              // TODO: Implement location entry
            }}
          />
        )}
      </div>

      {/* Legend - changes based on visualization mode */}
      <div className="p-2 border-t border-terminal-green-dim flex-shrink-0">
        <div className="flex flex-wrap gap-3 text-xs">
          {visualizationMode === 'biomes' && (
            <>
              {Object.entries(BIOME_COLORS).slice(0, 8).map(([biome, color]) => (
                <div key={biome} className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
                  <span className="text-terminal-green/70 capitalize">{biome.replace(/_/g, ' ')}</span>
                </div>
              ))}
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded-sm" />
                <span className="text-terminal-green/70">River</span>
              </div>
            </>
          )}
          {visualizationMode === 'heightmap' && (
            <div className="flex items-center gap-2">
              <span className="text-terminal-green/70">Elevation:</span>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-black rounded-sm" />
                <span className="text-terminal-green/70">Low</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-gray-500 rounded-sm" />
                <span className="text-terminal-green/70">Medium</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-white rounded-sm" />
                <span className="text-terminal-green/70">High</span>
              </div>
            </div>
          )}
          {visualizationMode === 'temperature' && (
            <div className="flex items-center gap-2">
              <span className="text-terminal-green/70">Temperature:</span>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded-sm" />
                <span className="text-terminal-green/70">Cold</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-purple-500 rounded-sm" />
                <span className="text-terminal-green/70">Cool</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded-sm" />
                <span className="text-terminal-green/70">Hot</span>
              </div>
            </div>
          )}
          {visualizationMode === 'moisture' && (
            <div className="flex items-center gap-2">
              <span className="text-terminal-green/70">Moisture:</span>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-700 rounded-sm" />
                <span className="text-terminal-green/70">Dry</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-700 rounded-sm" />
                <span className="text-terminal-green/70">Moderate</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded-sm" />
                <span className="text-terminal-green/70">Wet</span>
              </div>
            </div>
          )}
          {visualizationMode === 'rivers' && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-400 rounded-sm" />
                <span className="text-terminal-green/70">Rivers</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-700 rounded-sm" />
                <span className="text-terminal-green/70">Lakes/Ocean</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper to adjust color brightness
function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + percent));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + percent));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + percent));
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

export default WorldMapCanvas;
