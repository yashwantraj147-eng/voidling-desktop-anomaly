import React, { useState, useEffect } from 'react';
import { 
  Minimize2, 
  Square, 
  X, 
  Pin, 
  Volume2, 
  VolumeX, 
  Radio, 
  Terminal, 
  EyeOff, 
  Coins, 
  Sparkles,
  Maximize2
} from 'lucide-react';
import { VoidlingState } from '../types';
import { sound } from '../audio/soundEngine';
import { STAGE_TITLES } from '../state/gameData';

interface TitleBarProps {
  state: VoidlingState;
  onToggleBossMode: () => void;
  onToggleCompactMode: () => void;
  onToggleConsole: () => void;
  onStateUpdate: (updater: (prev: VoidlingState) => VoidlingState) => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  state,
  onToggleBossMode,
  onToggleCompactMode,
  onToggleConsole,
  onStateUpdate,
}) => {
  const [isMuted, setIsMuted] = useState(sound.getIsMuted());
  const [isMusicPlaying, setIsMusicPlaying] = useState(sound.getIsAmbientPlaying());
  const [isPinned, setIsPinned] = useState(state.isAlwaysOnTop);

  const desktop = (window as any).desktopAPI;

  const handleMinimize = () => {
    if (desktop?.minimizeWindow) desktop.minimizeWindow();
  };

  const handleMaximize = () => {
    if (desktop?.maximizeWindow) desktop.maximizeWindow();
  };

  const handleClose = () => {
    if (desktop?.closeWindow) desktop.closeWindow();
  };

  const handleTogglePin = async () => {
    const nextPin = !isPinned;
    setIsPinned(nextPin);
    if (desktop?.setAlwaysOnTop) {
      await desktop.setAlwaysOnTop(nextPin);
    }
    onStateUpdate(prev => ({ ...prev, isAlwaysOnTop: nextPin }));
    sound.playHackChirp();
  };

  const handleToggleMute = () => {
    const nextMute = sound.toggleMute();
    setIsMuted(nextMute);
  };

  const handleToggleMusic = () => {
    const playing = sound.toggleAmbientMusic();
    setIsMusicPlaying(playing);
  };

  return (
    <header className="titlebar-drag-region h-11 w-full flex items-center justify-between px-3 bg-[#07090f]/95 border-b border-[#00f3ff]/20 select-none z-50">
      {/* Left: App Branding & Status */}
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 rounded-full bg-[#00f3ff]/15 border border-[#00f3ff] flex items-center justify-center animate-pulse-glow">
          <div className="w-2 h-2 rounded-full bg-[#00f3ff]" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-['Orbitron'] font-bold text-xs tracking-wider text-[#00f3ff] glow-cyan">
            VOIDLING
          </span>
          <span className="text-[10px] tracking-widest text-slate-400 font-mono hidden sm:inline">
            // CONTAINMENT PROTOCOL v1.0.4
          </span>
        </div>

        {!state.isCompactMode && (
          <div className="hidden md:flex items-center gap-2 ml-4">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#00f3ff]/10 text-[#00f3ff] border border-[#00f3ff]/30">
              {STAGE_TITLES[state.stage]} (LVL {state.level})
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-purple-950/40 text-purple-300 border border-purple-500/30">
              MOOD: {state.mood.toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Middle: Currency Pill */}
      <div className="no-drag flex items-center gap-2">
        <div 
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/40 text-amber-400 font-mono text-xs cursor-pointer hover:bg-amber-500/20 transition-colors"
          title="Xenon Credits (Earn by petting, mini-games, and hacking)"
        >
          <Coins className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span className="font-bold">{state.xenon}</span>
          <span className="text-[10px] text-amber-400/70">XE</span>
        </div>

        <div 
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 font-mono text-xs"
          title="Cosmic Matter"
        >
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>{state.cosmicMatter}</span>
          <span className="text-[10px] text-cyan-400/70">CM</span>
        </div>
      </div>

      {/* Right: Quick Tools & Window Controls */}
      <div className="no-drag flex items-center gap-1">
        {/* Ambient Cosmic Synth Music Toggle */}
        <button
          onClick={handleToggleMusic}
          className={`p-1.5 rounded transition-colors text-xs ${
            isMusicPlaying 
              ? 'text-cyan-300 bg-cyan-500/20 border border-cyan-500/50' 
              : 'text-slate-400 hover:text-white hover:bg-white/10'
          }`}
          title={isMusicPlaying ? 'Stop Cosmic Ambient Music' : 'Play Cosmic Ambient Drone'}
        >
          <Radio className={`w-3.5 h-3.5 ${isMusicPlaying ? 'animate-spin' : ''}`} />
        </button>

        {/* SFX Mute Toggle */}
        <button
          onClick={handleToggleMute}
          className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          title={isMuted ? 'Unmute SFX' : 'Mute SFX'}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>

        {/* Developer / Secret Console Toggle */}
        <button
          onClick={onToggleConsole}
          className="p-1.5 rounded text-slate-400 hover:text-[#00f3ff] hover:bg-[#00f3ff]/10 transition-colors"
          title="Secret Terminal (Cheats & Easter Eggs)"
        >
          <Terminal className="w-3.5 h-3.5" />
        </button>

        {/* Boss Key / Panic Camouflage */}
        <button
          onClick={onToggleBossMode}
          className="p-1.5 rounded text-amber-400 hover:bg-amber-500/20 transition-colors border border-amber-500/30"
          title="Boss Disguise Key (Ctrl+Shift+B / Esc)"
        >
          <EyeOff className="w-3.5 h-3.5" />
        </button>

        {/* Compact Widget / Companion Mode Toggle */}
        <button
          onClick={onToggleCompactMode}
          className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          title={state.isCompactMode ? 'Expand to Command Center' : 'Switch to Compact Companion Widget'}
        >
          {state.isCompactMode ? <Maximize2 className="w-3.5 h-3.5 text-[#00f3ff]" /> : <Minimize2 className="w-3.5 h-3.5" />}
        </button>

        {/* Always on top pin */}
        <button
          onClick={handleTogglePin}
          className={`p-1.5 rounded transition-colors ${
            isPinned 
              ? 'text-cyan-300 bg-cyan-500/20 border border-cyan-500/50' 
              : 'text-slate-400 hover:text-white hover:bg-white/10'
          }`}
          title={isPinned ? 'Unpin from Top' : 'Pin Always on Top'}
        >
          <Pin className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-4 bg-slate-700/60 mx-1" />

        {/* Native Windows Window Controls */}
        <button
          onClick={handleMinimize}
          className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Minimize"
        >
          <span className="block w-2.5 h-[2px] bg-current" />
        </button>

        <button
          onClick={handleMaximize}
          className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Maximize"
        >
          <Square className="w-2.5 h-2.5" />
        </button>

        <button
          onClick={handleClose}
          className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-red-500/80 transition-colors"
          title="Close"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </header>
  );
};
