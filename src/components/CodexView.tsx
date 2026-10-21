import React, { useState } from 'react';
import { VoidlingState, CodexArtifact } from '../types';
import { CODEX_ARTIFACTS } from '../state/gameData';
import { sound } from '../audio/soundEngine';
import { BookOpen, Lock, Sparkles, Trophy, Clock, Zap, CheckCircle2 } from 'lucide-react';

interface CodexViewProps {
  state: VoidlingState;
}

export const CodexView: React.FC<CodexViewProps> = ({ state }) => {
  const [selectedArtifact, setSelectedArtifact] = useState<CodexArtifact>(CODEX_ARTIFACTS[0]);

  const unlockedCount = CODEX_ARTIFACTS.filter(a => state.unlockedArtifacts.includes(a.id)).length;

  const handleSelect = (art: CodexArtifact) => {
    sound.playHackChirp();
    setSelectedArtifact(art);
  };

  const rarityColors: Record<string, { border: string; text: string; bg: string }> = {
    Common: { border: 'border-slate-600', text: 'text-slate-300', bg: 'bg-slate-800/40' },
    Rare: { border: 'border-cyan-500', text: 'text-cyan-300', bg: 'bg-cyan-950/40' },
    Mythic: { border: 'border-purple-500', text: 'text-purple-300', bg: 'bg-purple-950/40' },
    Transcendent: { border: 'border-amber-500', text: 'text-amber-300', bg: 'bg-amber-950/40' },
  };

  return (
    <div className="p-6 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold font-['Orbitron'] text-amber-400 glow-amber flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            ANOMALY CODEX & COSMIC RELIQUARY
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Archived research entries, forgotten artifacts, and anomalies recovered from the depths of cyberspace.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs">
            DISCOVERIES: <span className="font-bold text-sm text-amber-400">{unlockedCount} / {CODEX_ARTIFACTS.length}</span>
          </div>
        </div>
      </div>

      {/* Lifetime Statistics Ribbon */}
      <div className="cyber-panel p-4 rounded-xl mb-6 grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
        <div className="p-2 rounded bg-black/40 border border-slate-800">
          <span className="block text-[10px] font-mono text-slate-500 uppercase">Total Pets</span>
          <span className="font-['Orbitron'] font-bold text-base text-cyan-400">{state.stats.totalClicks}</span>
        </div>
        <div className="p-2 rounded bg-black/40 border border-slate-800">
          <span className="block text-[10px] font-mono text-slate-500 uppercase">Food Consumed</span>
          <span className="font-['Orbitron'] font-bold text-base text-emerald-400">{state.stats.foodEaten}</span>
        </div>
        <div className="p-2 rounded bg-black/40 border border-slate-800">
          <span className="block text-[10px] font-mono text-slate-500 uppercase">Nodes Breached</span>
          <span className="font-['Orbitron'] font-bold text-base text-purple-400">{state.stats.hackedNodes}</span>
        </div>
        <div className="p-2 rounded bg-black/40 border border-slate-800">
          <span className="block text-[10px] font-mono text-slate-500 uppercase">Bugs Banished</span>
          <span className="font-['Orbitron'] font-bold text-base text-rose-400">{state.stats.invadersBanished}</span>
        </div>
        <div className="p-2 rounded bg-black/40 border border-slate-800">
          <span className="block text-[10px] font-mono text-slate-500 uppercase">Secrets Found</span>
          <span className="font-['Orbitron'] font-bold text-base text-amber-400">{state.stats.secretsFound}</span>
        </div>
      </div>

      {/* Codex Grid & Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Artifact List */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CODEX_ARTIFACTS.map(art => {
            const isUnlocked = state.unlockedArtifacts.includes(art.id);
            const isSelected = selectedArtifact.id === art.id;
            const rStyle = rarityColors[art.rarity] || rarityColors.Common;

            return (
              <div
                key={art.id}
                onClick={() => handleSelect(art)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-amber-400 bg-amber-500/10 shadow-[0_0_15px_rgba(251,191,36,0.25)]'
                    : isUnlocked
                    ? 'border-slate-700 bg-slate-900/60 hover:border-slate-500'
                    : 'border-slate-800 bg-black/50 opacity-60 hover:opacity-80'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {isUnlocked ? (
                      <Sparkles className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Lock className="w-4 h-4 text-slate-600" />
                    )}
                    <h4 className="font-['Orbitron'] font-bold text-xs text-slate-200">
                      {isUnlocked ? art.title : '??? ENCRYPTED RELIC ???'}
                    </h4>
                  </div>

                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${rStyle.border} ${rStyle.text} ${rStyle.bg}`}>
                    {art.rarity}
                  </span>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2">
                  {isUnlocked ? art.description : `Unlock: ${art.unlockRequirement}`}
                </p>
              </div>
            );
          })}
        </div>

        {/* Selected Artifact Inspection Dossier */}
        <div className="cyber-panel p-5 rounded-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <span className="text-xs font-mono text-slate-400 uppercase">
                RESEARCH DOSSIER
              </span>
              <span className="text-xs font-mono text-amber-400 font-bold">
                {selectedArtifact.category}
              </span>
            </div>

            {state.unlockedArtifacts.includes(selectedArtifact.id) ? (
              <>
                <h3 className="font-['Orbitron'] text-lg font-bold text-slate-100 mb-2">
                  {selectedArtifact.title}
                </h3>

                <div className="p-3 rounded-lg bg-black/50 border border-slate-800 mb-4">
                  <span className="text-[11px] font-mono text-slate-400 block mb-1 uppercase font-bold">
                    Physical Description:
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {selectedArtifact.description}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-black/50 border border-slate-800 mb-4">
                  <span className="text-[11px] font-mono text-amber-400 block mb-1 uppercase font-bold">
                    Classified Lore:
                  </span>
                  <p className="text-xs text-slate-300 italic leading-relaxed">
                    "{selectedArtifact.lore}"
                  </p>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-mono">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>PERK: {selectedArtifact.bonusText}</span>
                </div>
              </>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <Lock className="w-12 h-12 text-slate-600 mb-3" />
                <h4 className="font-['Orbitron'] font-bold text-slate-300 text-sm mb-2">
                  DATA STREAM ENCRYPTED
                </h4>
                <p className="text-xs text-slate-500 font-mono max-w-xs leading-relaxed">
                  Requirement to Decrypt:
                </p>
                <div className="mt-3 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs">
                  {selectedArtifact.unlockRequirement}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
