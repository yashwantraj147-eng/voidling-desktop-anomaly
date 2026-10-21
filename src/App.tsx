import React, { useState, useEffect, useCallback } from 'react';
import { VoidlingState, ActiveTab, FoodItem } from './types';
import { INITIAL_STATE, PROCEDURAL_SPEECH } from './state/gameData';
import { loadSavedState, saveStateToStorage, checkArtifactUnlocks } from './state/storage';
import { sound } from './audio/soundEngine';
import { TitleBar } from './components/TitleBar';
import { Terrarium } from './components/Terrarium';
import { FeedingBay } from './components/FeedingBay';
import { GeneLab } from './components/GeneLab';
import { HackTerminal } from './components/HackTerminal';
import { VoidInvaders } from './components/VoidInvaders';
import { CodexView } from './components/CodexView';
import { SecretConsole } from './components/SecretConsole';
import { BossScreen } from './components/BossScreen';
import { SettingsModal } from './components/SettingsModal';
import { 
  Atom, 
  Utensils, 
  Dna, 
  Terminal, 
  Shield, 
  BookOpen, 
  Settings, 
  Sparkles 
} from 'lucide-react';

export const App: React.FC = () => {
  const [state, setState] = useState<VoidlingState>(loadSavedState);
  const [activeTab, setActiveTab] = useState<ActiveTab>('terrarium');
  const [foodToDrop, setFoodToDrop] = useState<FoodItem | null>(null);

  // Modals
  const [showConsole, setShowConsole] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const desktop = (window as any).desktopAPI;

  // Auto-save state to storage
  useEffect(() => {
    saveStateToStorage(state);
  }, [state]);

  // Periodic life loop (Vitality decay, passive XP, random speech)
  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => {
        // Vitality decay
        const newSatiety = Math.max(0, prev.satiety - 0.25);
        const newEnergy = Math.max(0, prev.energy - 0.15);

        // Passive XP from Hyperspectral Pupil mutation
        let newXp = prev.xp;
        if (prev.activeMutations.includes('mut_photonic_eye')) {
          newXp += 1;
        }

        // Mood evaluation based on vitals
        let newMood = prev.mood;
        if (newSatiety < 20) newMood = 'hungry';
        else if (newEnergy < 20) newMood = 'sleeping';
        else if (prev.corruption > 60) newMood = 'glitched';
        else if (newSatiety > 80 && newEnergy > 70) newMood = 'ecstatic';
        else newMood = 'curious';

        // Check desktop notification if starving
        if (newSatiety <= 10 && prev.satiety > 10 && desktop?.sendNotification) {
          desktop.sendNotification(
            'VOIDLING ALERT: Critical Satiety',
            `${prev.name} is starving! Please synthesize some RAM or Quantum Glitch pops!`
          );
        }

        return {
          ...prev,
          satiety: newSatiety,
          energy: newEnergy,
          xp: newXp,
          mood: newMood,
          stats: {
            ...prev.stats,
            playtimeSeconds: prev.stats.playtimeSeconds + 2,
          },
        };
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [desktop]);

  // Random speech bubble generator
  useEffect(() => {
    const speechInterval = setInterval(() => {
      setState(prev => {
        if (Math.random() > 0.4) {
          const quote = PROCEDURAL_SPEECH[Math.floor(Math.random() * PROCEDURAL_SPEECH.length)];
          return {
            ...prev,
            speechBubble: quote,
            speechBubbleTimeout: 6000,
          };
        }
        return prev;
      });
    }, 28000);

    return () => clearInterval(speechInterval);
  }, []);

  // Check Artifact unlocks dynamically
  useEffect(() => {
    setState(prev => {
      const updatedArtifacts = checkArtifactUnlocks(prev, artifact => {
        sound.playUnlock();
        if (desktop?.sendNotification) {
          desktop.sendNotification(
            'ARTIFACT DISCOVERED!',
            `You unlocked "${artifact.title}" in the Anomaly Codex!`
          );
        }
      });
      if (updatedArtifacts.length !== prev.unlockedArtifacts.length) {
        return { ...prev, unlockedArtifacts: updatedArtifacts };
      }
      return prev;
    });
  }, [state.stats, state.stage, state.isDisguised, desktop]);

  // Listen for Global Boss Key from Electron
  useEffect(() => {
    if (desktop?.onBossKeyTriggered) {
      const cleanup = desktop.onBossKeyTriggered(() => {
        setState(prev => ({ ...prev, isDisguised: !prev.isDisguised }));
      });
      return cleanup;
    }
  }, [desktop]);

  // Keyboard shortcut listener for Boss Key (Ctrl+Shift+B)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === 'KeyB') {
        setState(prev => ({ ...prev, isDisguised: !prev.isDisguised }));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Petting interaction handler
  const handlePet = useCallback(() => {
    setState(prev => {
      const bonusXenon = prev.activeMutations.includes('mut_bioluminescence') ? 3 : 1;
      return {
        ...prev,
        xenon: prev.xenon + bonusXenon,
        xp: prev.xp + 5,
        resonance: Math.min(100, prev.resonance + 4),
        mood: 'ecstatic',
        stats: {
          ...prev.stats,
          totalClicks: prev.stats.totalClicks + 1,
        },
      };
    });
  }, []);

  // Toggle Compact Mode
  const handleToggleCompactMode = async () => {
    const nextCompact = !state.isCompactMode;
    if (desktop?.setCompactMode) {
      await desktop.setCompactMode(nextCompact);
    }
    setState(prev => ({ ...prev, isCompactMode: nextCompact }));
    sound.playHackChirp();
  };

  // Reset Game Data
  const handleResetGame = () => {
    setState({ ...INITIAL_STATE });
    localStorage.removeItem('voidling_save_v1');
    sound.playLevelUp();
  };

  // If in Boss Disguise Mode, render Windows Diagnostic Screen
  if (state.isDisguised) {
    return <BossScreen onExit={() => setState(prev => ({ ...prev, isDisguised: false }))} />;
  }

  return (
    <div className="w-screen h-screen flex flex-col cyber-bg overflow-hidden relative">
      <div className="absolute inset-0 scanlines z-40 pointer-events-none" />

      {/* Windows 11 Frameless Titlebar */}
      <TitleBar
        state={state}
        onToggleBossMode={() => setState(prev => ({ ...prev, isDisguised: true }))}
        onToggleCompactMode={handleToggleCompactMode}
        onToggleConsole={() => setShowConsole(prev => !prev)}
        onStateUpdate={setState}
      />

      {/* Main Body Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar (Hidden in Compact Mode) */}
        {!state.isCompactMode && (
          <aside className="w-56 bg-[#07090f]/90 border-r border-[#00f3ff]/20 flex flex-col justify-between p-3 select-none z-30">
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block px-3 py-1">
                CONTAINMENT MODULES
              </span>

              {/* Terrarium */}
              <button
                onClick={() => { setActiveTab('terrarium'); sound.playHackChirp(); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  activeTab === 'terrarium'
                    ? 'bg-[#00f3ff]/20 text-[#00f3ff] border border-[#00f3ff]/50 shadow-[0_0_12px_rgba(0,243,255,0.3)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Atom className="w-4 h-4 text-[#00f3ff]" />
                <span>TERRARIUM CORE</span>
              </button>

              {/* Synthesizer */}
              <button
                onClick={() => { setActiveTab('feed'); sound.playHackChirp(); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  activeTab === 'feed'
                    ? 'bg-[#00f3ff]/20 text-[#00f3ff] border border-[#00f3ff]/50 shadow-[0_0_12px_rgba(0,243,255,0.3)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Utensils className="w-4 h-4 text-cyan-400" />
                <span>FEEDING BAY</span>
              </button>

              {/* Genome Splicer */}
              <button
                onClick={() => { setActiveTab('splicer'); sound.playHackChirp(); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  activeTab === 'splicer'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Dna className="w-4 h-4 text-purple-400" />
                <span>GENOME SPLICER</span>
              </button>

              {/* Cyberdeck Hack Terminal */}
              <button
                onClick={() => { setActiveTab('terminal'); sound.playHackChirp(); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  activeTab === 'terminal'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(0,243,255,0.3)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span>CYBERDECK HACK</span>
              </button>

              {/* Quantum Defense */}
              <button
                onClick={() => { setActiveTab('defense'); sound.playHackChirp(); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  activeTab === 'defense'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>QUANTUM DEFENSE</span>
              </button>

              {/* Anomaly Codex */}
              <button
                onClick={() => { setActiveTab('codex'); sound.playHackChirp(); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  activeTab === 'codex'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>ANOMALY CODEX</span>
              </button>
            </div>

            {/* Bottom: Settings button */}
            <div className="pt-3 border-t border-slate-800">
              <button
                onClick={() => { setShowSettings(true); sound.playHackChirp(); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-mono text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>SYSTEM SETTINGS</span>
              </button>
            </div>
          </aside>
        )}

        {/* Viewport Content Area */}
        <main className="flex-1 h-full overflow-hidden relative">
          {activeTab === 'terrarium' || state.isCompactMode ? (
            <Terrarium
              state={state}
              onPet={handlePet}
              onFeedItem={foodToDrop}
              onClearFeedItem={() => setFoodToDrop(null)}
              onStateUpdate={setState}
            />
          ) : activeTab === 'feed' ? (
            <FeedingBay
              state={state}
              onSelectFood={item => {
                setFoodToDrop(item);
                setActiveTab('terrarium');
              }}
              onStateUpdate={setState}
            />
          ) : activeTab === 'splicer' ? (
            <GeneLab
              state={state}
              onStateUpdate={setState}
            />
          ) : activeTab === 'terminal' ? (
            <HackTerminal
              state={state}
              onStateUpdate={setState}
            />
          ) : activeTab === 'defense' ? (
            <VoidInvaders
              state={state}
              onStateUpdate={setState}
            />
          ) : activeTab === 'codex' ? (
            <CodexView state={state} />
          ) : null}
        </main>
      </div>

      {/* Secret Developer / Hacker Console Modal */}
      {showConsole && (
        <SecretConsole
          state={state}
          onClose={() => setShowConsole(false)}
          onStateUpdate={setState}
        />
      )}

      {/* System Settings Modal */}
      {showSettings && (
        <SettingsModal
          state={state}
          onClose={() => setShowSettings(false)}
          onStateUpdate={setState}
          onResetGame={handleResetGame}
        />
      )}
    </div>
  );
};
export default App;
