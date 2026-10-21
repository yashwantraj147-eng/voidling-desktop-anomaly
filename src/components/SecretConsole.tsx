import React, { useState } from 'react';
import { VoidlingState } from '../types';
import { SECRET_CODES } from '../state/gameData';
import { sound } from '../audio/soundEngine';
import confetti from 'canvas-confetti';
import { Terminal, X, CornerDownLeft } from 'lucide-react';

interface SecretConsoleProps {
  state: VoidlingState;
  onClose: () => void;
  onStateUpdate: (updater: (prev: VoidlingState) => VoidlingState) => void;
}

export const SecretConsole: React.FC<SecretConsoleProps> = ({
  state,
  onClose,
  onStateUpdate,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [logs, setLogs] = useState<string[]>([
    'VOIDLING SYSTEM KERNEL v1.0.4 - CLASSIFIED TERMINAL',
    'Type "HELP" for instructions or enter discovered easter egg codes.',
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = inputVal.trim().toUpperCase();
    if (!cmd) return;

    sound.playHackChirp();
    const newLogs = [...logs, `> ${cmd}`];

    if (cmd === 'HELP') {
      newLogs.push('AVAILABLE PROTOCOLS:');
      newLogs.push('- KONAMI  : Legendary code (+500 Xenon)');
      newLogs.push('- MATRIX  : Reality override');
      newLogs.push('- DISCO   : Party illumination');
      newLogs.push('- CHAOS   : Quantum entropy burst');
      newLogs.push('- EVOLVE  : Instant stage progression');
      newLogs.push('- CLEAR   : Wipe terminal output');
    } else if (cmd === 'CLEAR') {
      setLogs([]);
      setInputVal('');
      return;
    } else if (cmd === 'EVOLVE') {
      sound.playLevelUp();
      try {
        confetti({ particleCount: 70, spread: 80 });
      } catch (e) {}
      onStateUpdate(prev => ({
        ...prev,
        stage: Math.min(5, prev.stage + 1) as any,
        level: prev.level + 1,
        speechBubble: 'FORCED EVOLUTION APPLIED!',
        speechBubbleTimeout: 3000,
      }));
      newLogs.push('[SUCCESS]: Organism mutation forcefully stimulated.');
    } else if (SECRET_CODES[cmd]) {
      const codeData = SECRET_CODES[cmd];
      if (state.secretCodesUsed.includes(cmd)) {
        newLogs.push(`[WARN]: Code "${cmd}" has already been redeemed.`);
        sound.playHackFail();
      } else {
        sound.playSecret();
        try {
          confetti({ particleCount: 80, spread: 90 });
        } catch (e) {}

        onStateUpdate(prev => ({
          ...prev,
          xenon: prev.xenon + codeData.rewardXenon,
          colorTheme: codeData.theme || prev.colorTheme,
          secretCodesUsed: [...prev.secretCodesUsed, cmd],
          stats: {
            ...prev.stats,
            secretsFound: prev.stats.secretsFound + 1,
          },
          speechBubble: codeData.message,
          speechBubbleTimeout: 4000,
        }));

        newLogs.push(`[UNLOCKED]: ${codeData.message}`);
      }
    } else {
      sound.playHackFail();
      newLogs.push(`[ERROR]: Unknown command or invalid cipher: "${cmd}"`);
    }

    setLogs(newLogs);
    setInputVal('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-xl cyber-panel rounded-xl overflow-hidden shadow-[0_0_40px_rgba(0,243,255,0.25)] border-cyan-400">
        {/* Terminal Header */}
        <div className="h-10 bg-slate-950 px-4 flex items-center justify-between border-b border-cyan-500/30">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="font-['Orbitron'] font-bold text-xs text-cyan-300">
              SECRET CONSOLE // ROOT TELEMETRY
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Output Stream */}
        <div className="p-4 h-64 overflow-y-auto font-mono text-xs text-cyan-400/90 bg-black/90 space-y-1.5 border-b border-cyan-500/20">
          {logs.map((log, i) => (
            <div key={i} className="leading-relaxed">
              {log}
            </div>
          ))}
        </div>

        {/* Command Input */}
        <form onSubmit={handleSubmit} className="p-3 bg-slate-950 flex items-center gap-2">
          <span className="text-cyan-400 font-mono text-sm font-bold">&gt;</span>
          <input
            type="text"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            placeholder="Type secret code or HELP..."
            className="flex-1 bg-transparent border-none outline-none text-cyan-300 font-mono text-xs uppercase placeholder:text-slate-600"
            autoFocus
          />
          <button type="submit" className="cyber-button text-xs py-1 px-3">
            <CornerDownLeft className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
