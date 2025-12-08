import React, { useState, useEffect, useRef, useCallback } from 'react';
import { mcpManager } from '../../services/mcpClient';
import { llmService } from '../../services/llm/LLMService';
import { useSettingsStore } from '../../stores/settingsStore';

// ============================================
// Types
// ============================================

interface GenerationLog {
  id: number;
  message: string;
  type: 'info' | 'success' | 'lore' | 'error';
  timestamp: number;
}

interface GeneratedPOI {
  type: string;
  name: string;
  x: number;
  y: number;
  location?: { x: number; y: number };
  description?: string;
  score?: number;
}

interface WorldGenerationModalProps {
  isOpen: boolean;
  seed?: string;
  worldName: string;
  onComplete: (worldId: string) => void;
  onCancel: () => void;
}

// ============================================
// Generation Phases
// ============================================

const GENERATION_PHASES = [
  { id: 'init', label: 'Initializing world seed...', duration: 300 },
  { id: 'tectonic', label: 'Tectonic plates shifting...', duration: 500 },
  { id: 'heightmap', label: 'Mountains rising from the depths...', duration: 600 },
  { id: 'climate', label: 'Winds carrying moisture across the land...', duration: 500 },
  { id: 'biomes', label: 'Forests, deserts, and tundras forming...', duration: 600 },
  { id: 'rivers', label: 'Rivers carving through valleys...', duration: 500 },
  { id: 'lakes', label: 'Lakes filling mountain basins...', duration: 400 },
  { id: 'regions', label: 'Ancient kingdoms claiming territory...', duration: 600 },
  { id: 'structures', label: 'Cities rising along trade routes...', duration: 800 },
  { id: 'lore', label: 'Legends being written...', duration: 0 }, // Duration handled by LLM
  { id: 'complete', label: 'World generation complete!', duration: 500 },
];

// ============================================
// Component
// ============================================

export const WorldGenerationModal: React.FC<WorldGenerationModalProps> = ({
  isOpen,
  seed,
  worldName,
  onComplete,
  onCancel,
}) => {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [logs, setLogs] = useState<GenerationLog[]>([]);
  const [progress, setProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const logIdRef = useRef(0);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef(false);
  const hasStartedRef = useRef(false);

  const apiKey = useSettingsStore((s) => s.apiKeys.openrouter);

  // Add log entry
  const addLog = useCallback((message: string, type: GenerationLog['type'] = 'info') => {
    const newLog: GenerationLog = {
      id: logIdRef.current++,
      message,
      type,
      timestamp: Date.now(),
    };
    setLogs((prev) => [...prev.slice(-100), newLog]);
  }, []);

  // Scroll logs to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Context-aware LLM lore generation
  const generatePOILore = useCallback(async (
    poi: GeneratedPOI, 
    existingLore: string[], 
    worldContext: string
  ): Promise<{ name: string; description: string }> => {
    const loreContext = existingLore.length > 0
      ? `\n\nPreviously established lore:\n${existingLore.join('\n')}`
      : '';

    const prompt = `You are generating interconnected lore for a fantasy world called "${worldName}".

World Context: ${worldContext}
${loreContext}

Generate a name and one-sentence description for a ${poi.type.toLowerCase()} at coordinates (${poi.location?.x || poi.x}, ${poi.location?.y || poi.y}).

IMPORTANT: Reference existing locations if any for connected world-building.

Respond in this exact format:
Name: [evocative fantasy name]
Description: [one atmospheric sentence]`;

    try {
      console.log('[WorldGen] Generating lore for:', poi.type);
      const response = await llmService.sendMessage([
        { role: 'user', content: prompt }
      ]);
      
      const nameMatch = response.match(/Name:\s*(.+)/i);
      const descMatch = response.match(/Description:\s*(.+)/i);
      
      return {
        name: nameMatch?.[1]?.trim() || poi.name,
        description: descMatch?.[1]?.trim() || ''
      };
    } catch (e) {
      console.warn('[WorldGen] LLM naming failed:', e);
      return { name: poi.name, description: '' };
    }
  }, [worldName]);

  // Main generation flow
  const runGeneration = useCallback(async () => {
    if (!isOpen || isGenerating || hasStartedRef.current) return;
    
    hasStartedRef.current = true;
    setIsGenerating(true);
    setError(null);
    abortRef.current = false;

    const actualSeed = seed || `world-${Date.now()}`;
    let worldId: string | null = null;
    let structures: GeneratedPOI[] = [];
    
    try {
      // Run visual phases before MCP call
      for (let i = 0; i <= 7; i++) { // Up to 'regions' phase
        if (abortRef.current) return;
        
        const phase = GENERATION_PHASES[i];
        setCurrentPhase(i);
        setProgress(Math.floor((i / 10) * 100));
        addLog(phase.label);
        await new Promise((r) => setTimeout(r, phase.duration));
      }

      // Structures phase - actual MCP call
      setCurrentPhase(8);
      setProgress(75);
      addLog('Cities rising along trade routes...');
      addLog('Calling MCP generate_world...', 'info');
      
      console.log('[WorldGen] Calling generate_world with seed:', actualSeed);
      
      const result = await mcpManager.gameStateClient.callTool('generate_world', {
        seed: actualSeed,
        name: worldName,
        width: 100,
        height: 100,
      });

      console.log('[WorldGen] MCP result:', result);

      const content = result.content?.[0];
      if (content?.type === 'text') {
        const data = JSON.parse(content.text);
        worldId = data.id || data.worldId;
        console.log('[WorldGen] World ID:', worldId);
        
        if (!worldId) {
          throw new Error('No world ID returned from generate_world');
        }
        
        // worldId is used directly in onComplete callback
        addLog(`World created with ID: ${worldId.slice(0, 8)}...`, 'success');
        
        // generate_world only returns structure COUNT, not array
        // Fetch actual structures from get_world_tiles for LLM lore
        const structureCount = data.stats?.structures || 0;
        addLog(`World has ${structureCount} points of interest`, 'success');
        
        if (structureCount > 0) {
          addLog('Fetching structure details...', 'info');
          try {
            const tilesResult = await mcpManager.gameStateClient.callTool('get_world_tiles', {
              worldId: worldId,
            });
            const tilesContent = tilesResult.content?.[0];
            if (tilesContent?.type === 'text') {
              const tilesData = JSON.parse(tilesContent.text);
              structures = tilesData.structures || [];
              console.log('[WorldGen] Fetched structures:', structures.length);
              addLog(`Retrieved ${structures.length} structure details`, 'success');
            }
          } catch (e) {
            console.warn('[WorldGen] Failed to fetch structure details:', e);
            addLog('⚠️ Could not fetch structure details', 'info');
          }
        }
      } else {
        throw new Error('Invalid response from generate_world');
      }

      // LLM Lore Generation Phase
      setCurrentPhase(9);
      setProgress(85);
      
      if (!abortRef.current && structures.length > 0 && apiKey) {
        addLog('The scribes begin recording the legends...', 'lore');
        
        const worldContext = `A newly formed world named "${worldName}" with diverse regions. Settlements favor rivers and coasts.`;
        const accumulatedLore: string[] = [];
        
        // Generate lore for top 5 POIs
        const poisToName = structures.slice(0, 5);
        
        for (let i = 0; i < poisToName.length; i++) {
          if (abortRef.current) break;
          
          const poi = poisToName[i];
          const poiType = poi.type?.toLowerCase() || 'location';
          addLog(`Chronicling the ${poiType}...`, 'info');
          
          try {
            const lore = await generatePOILore(poi, accumulatedLore, worldContext);
            accumulatedLore.push(`- ${lore.name}: ${lore.description}`);
            
            addLog(`📜 ${poi.type || 'Location'}: "${lore.name}"`, 'lore');
            if (lore.description) {
              addLog(`   ${lore.description}`, 'lore');
            }
            
            setProgress(85 + Math.floor((i / poisToName.length) * 10));
          } catch (e) {
            console.warn('[WorldGen] Lore generation failed for POI:', e);
            addLog(`⚠️ Using default name for ${poi.type}`, 'info');
          }
          
          await new Promise((r) => setTimeout(r, 200));
        }
      } else if (!apiKey) {
        addLog('⚠️ No OpenRouter API key - skipping lore generation', 'info');
        addLog('Configure API key in settings for rich world lore', 'info');
      } else if (structures.length === 0) {
        addLog('⚠️ No structures to chronicle', 'info');
      }

      // Complete phase
      setCurrentPhase(10);
      setProgress(100);
      addLog('✨ World generation complete!', 'success');
      addLog(`Your new world "${worldName}" is ready!`, 'success');

      // Call onComplete with the world ID after a brief delay
      if (worldId) {
        console.log('[WorldGen] Completing with worldId:', worldId);
        setTimeout(() => {
          console.log('[WorldGen] Calling onComplete callback');
          onComplete(worldId!);
        }, 1500);
      } else {
        throw new Error('World generation completed but no world ID available');
      }

    } catch (err) {
      console.error('[WorldGen] Generation error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Generation failed';
      setError(errorMsg);
      addLog(`❌ Error: ${errorMsg}`, 'error');
    } finally {
      setIsGenerating(false);
    }
  }, [isOpen, isGenerating, seed, worldName, apiKey, addLog, generatePOILore, onComplete]);

  // Start generation when modal opens
  useEffect(() => {
    if (isOpen && !hasStartedRef.current) {
      runGeneration();
    }
  }, [isOpen, runGeneration]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setCurrentPhase(0);
      setLogs([]);
      setProgress(0);

      setError(null);
      setIsGenerating(false);
      abortRef.current = true;
      hasStartedRef.current = false;
    }
  }, [isOpen]);

  const handleCancel = () => {
    abortRef.current = true;
    onCancel();
  };

  if (!isOpen) return null;

  const currentPhaseLabel = GENERATION_PHASES[currentPhase]?.label || 'Processing...';

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 font-mono">
      <div className="bg-terminal-black border-2 border-terminal-green rounded-lg w-full max-w-2xl mx-4 shadow-[0_0_50px_rgba(0,255,0,0.4)]">
        {/* Header */}
        <div className="border-b border-terminal-green p-4 text-center">
          <h2 className="text-2xl font-bold text-terminal-green animate-pulse">
            🌍 Forging "{worldName}"...
          </h2>
          <p className="text-terminal-green/60 text-sm mt-1">
            Seed: {seed || 'random'}
          </p>
        </div>

        {/* Log Area */}
        <div className="h-64 overflow-y-auto p-4 bg-black/50 border-b border-terminal-green/30">
          {logs.map((log) => (
            <div
              key={log.id}
              className={`text-sm mb-1 ${
                log.type === 'success'
                  ? 'text-green-400'
                  : log.type === 'lore'
                  ? 'text-yellow-400 italic'
                  : log.type === 'error'
                  ? 'text-red-400'
                  : 'text-terminal-green/80'
              }`}
            >
              <span className="text-terminal-green/40 mr-2">&gt;</span>
              {log.message}
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>

        {/* Progress */}
        <div className="p-4 space-y-3">
          <div className="text-center text-terminal-green text-sm">
            {currentPhaseLabel}
          </div>
          
          <div className="h-3 bg-terminal-green/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-terminal-green transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <div className="text-center text-terminal-green/60 text-xs">
            {progress}% complete
          </div>

          {error && (
            <div className="text-center text-red-500 text-sm mt-2">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-terminal-green p-4 flex justify-center">
          <button
            onClick={handleCancel}
            className="px-6 py-2 border border-terminal-green/50 text-terminal-green/70 rounded hover:bg-terminal-green/10 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorldGenerationModal;
