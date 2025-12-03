import React from 'react';

interface WorldEnvironmentOverlayProps {
  worldState: {
    name?: string;
    time?: string;
    date?: string;
    moonPhase?: string;
    weather?: string;
    temperature?: string;
    season?: string;
    hazards?: string[];
  } | null;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  compact?: boolean;
}

export const WorldEnvironmentOverlay: React.FC<WorldEnvironmentOverlayProps> = ({
  worldState,
  position = 'top-right',
  compact = false,
}) => {
  if (!worldState) return null;

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  return (
    <div
      className={`absolute ${positionClasses[position]} z-10 bg-terminal-black/80 backdrop-blur-sm border border-terminal-green p-3 font-mono text-terminal-green text-xs max-w-xs pointer-events-none`}
    >
      {/* World Name */}
      {worldState.name && (
        <div className="font-bold text-terminal-green-bright mb-2 text-sm uppercase tracking-wider">
          🌍 {worldState.name}
        </div>
      )}

      {/* Environment Info */}
      <div className="space-y-1">
        {worldState.time && (
          <div className="flex items-center gap-2">
            <span className="text-terminal-green/60 min-w-16">🕐 Time:</span>
            <span>{worldState.time}</span>
          </div>
        )}

        {worldState.date && (
          <div className="flex items-center gap-2">
            <span className="text-terminal-green/60 min-w-16">📅 Date:</span>
            <span>{worldState.date}</span>
          </div>
        )}

        {worldState.moonPhase && (
          <div className="flex items-center gap-2">
            <span className="text-terminal-green/60 min-w-16">🌙 Moon:</span>
            <span>{worldState.moonPhase}</span>
          </div>
        )}

        {worldState.weather && (
          <div className="flex items-center gap-2">
            <span className="text-terminal-green/60 min-w-16">☁️ Weather:</span>
            <span>{worldState.weather}</span>
          </div>
        )}

        {worldState.temperature && (
          <div className="flex items-center gap-2">
            <span className="text-terminal-green/60 min-w-16">🌡️ Temp:</span>
            <span>{worldState.temperature}</span>
          </div>
        )}

        {worldState.season && (
          <div className="flex items-center gap-2">
            <span className="text-terminal-green/60 min-w-16">🍂 Season:</span>
            <span>{worldState.season}</span>
          </div>
        )}

        {worldState.hazards && Array.isArray(worldState.hazards) && worldState.hazards.length > 0 && (
          <div className="mt-2 pt-2 border-t border-terminal-green/30">
            <div className="text-red-500 font-bold mb-1">⚠️ Hazards:</div>
            <div className="space-y-0.5">
              {worldState.hazards.map((hazard, i) => (
                <div key={i} className="text-red-400 text-xs">• {hazard}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
