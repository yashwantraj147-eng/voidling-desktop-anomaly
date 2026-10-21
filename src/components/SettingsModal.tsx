import React, { useState } from 'react';
import { VoidlingState } from '../types';
import { sound } from '../audio/soundEngine';
import { exportBackupJson, parseBackupJson } from '../state/storage';
import { 
  Settings, 
  X, 
  Volume2, 
  VolumeX, 
  Download, 
  Upload, 
  Trash2, 
  Radio, 
  Keyboard, 
  ShieldAlert, 
  CheckCircle 
} from 'lucide-react';

interface SettingsModalProps {
  state: VoidlingState;
  onClose: () => void;
  onStateUpdate: (updater: (prev: VoidlingState) => VoidlingState) => void;
  onResetGame: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  state,
  onClose,
  onStateUpdate,
  onResetGame,
}) => {
  const [vol, setVol] = useState(sound.getVolume());
  const [isMuted, setIsMuted] = useState(sound.getIsMuted());
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const desktop = (window as any).desktopAPI;

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVol(val);
    sound.setVolume(val);
  };

  const handleToggleMute = () => {
    const nextMute = sound.toggleMute();
    setIsMuted(nextMute);
  };

  const handleExportBackup = async () => {
    sound.playHackChirp();
    const jsonStr = exportBackupJson(state);

    if (desktop?.exportSaveFile) {
      const res = await desktop.exportSaveFile(jsonStr);
      if (res.success) {
        setAlertMsg({ type: 'success', text: `Save exported to ${res.path}` });
      } else if (res.error !== 'Cancelled') {
        setAlertMsg({ type: 'error', text: res.error || 'Export failed' });
      }
    } else {
      // Browser fallback
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `voidling-backup-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setAlertMsg({ type: 'success', text: 'Backup downloaded successfully.' });
    }
  };

  const handleImportBackup = async () => {
    sound.playHackChirp();
    if (desktop?.importSaveFile) {
      const res = await desktop.importSaveFile();
      if (res.success && res.data) {
        const loaded = parseBackupJson(res.data);
        if (loaded) {
          onStateUpdate(() => loaded);
          sound.playLevelUp();
          setAlertMsg({ type: 'success', text: 'Save data restored successfully!' });
        } else {
          setAlertMsg({ type: 'error', text: 'Invalid JSON save file format.' });
        }
      }
    } else {
      // Browser fallback file input
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = evt => {
          const content = evt.target?.result as string;
          const loaded = parseBackupJson(content);
          if (loaded) {
            onStateUpdate(() => loaded);
            sound.playLevelUp();
            setAlertMsg({ type: 'success', text: 'Save data restored successfully!' });
          } else {
            setAlertMsg({ type: 'error', text: 'Invalid JSON save file format.' });
          }
        };
        reader.readAsText(file);
      };
      input.click();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg cyber-panel rounded-xl overflow-hidden border-cyan-400 shadow-[0_0_40px_rgba(0,243,255,0.25)] flex flex-col">
        {/* Header */}
        <div className="h-11 bg-slate-950 px-4 flex items-center justify-between border-b border-cyan-500/30">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-cyan-400" />
            <span className="font-['Orbitron'] font-bold text-xs text-cyan-300">
              SYSTEM CONFIGURATION & PROTOCOLS
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {alertMsg && (
            <div
              className={`p-3 rounded-lg border text-xs font-mono flex items-center gap-2 ${
                alertMsg.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500 text-rose-300'
              }`}
            >
              {alertMsg.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-rose-400" />
              )}
              <span>{alertMsg.text}</span>
            </div>
          )}

          {/* Audio Controls */}
          <div className="p-4 rounded-xl bg-black/40 border border-slate-800 space-y-3">
            <span className="text-xs font-['Orbitron'] font-bold text-slate-200 block uppercase">
              ACOUSTIC SYNTHESIZER SETTINGS
            </span>

            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-mono text-slate-400">Master Volume:</span>
              <div className="flex items-center gap-3 flex-1 max-w-[200px]">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={vol}
                  onChange={handleVolumeChange}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <span className="text-xs font-mono text-cyan-400 font-bold min-w-[32px]">
                  {Math.round(vol * 100)}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
              <span className="text-xs font-mono text-slate-400">Audio Mute State:</span>
              <button
                onClick={handleToggleMute}
                className="cyber-button text-xs py-1 px-3"
              >
                {isMuted ? (
                  <span className="flex items-center gap-1.5 text-rose-400">
                    <VolumeX className="w-3.5 h-3.5" /> MUTED
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-cyan-300">
                    <Volume2 className="w-3.5 h-3.5" /> ACTIVE
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Keyboard Shortcuts Reference */}
          <div className="p-4 rounded-xl bg-black/40 border border-slate-800 space-y-2 font-mono text-xs">
            <div className="flex items-center gap-2 text-slate-200 font-['Orbitron'] font-bold mb-2">
              <Keyboard className="w-4 h-4 text-amber-400" />
              <span>DESKTOP SHORTCUTS & HOTKEYS</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Boss Panic Disguise:</span>
              <span className="text-amber-400 font-bold">Ctrl + Shift + B / Esc</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Quantum Defense Fire:</span>
              <span className="text-cyan-400 font-bold">Spacebar / Mouse Click</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Steer Defense Guardian:</span>
              <span className="text-cyan-400 font-bold">A / D or Arrow Keys</span>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-slate-400">Pet / Poke Organism:</span>
              <span className="text-purple-400 font-bold">Left Click / Drag</span>
            </div>
          </div>

          {/* Data Backup & Restore */}
          <div className="p-4 rounded-xl bg-black/40 border border-slate-800 space-y-3">
            <span className="text-xs font-['Orbitron'] font-bold text-slate-200 block uppercase">
              LOCAL DATA PERSISTENCE & BACKUPS
            </span>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleExportBackup}
                className="cyber-button text-xs py-2"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>EXPORT SAVE</span>
              </button>

              <button
                onClick={handleImportBackup}
                className="cyber-button text-xs py-2"
              >
                <Upload className="w-3.5 h-3.5 text-purple-400" />
                <span>IMPORT SAVE</span>
              </button>
            </div>

            <div className="pt-2 border-t border-slate-800/80">
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to reset all organism data? This cannot be undone.')) {
                    onResetGame();
                    onClose();
                  }
                }}
                className="cyber-button w-full text-xs py-2 text-rose-400 border-rose-500/30 hover:border-rose-500 hover:bg-rose-500/10"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>RESET ALL PROGRESS & REBIRTH</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
