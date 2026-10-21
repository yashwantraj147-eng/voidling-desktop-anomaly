import React, { useState, useEffect } from 'react';
import { Eye, Shield, HardDrive, Cpu, Activity, RefreshCw } from 'lucide-react';

interface BossScreenProps {
  onExit: () => void;
}

export const BossScreen: React.FC<BossScreenProps> = ({ onExit }) => {
  const [ticks, setTicks] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTicks(t => t + 1);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onExit();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onExit]);

  return (
    <div className="fixed inset-0 z-50 bg-[#0c1017] text-[#a0aec0] font-mono text-xs select-text overflow-hidden flex flex-col p-6">
      {/* Top Banner */}
      <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-4">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-blue-400 animate-pulse" />
          <div>
            <h1 className="text-sm font-bold text-slate-100">
              Windows Performance & Kernel Diagnostic Monitor
            </h1>
            <span className="text-[11px] text-slate-500">
              Session ID: 0x88F0-KRNL-DIAG // Architecture: x86_64 // Status: NORMAL
            </span>
          </div>
        </div>

        <button
          onClick={onExit}
          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors border border-slate-600 flex items-center gap-1.5"
          title="Press Esc or click to return"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Exit Diagnostics (Esc)</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="bg-[#161b22] p-3 rounded border border-slate-800">
          <span className="text-[10px] text-slate-500 block mb-1">CPU UTILIZATION</span>
          <span className="text-lg font-bold text-emerald-400">
            {(12.4 + Math.sin(ticks * 0.7) * 3).toFixed(1)}%
          </span>
        </div>

        <div className="bg-[#161b22] p-3 rounded border border-slate-800">
          <span className="text-[10px] text-slate-500 block mb-1">COMMITTED MEMORY</span>
          <span className="text-lg font-bold text-blue-400">
            {(16.2 + (ticks % 5) * 0.1).toFixed(1)} GB / 32.0 GB
          </span>
        </div>

        <div className="bg-[#161b22] p-3 rounded border border-slate-800">
          <span className="text-[10px] text-slate-500 block mb-1">ACTIVE SYSTEM THREADS</span>
          <span className="text-lg font-bold text-slate-200">
            {3240 + (ticks % 12)}
          </span>
        </div>

        <div className="bg-[#161b22] p-3 rounded border border-slate-800">
          <span className="text-[10px] text-slate-500 block mb-1">PAGE FAULTS / SEC</span>
          <span className="text-lg font-bold text-amber-400">
            {42 + (ticks % 7) * 4}
          </span>
        </div>
      </div>

      {/* Live System Process Log */}
      <div className="flex-1 bg-[#090d14] p-4 rounded border border-slate-800 overflow-y-auto space-y-1 font-mono text-[11px] text-slate-400">
        <div>[0.000120] ACPI: Kernel PCI subsystem initialized (IRQ balance: enabled)</div>
        <div>[0.000450] VFS: Disk cache writeback buffer allocated (4096 pages)</div>
        <div>[0.001020] NET: TCP/IP Stack active. Listening on interfaces [127.0.0.1, 192.168.1.104]</div>
        <div>[0.001840] MEM: Physical RAM verified. Total usable memory addresses: 0x000000000000 - 0x00007FFFFFFF</div>
        <div>[0.002490] SECURITY: Windows Defender Core Service running with elevated privileges</div>
        <div>[0.003110] DRIVER: Display adapter D3D12 pipeline compiled successfully. Buffer swap: 60Hz</div>
        <div className="text-blue-400">[{((ticks * 0.8) + 12).toFixed(4)}] AUDIT: Periodic memory paging check passed without ECC warnings.</div>
        <div className="text-emerald-400">[{((ticks * 0.8) + 14).toFixed(4)}] HEALTH: All 16 CPU execution threads verified stable.</div>
      </div>
    </div>
  );
};
