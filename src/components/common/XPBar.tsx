import React from 'react';

interface XPBarProps {
  current: number;
  max: number;
  level: number;
  className?: string;
  showLabels?: boolean;
}

export const XPBar: React.FC<XPBarProps> = ({ current, max, level, className = '', showLabels = true }) => {
  const percentage = Math.min(100, Math.max(0, (current / max) * 100));

  return (
    <div className={`w-full ${className}`}>
      {showLabels && (
        <div className="flex justify-between items-end mb-1 text-xs">
          <span className="text-terminal-green/60 uppercase tracking-wider font-bold">Experience</span>
          <div className="flex gap-2">
            <span className="text-terminal-green font-mono">{current}</span>
            <span className="text-terminal-green/40">/</span>
            <span className="text-terminal-green/60 font-mono">{max}</span>
            <span className="text-terminal-green/40 ml-1">XP</span>
          </div>
        </div>
      )}
      
      <div className="relative h-2 bg-terminal-green/10 border border-terminal-green/30 rounded-sm overflow-hidden">
        {/* Background Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'linear-gradient(90deg, transparent 95%, currentColor 95%)',
            backgroundSize: '10% 100%',
            color: 'rgb(34 197 94)' // terminal-green
          }}
        />
        
        {/* Progress Fill */}
        <div 
          className="h-full bg-terminal-green transition-all duration-500 ease-out shadow-[0_0_10px_rgba(34,197,94,0.5)]"
          style={{ width: `${percentage}%` }}
        >
          {/* Shimmer Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full -translate-x-full animate-[shimmer_2s_infinite]" />
        </div>
      </div>
      
      {showLabels && (
        <div className="mt-1 flex justify-between text-[10px] text-terminal-green/40 font-mono">
          <span>LVL {level}</span>
          <span>NEXT: LVL {level + 1}</span>
        </div>
      )}
    </div>
  );
};
