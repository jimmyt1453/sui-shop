import { useState, useRef, useEffect } from 'react';
import { useBalance } from '../hooks/useBalance';

function fmt(ms: number): string {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

export function BalanceWidget() {
  const { current, history, loading, historyLoading, fetchHistory } = useBalance();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleOpen = () => {
    if (!open) fetchHistory();
    setOpen((v) => !v);
  };

  const sui = current ? (current.suiBalance / 1e9).toFixed(4) : '—';
  const usdc = current ? (current.usdcBalance / 1e6).toFixed(2) : '—';

  return (
    <div className="relative" ref={panelRef}>
      {/* Chip */}
      <button
        onClick={handleOpen}
        className={`flex items-center gap-2.5 text-xs bg-slate-800/60 border rounded-lg px-3 py-1.5 transition-all duration-200 cursor-pointer backdrop-blur-sm ${
          open ? 'border-blue-500/60 shadow-[0_0_0_2px_rgba(59,130,246,0.1)]' : 'border-slate-700/60 hover:border-slate-600/80'
        }`}
      >
        {loading ? (
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0ms]" />
            <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:300ms]" />
          </span>
        ) : (
          <>
            <span className="text-slate-400">
              <span className="text-white font-medium">{sui}</span>
              <span className="text-slate-500 ml-0.5">SUI</span>
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">
              <span className="text-green-400 font-medium">{usdc}</span>
              <span className="text-slate-500 ml-0.5">USDC</span>
            </span>
          </>
        )}
        <svg
          className={`w-3 h-3 text-slate-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-[420px] bg-slate-900/95 backdrop-blur-md border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/40 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80">
            <span className="text-white font-semibold text-sm">Balance History</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-600 text-xs">Balance changes only</span>
              <button
                onClick={fetchHistory}
                disabled={historyLoading}
                title="Refresh"
                className="text-slate-500 hover:text-slate-300 disabled:opacity-40 transition-colors"
              >
                <svg
                  className={`w-3.5 h-3.5 ${historyLoading ? 'animate-spin' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

          {/* Current snapshot highlight */}
          {current && (
            <div className="grid grid-cols-2 gap-px bg-slate-800/50 border-b border-slate-800/80">
              <div className="bg-slate-900/80 px-4 py-3">
                <p className="text-slate-500 text-xs mb-1">SUI</p>
                <p className="text-white font-mono font-bold text-lg">{sui}</p>
              </div>
              <div className="bg-slate-900/80 px-4 py-3">
                <p className="text-slate-500 text-xs mb-1">USDC</p>
                <p className="text-green-400 font-mono font-bold text-lg">{usdc}</p>
              </div>
            </div>
          )}

          {/* History table */}
          <div className="overflow-y-auto max-h-64">
            {historyLoading ? (
              <div className="flex items-center justify-center gap-1.5 py-6">
                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            ) : history.length === 0 ? (
              <p className="text-slate-600 text-xs text-center py-6">No history yet.</p>
            ) : (
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-slate-900/95 border-b border-slate-800/80">
                  <tr className="text-slate-600">
                    <th className="text-left px-4 py-2 font-medium">Time</th>
                    <th className="text-right px-4 py-2 font-medium">SUI</th>
                    <th className="text-right px-4 py-2 font-medium">USDC</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Only show snapshots where balance changed from previous
                    const changed = history.filter((snap, i) => {
                      if (i === 0) return true;
                      const prev = history[i - 1];
                      return snap.suiBalance !== prev.suiBalance || snap.usdcBalance !== prev.usdcBalance;
                    });
                    const display = [...changed].reverse();
                    return display.map((snap, i) => {
                      const prevSnap = display[i + 1];
                      const usdcDiff = prevSnap ? snap.usdcBalance - prevSnap.usdcBalance : 0;
                      const suiDiff = prevSnap ? snap.suiBalance - prevSnap.suiBalance : 0;
                      return (
                        <tr
                          key={snap.timestamp}
                          className="border-b border-slate-800/50 hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="px-4 py-2 text-slate-500">
                            {fmt(snap.timestamp)}
                          </td>
                          <td className="px-4 py-2 text-right text-slate-300 font-mono">
                            {(snap.suiBalance / 1e9).toFixed(4)}
                            {suiDiff !== 0 && (
                              <span className={`ml-1.5 text-xs ${suiDiff < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                {suiDiff < 0 ? '▼' : '▲'}{Math.abs(suiDiff / 1e9).toFixed(4)}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-right font-mono">
                            <span className="text-green-400">
                              {(snap.usdcBalance / 1e6).toFixed(2)}
                            </span>
                            {usdcDiff !== 0 && (
                              <span className={`ml-1.5 text-xs ${usdcDiff < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                {usdcDiff < 0 ? '▼' : '▲'}{Math.abs(usdcDiff / 1e6).toFixed(2)}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
