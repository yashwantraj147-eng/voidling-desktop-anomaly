import React from 'react';
import { FoodItem, VoidlingState } from '../types';
import { FOOD_ITEMS } from '../state/gameData';
import { sound } from '../audio/soundEngine';
import { Utensils, Zap, Sparkles, AlertTriangle, ShieldCheck } from 'lucide-react';

interface FeedingBayProps {
  state: VoidlingState;
  onSelectFood: (item: FoodItem) => void;
  onStateUpdate: (updater: (prev: VoidlingState) => VoidlingState) => void;
}

export const FeedingBay: React.FC<FeedingBayProps> = ({
  state,
  onSelectFood,
  onStateUpdate,
}) => {
  const handleFeed = (item: FoodItem) => {
    if (state.xenon < item.cost) {
      sound.playHackFail();
      return;
    }

    // Deduct cost and trigger food drop
    onStateUpdate(prev => ({
      ...prev,
      xenon: prev.xenon - item.cost,
    }));

    sound.playHackChirp();
    onSelectFood(item);
  };

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold font-['Orbitron'] text-cyan-400 glow-cyan flex items-center gap-2">
            <Utensils className="w-5 h-5 text-cyan-400" />
            MATTER SYNTHESIZER & FEEDING CHAMBER
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Synthesize high-energy anomalous matter to nourish, energize, and mutate your Voidling organism.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-sm">
          <span>AVAILABLE XENON:</span>
          <span className="font-bold text-base">{state.xenon} XE</span>
        </div>
      </div>

      {/* Grid of Food Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {FOOD_ITEMS.map(item => {
          const canAfford = state.xenon >= item.cost;

          return (
            <div
              key={item.id}
              className="cyber-panel p-4 rounded-xl flex flex-col justify-between hover:border-cyan-400/50 transition-all duration-200"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl filter drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">
                      {item.icon}
                    </span>
                    <div>
                      <h3 className="font-bold font-['Orbitron'] text-sm text-slate-100">
                        {item.name}
                      </h3>
                      <span className="text-xs font-mono text-cyan-400 font-bold">
                        {item.cost} XENON
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  {item.description}
                </p>

                {/* Nutritional Stats */}
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono mb-4 bg-black/40 p-2.5 rounded-lg border border-slate-800">
                  <div className="flex items-center gap-1.5 text-cyan-300">
                    <Utensils className="w-3 h-3" />
                    <span>+{item.satietyGain} Satiety</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-amber-300">
                    <Zap className="w-3 h-3" />
                    <span>+{item.energyGain} Energy</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-purple-300">
                    <Sparkles className="w-3 h-3" />
                    <span>+{item.xpGain} XP</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-rose-300">
                    {item.corruptionDelta >= 0 ? (
                      <AlertTriangle className="w-3 h-3" />
                    ) : (
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    )}
                    <span>
                      {item.corruptionDelta >= 0 ? `+${item.corruptionDelta}` : item.corruptionDelta} Corrupt
                    </span>
                  </div>
                </div>
              </div>

              {/* Synthesize Button */}
              <button
                onClick={() => handleFeed(item)}
                disabled={!canAfford}
                className={`cyber-button w-full text-xs font-bold py-2 ${
                  canAfford
                    ? 'hover:bg-cyan-500/20'
                    : 'opacity-40 cursor-not-allowed'
                }`}
              >
                {canAfford ? 'SYNTHESIZE & DROP' : 'INSUFFICIENT XENON'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
