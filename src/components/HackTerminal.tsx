import React, { useState, useEffect, useCallback } from 'react';
import { VoidlingState } from '../types';
import { sound } from '../audio/soundEngine';
import confetti from 'canvas-confetti';
import { Terminal, ShieldAlert, Cpu, Trophy, Play, RotateCcw } from 'lucide-react';

interface HackTerminalProps {
  state: VoidlingState;
  onStateUpdate: (updater: (prev: VoidlingState) => VoidlingState) => void;
}

const HEX_CHARS = ['1C', 'E9', '55', 'BD', '7A', 'FF'];

export const HackTerminal: React.FC<HackTerminalProps> = ({
  state,
  onStateUpdate,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [grid, setGrid] = useState<string[][]>([]);
  const [targetSequence, setTargetSequence] = useState<string[]>([]);
  const [playerSequence, setPlayerSequence] = useState<string[]>([]);
  const [selectedCells, setSelectedCells] = useState<{ r: number; c: number }[]>([]);
  const [isRowTurn, setIsRowTurn] = useState(true);
  const [activeRow, setActiveRow] = useState<number | null>(0);
  const [activeCol, setActiveCol] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(25);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [scoreEarned, setScoreEarned] = useState<number | null>(null);

  // Time bonus from mutation
  const baseTime = state.activeMutations.includes('mut_glitch_halo') ? 33 : 25;

  const startNewGame = useCallback(() => {
    sound.playHackChirp();
    const size = 5;
    const newGrid: string[][] = [];
    for (let r = 0; r < size; r++) {
      const row: string[] = [];
      for (let c = 0; c < size; c++) {
        row.push(HEX_CHARS[Math.floor(Math.random() * HEX_CHARS.length)]);
      }
      newGrid.push(row);
    }

    // Generate valid sequence of length 3 or 4
    const seqLen = 3 + Math.floor(Math.random() * 2);
    const target: string[] = [];
    for (let i = 0; i < seqLen; i++) {
      target.push(HEX_CHARS[Math.floor(Math.random() * HEX_CHARS.length)]);
    }

    setGrid(newGrid);
    setTargetSequence(target);
    setPlayerSequence([]);
    setSelectedCells([]);
    setIsRowTurn(true);
    setActiveRow(0);
    setActiveCol(null);
    setTimeLeft(baseTime);
    setStatusMessage(null);
    setScoreEarned(null);
    setIsPlaying(true);
  }, [baseTime]);

  // Countdown timer
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsPlaying(false);
          sound.playHackFail();
          setStatusMessage('BREACH FAILED: SYSTEM LOCKOUT');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying]);

  const handleCellClick = (r: number, c: number) => {
    if (!isPlaying) return;

    // Verify cell validity
    if (isRowTurn && r !== activeRow) {
      sound.playHackFail();
      return;
    }
    if (!isRowTurn && c !== activeCol) {
      sound.playHackFail();
      return;
    }
    // Check if cell already selected
    if (selectedCells.some(cell => cell.r === r && cell.c === c)) {
      sound.playHackFail();
      return;
    }

    const val = grid[r][c];
    sound.playHackChirp();

    const newSelected = [...selectedCells, { r, c }];
    const newPlayerSeq = [...playerSequence, val];

    setSelectedCells(newSelected);
    setPlayerSequence(newPlayerSeq);

    // Check if target sequence completed
    const seqStr = newPlayerSeq.join('');
    const targetStr = targetSequence.join('');

    if (seqStr.includes(targetStr)) {
      // VICTORY!
      setIsPlaying(false);
      sound.playHackSuccess();
      try {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      } catch (e) {}

      const multiplier = state.activeMutations.includes('mut_spectral_wings') ? 2 : 1;
      const reward = (100 + timeLeft * 5) * multiplier;
      setScoreEarned(reward);
      setStatusMessage(`SECURITY BYPASSED! DATA PACKET DECRYPTED (+${reward} XE)`);

      onStateUpdate(prev => ({
        ...prev,
        xenon: prev.xenon + reward,
        xp: prev.xp + 80,
        stats: {
          ...prev.stats,
          hackedNodes: prev.stats.hackedNodes + 1,
        },
        speechBubble: `*BEEP BOOP* Node breached! ${reward} Xenon injected into coffers!`,
        speechBubbleTimeout: 4000,
      }));
      return;
    }

    // Check if maximum sequence length reached without match
    if (newPlayerSeq.length >= targetSequence.length + 3) {
      setIsPlaying(false);
      sound.playHackFail();
      setStatusMessage('BUFFER OVERFLOW: SEQUENCE CORRUPTED');
      return;
    }

    // Toggle turn: from row to col, or col to row
    if (isRowTurn) {
      setIsRowTurn(false);
      setActiveRow(null);
      setActiveCol(c);
    } else {
      setIsRowTurn(true);
      setActiveRow(r);
      setActiveCol(null);
    }
  };

  return (
    <div className="p-6 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold font-['Orbitron'] text-cyan-400 glow-cyan flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            CYBERDECK INTRUSION // BREACH PROTOCOL
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Solve memory address pathways to bypass corporate ICE firewalls and siphon classified Xenon reserves.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 border border-slate-800 text-xs font-mono">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>NODES HACKED:</span>
            <span className="text-amber-400 font-bold">{state.stats.hackedNodes}</span>
          </div>

          <button
            onClick={startNewGame}
            className="cyber-button text-xs py-1.5 px-3"
          >
            {isPlaying ? (
              <span className="flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" /> REBOOT
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5" /> INITIATE BREACH
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Game Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Code Matrix Grid */}
        <div className="lg:col-span-2 cyber-panel p-5 rounded-xl">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
            <span className="text-xs font-mono text-slate-400 flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              STATUS: {isPlaying ? (isRowTurn ? `SELECT FROM ROW ${activeRow! + 1}` : `SELECT FROM COL ${activeCol! + 1}`) : 'STANDBY'}
            </span>

            <span className={`font-mono text-sm font-bold ${timeLeft <= 5 ? 'text-red-400 animate-ping' : 'text-cyan-400'}`}>
              TIME: {timeLeft}s
            </span>
          </div>

          {grid.length > 0 ? (
            <div className="grid grid-cols-5 gap-2 my-2">
              {grid.map((row, r) =>
                row.map((val, c) => {
                  const isSelected = selectedCells.some(cell => cell.r === r && cell.c === c);
                  const isHighlighted = isPlaying && ((isRowTurn && r === activeRow) || (!isRowTurn && c === activeCol));

                  return (
                    <button
                      key={`${r}-${c}`}
                      onClick={() => handleCellClick(r, c)}
                      disabled={!isPlaying || isSelected}
                      className={`h-14 rounded-lg font-mono text-base font-bold transition-all duration-150 flex items-center justify-center ${
                        isSelected
                          ? 'bg-slate-900/40 text-slate-700 border border-slate-800/60 cursor-not-allowed line-through'
                          : isHighlighted
                          ? 'bg-cyan-500/25 border-2 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(0,243,255,0.4)] hover:bg-cyan-500/40 cursor-pointer'
                          : 'bg-black/40 border border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {val}
                    </button>
                  );
                })
              )}
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500 font-mono text-sm">
              <ShieldAlert className="w-10 h-10 mb-2 opacity-50 text-cyan-400" />
              <span>TERMINAL IDLE. PRESS "INITIATE BREACH" TO COMMENCE.</span>
            </div>
          )}
        </div>

        {/* Right: Target Sequence & Buffer Memory */}
        <div className="flex flex-col gap-4">
          {/* Target Sequence */}
          <div className="cyber-panel p-4 rounded-xl">
            <h4 className="font-['Orbitron'] text-xs font-bold text-slate-300 uppercase mb-3">
              TARGET ACCESS SEQUENCE:
            </h4>
            <div className="flex items-center gap-2 flex-wrap">
              {targetSequence.map((hex, i) => (
                <div
                  key={i}
                  className="px-3 py-2 rounded-lg bg-cyan-950/40 border border-cyan-500/50 text-cyan-300 font-mono font-bold text-sm tracking-wider shadow-[0_0_8px_rgba(0,243,255,0.2)]"
                >
                  {hex}
                </div>
              ))}
            </div>
          </div>

          {/* Current Buffer Memory */}
          <div className="cyber-panel p-4 rounded-xl">
            <h4 className="font-['Orbitron'] text-xs font-bold text-slate-300 uppercase mb-3">
              ACTIVE BUFFER STREAM:
            </h4>
            <div className="flex items-center gap-2 flex-wrap min-h-[40px]">
              {playerSequence.length > 0 ? (
                playerSequence.map((hex, i) => (
                  <div
                    key={i}
                    className="px-2.5 py-1.5 rounded bg-purple-950/40 border border-purple-500/40 text-purple-300 font-mono text-xs font-bold"
                  >
                    {hex}
                  </div>
                ))
              ) : (
                <span className="text-xs font-mono text-slate-600">BUFFER EMPTY</span>
              )}
            </div>
          </div>

          {/* Status Alert Banner */}
          {statusMessage && (
            <div
              className={`p-4 rounded-xl border font-mono text-xs text-center font-bold animate-pulse-glow ${
                scoreEarned
                  ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500 text-rose-300'
              }`}
            >
              {statusMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
