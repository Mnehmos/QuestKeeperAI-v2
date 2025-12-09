import React from 'react';
import { useUIStore, ActiveTab } from '../../stores/uiStore';

export const NavBar: React.FC = () => {
    const { activeTab, setActiveTab, setPendingCommand } = useUIStore();

    const NavItem = ({ tab, icon, label }: { tab: ActiveTab; icon: string; label: string }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`
        w-full flex items-center gap-3 px-4 py-3 transition-all duration-200
        ${activeTab === tab
                    ? 'bg-terminal-green/10 text-terminal-green border-r-2 border-terminal-green'
                    : 'text-terminal-green/60 hover:text-terminal-green hover:bg-terminal-green/5 border-r-2 border-transparent'}
      `}
            title={label}
        >
            <span className="text-xl">{icon}</span>
            <span className="font-mono text-sm uppercase tracking-wider hidden md:block">{label}</span>
        </button>
    );

    const QuickCommand = ({ command, icon }: { command: string; icon: string }) => (
        <button
            onClick={() => setPendingCommand(command)}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-terminal-green/50 hover:text-terminal-green hover:bg-terminal-green/10 transition-colors text-xs font-mono"
            title={`Insert ${command}`}
        >
            <span className="text-sm">{icon}</span>
            <span className="hidden md:block">{command}</span>
        </button>
    );

    return (
        <nav className="h-full w-16 md:w-64 bg-terminal-black border-r border-terminal-green-dim flex flex-col shrink-0 z-20">
            {/* Logo Area */}
            <div className="p-4 border-b border-terminal-green-dim mb-2 flex items-center justify-center md:justify-start gap-2">
                <span className="text-2xl">⚔️</span>
                <h1 className="font-display font-bold text-terminal-green text-glow hidden md:block tracking-widest">
                    QUEST<br />KEEPER
                </h1>
            </div>

            {/* Navigation Items */}
            <div className="flex-1 flex flex-col gap-1 py-2">
                <NavItem tab="adventure" icon="📜" label="Adventure" />
                <NavItem tab="combat" icon="⚔️" label="Combat" />
                <NavItem tab="character" icon="👤" label="Character" />
                <NavItem tab="map" icon="🗺️" label="World Map" />
                <NavItem tab="journal" icon="📓" label="Journal" />
            </div>

            {/* Quick Commands Divider */}
            <div className="px-4 py-2 border-t border-terminal-green-dim">
                <span className="text-xs text-terminal-green/40 uppercase tracking-widest hidden md:block">Quick Actions</span>
            </div>
            
            {/* Quick Command Buttons */}
            <div className="flex flex-col gap-0.5 px-1 pb-2">
                <QuickCommand command="/character" icon="👤" />
                <QuickCommand command="/inventory" icon="🎒" />
                <QuickCommand command="/roll 1d20" icon="🎲" />
                <QuickCommand command="/quests" icon="📋" />
                <QuickCommand command="/help" icon="❓" />
            </div>

            {/* Bottom Actions */}
            <div className="p-2 border-t border-terminal-green-dim">
                <NavItem tab="settings" icon="⚙️" label="Settings" />
            </div>
        </nav>
    );
};
