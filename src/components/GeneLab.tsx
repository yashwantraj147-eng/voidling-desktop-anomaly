import React, { useState } from 'react';
import { VoidlingState, MutationNode } from '../types';
import { MUTATION_TREE, STAGE_TITLES, STAGE_XP_THRESHOLDS } from '../state/gameData';
import { sound } from '../audio/soundEngine';
import confetti from 'canvas-confetti';
import { Dna, Sparkles, Check, Lock, Palette, Edit3, ArrowUpCircle } from 'lucide-react';

interface GeneLabProps {
  state: VoidlingState;
  onStateUpdate: (updater: (prev: VoidlingState) => VoidlingState) => void;
}

export const GeneLab: React.FC<GeneLabProps> = ({
  state,
  onStateUpdate,
}) => {
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(state.name);

  const handleUnlockMutation = (mutation: MutationNode) => {
    if (state.activeMutations.includes(mutation.id)) return;
    if (state.xenon < mutation.cost) {
      sound.playHackFail();
      return;
    }
    if (state.stage < mutation.requiredStage) {
      sound.playHackFail();
      return;
    }

    // Verify prerequisites
    const missingPre = mutation.prerequisites.some(preId => !state.activeMutations.includes(preId));
    if (missingPre) {
      sound.playHackFail();
      return;
    }

    // Unlock!
    sound.playLevelUp();
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch (e) {}

    onStateUpdate(prev => ({
      ...prev,
      xenon: prev.xenon - mutation.cost,
      activeMutations: [...prev.activeMutations, mutation.id],
      speechBubble: `GENETIC SPLICING SUCCESSFUL: ${mutation.name} integrated!`,
      speechBubbleTimeout: 4000,
    }));
  };

  const handleSelectTheme = (theme: string) => {
    sound.playHackChirp();
    onStateUpdate(prev => ({ ...prev, colorTheme: theme }));
  };

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      sound.playHackSuccess();
      onStateUpdate(prev => ({ ...prev, name: newName.trim() }));
      setEditingName(false);
    }
  };

  const themes = [
    { id: 'cyan', name: 'Cyber Cyan', bg: '#00f3ff' },
    { id: 'magenta', name: 'Neon Magenta', bg: '#ff007f' },
    { id: 'green', name: 'Toxic Emerald', bg: '#00ff88' },
    { id: 'amber', name: 'Solar Amber', bg: '#ffb800' },
    { id: 'purple', name: 'Void Violet', bg: '#a855f7' },
  ];

  return (
    <div className="p-6 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold font-['Orbitron'] text-purple-400 glow-magenta flex items-center gap-2">
            <Dna className="w-5 h-5 text-purple-400" />
            GENOME SPLICER & MUTATION MATRIX
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Splice exotic DNA strands to evolve physical traits, passive buffs, and transcendent abilities.
          </p>
        </div>

        {/* Name Editor */}
        <div className="flex items-center gap-3">
          {editingName ? (
            <form onSubmit={handleSaveName} className="flex items-center gap-2">
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                maxLength={18}
                className="bg-black/60 border border-cyan-400 px-3 py-1 text-sm font-mono text-cyan-300 rounded outline-none focus:ring-1 focus:ring-cyan-400"
                autoFocus
              />
              <button type="submit" className="cyber-button text-xs py-1 px-3">
                SAVE
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-['Orbitron'] font-bold text-base text-slate-200">
                {state.name}
              </span>
              <button
                onClick={() => setEditingName(true)}
                className="p-1 text-slate-400 hover:text-cyan-400 transition-colors"
                title="Rename Organism"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Evolution Stage & XP Progress Card */}
      <div className="cyber-panel p-5 rounded-xl mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500 flex items-center justify-center">
              <ArrowUpCircle className="w-6 h-6 text-purple-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase text-purple-400">
                  CURRENT EVOLUTION STAGE
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
                  STAGE {state.stage} / 5
                </span>
              </div>
              <h3 className="font-['Orbitron'] font-bold text-lg text-slate-100">
                {STAGE_TITLES[state.stage]}
              </h3>
            </div>
          </div>

          <div className="text-right font-mono text-xs text-slate-400">
            <span>XP: </span>
            <span className="text-purple-400 font-bold">{state.xp}</span>
            <span> / {state.maxXp}</span>
          </div>
        </div>

        {/* XP Bar */}
        <div className="cyber-meter-track h-3 bg-purple-950/40 border border-purple-500/30">
          <div
            className="cyber-meter-fill bg-gradient-to-r from-purple-500 to-cyan-400"
            style={{ width: `${Math.min(100, (state.xp / state.maxXp) * 100)}%` }}
          />
        </div>
      </div>

      {/* Color Spectrum Theme Selector */}
      <div className="cyber-panel p-4 rounded-xl mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Palette className="w-4 h-4 text-cyan-400" />
          <h4 className="font-['Orbitron'] text-xs font-bold text-slate-200 uppercase tracking-wider">
            ORGANISM CHROMATIC PIGMENTATION
          </h4>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {themes.map(t => (
            <button
              key={t.id}
              onClick={() => handleSelectTheme(t.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${
                state.colorTheme === t.id
                  ? 'border-white bg-white/20 shadow-[0_0_12px_rgba(255,255,255,0.4)]'
                  : 'border-slate-700 bg-black/40 hover:bg-white/5'
              }`}
            >
              <span
                className="w-3 h-3 rounded-full border border-white/40"
                style={{ backgroundColor: t.bg }}
              />
              <span className="text-slate-200">{t.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Genetic Mutation Nodes Grid */}
      <h3 className="font-['Orbitron'] text-sm font-bold text-cyan-400 mb-3 flex items-center gap-2">
        <Sparkles className="w-4 h-4" />
        AVAILABLE DNA MUTATIONS
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MUTATION_TREE.map(node => {
          const isUnlocked = state.activeMutations.includes(node.id);
          const stageMet = state.stage >= node.requiredStage;
          const preMet = node.prerequisites.every(p => state.activeMutations.includes(p));
          const canAfford = state.xenon >= node.cost;
          const isAvailable = stageMet && preMet && !isUnlocked;

          return (
            <div
              key={node.id}
              className={`cyber-panel p-4 rounded-xl transition-all ${
                isUnlocked
                  ? 'border-emerald-500/50 bg-emerald-950/10'
                  : isAvailable
                  ? 'border-purple-500/40 hover:border-purple-400'
                  : 'opacity-50 border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{node.icon}</span>
                  <div>
                    <h4 className="font-['Orbitron'] font-bold text-sm text-slate-100">
                      {node.name}
                    </h4>
                    <span className="text-[11px] font-mono text-purple-400">
                      Req: Stage {node.requiredStage} ({STAGE_TITLES[node.requiredStage]})
                    </span>
                  </div>
                </div>

                {isUnlocked ? (
                  <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/40">
                    <Check className="w-3 h-3" /> ACTIVE
                  </span>
                ) : (
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {node.cost} XE
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-300 mb-2">{node.description}</p>

              <div className="bg-black/50 p-2 rounded-lg border border-slate-800 text-[11px] font-mono mb-3 space-y-1">
                <div className="text-cyan-300">
                  <span className="text-slate-500">VISUAL: </span>
                  {node.visualEffect}
                </div>
                <div className="text-emerald-400">
                  <span className="text-slate-500">PASSIVE: </span>
                  {node.passiveBonus}
                </div>
              </div>

              {!isUnlocked && (
                <button
                  onClick={() => handleUnlockMutation(node)}
                  disabled={!isAvailable || !canAfford}
                  className={`cyber-button w-full text-xs font-bold py-1.5 ${
                    isAvailable && canAfford
                      ? 'cyber-button-magenta'
                      : 'opacity-40 cursor-not-allowed'
                  }`}
                >
                  {!stageMet ? (
                    <span className="flex items-center gap-1.5">
                      <Lock className="w-3 h-3" /> REQUIRES STAGE {node.requiredStage}
                    </span>
                  ) : !preMet ? (
                    <span className="flex items-center gap-1.5">
                      <Lock className="w-3 h-3" /> MISSING PREREQUISITES
                    </span>
                  ) : !canAfford ? (
                    'INSUFFICIENT XENON'
                  ) : (
                    'SPLICE MUTATION'
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
