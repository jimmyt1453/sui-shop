import { useState, useRef, useEffect } from 'react';
import { useBalance } from '../hooks/useBalance';

function fmt(ms: number): string {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  const d = new Date(ms);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function BalanceWidget() {
  const { current, history, loading, historyLoading, fetchHistory, refreshBalance } = useBalance();
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

  const handleRefresh = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await refreshBalance();
    } catch (err) {
      console.error('Refresh failed:', err);
    }
  };

  const sui = current ? (current.suiBalance / 1e9).toFixed(4) : '—';
  const usdc = current ? (current.usdcBalance / 1e6).toFixed(2) : '—';

  return (
    <div className="relative" ref={panelRef} style={{ zIndex: 9999 }}>
      {/* Chip */}
      <button
        onClick={handleOpen}
        className={`flex items-center gap-2.5 text-xs bg-black border rounded-lg px-3 py-1.5 transition-all duration-200 cursor-pointer relative z-10 ${
          open ? 'border-gray-500 shadow-[0_0_15px_rgba(255,255,255,0.05)]' : 'border-subtle hover:border-gray-600'
        }`}
      >
        {loading ? (
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0ms]" />
            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:300ms]" />
          </span>
        ) : (
          <>
            <span className="text-gray-300 font-mono">
              <span className="text-white font-medium">{sui}</span>
              <span className="text-gray-500 ml-1 text-[10px]">SUI</span>
            </span>
            <span className="text-gray-700">|</span>
            <span className="text-gray-300 font-mono">
              <span className="text-emerald-400 font-medium">{usdc}</span>
              <span className="text-gray-500 ml-1 text-[10px]">USDC</span>
            </span>
          </>
        )}
        <svg
          className={`w-3 h-3 text-gray-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-[420px] bg-[#0a0a0a] border border-subtle rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,1)] overflow-hidden pointer-events-auto animate-in fade-in zoom-in-95 duration-200" style={{ zIndex: 10000 }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-subtle bg-subtle">
            <span className="text-white font-semibold text-sm tracking-tight">Balance History</span>
            <div className="flex items-center gap-3">
              <span className="text-gray-500 text-[10px] uppercase tracking-wider font-medium">Balance changes only</span>
              <button
                onClick={handleRefresh}
                disabled={historyLoading}
                title="Refresh"
                className="text-gray-400 hover:text-white disabled:opacity-40 transition-all cursor-pointer p-1.5 hover:bg-white/5 rounded-md"
              >
                <svg
                  className={`w-4 h-4 ${historyLoading ? 'animate-spin text-blue-400' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

          {/* Current snapshot highlight */}
          {current && (
            <div className="grid grid-cols-2 gap-px bg-subtle border-b border-subtle">
              <div className="bg-black px-4 py-3 text-center">
                <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">SUI</p>
                <p className="text-white font-mono font-bold text-lg">{sui}</p>
              </div>
              <div className="bg-black px-4 py-3 text-center">
                <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">USDC</p>
                <p className="text-emerald-400 font-mono font-bold text-lg">{usdc}</p>
              </div>
            </div>
          )}

          {/* History table */}
          <div className="overflow-y-auto max-h-64 no-scrollbar bg-black">
            {historyLoading ? (
              <div className="flex items-center justify-center gap-1.5 py-12">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            ) : history.length === 0 ? (
              <p className="text-gray-600 text-xs text-center py-12 italic">No balance history found.</p>
            ) : (
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-[#0a0a0a] border-b border-subtle z-20">
                  <tr className="text-gray-500 text-[10px] uppercase tracking-wider">
                    <th className="text-left px-4 py-2.5 font-medium">Time</th>
                    <th className="text-right px-4 py-2.5 font-medium">SUI</th>
                    <th className="text-right px-4 py-2.5 font-medium">USDC</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const changed = history.filter((snap, i) => {
                      if (i === 0) return true;
                      const prev = history[i - 1];
                      return snap.suiBalance !== prev.suiBalance || snap.usdcBalance !== prev.usdcBalance;
                    });
                    
                    const display = [...changed].reverse();
                    
                    return display.map((snap, i) => {
                      const prevChronologicalSnap = display[i + 1];
                      const usdcDiff = prevChronologicalSnap ? snap.usdcBalance - prevChronologicalSnap.usdcBalance : 0;
                      const suiDiff = prevChronologicalSnap ? snap.suiBalance - prevChronologicalSnap.suiBalance : 0;
                      
                      return (
                        <tr
                          key={snap.timestamp}
                          className="border-b border-subtle hover:bg-white/[0.02] transition-colors group"
                        >
                          <td className="px-4 py-3 text-gray-500 group-hover:text-gray-300 transition-colors whitespace-nowrap">
                            {fmt(snap.timestamp)}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-300 font-mono">
                            {(snap.suiBalance / 1e9).toFixed(4)}
                            {suiDiff !== 0 && (
                              <span className={`ml-1.5 text-[10px] ${suiDiff < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                {suiDiff < 0 ? '▼' : '▲'}{Math.abs(suiDiff / 1e9).toFixed(4)}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-mono">
                            <span className="text-emerald-400">
                              {(snap.usdcBalance / 1e6).toFixed(2)}
                            </span>
                            {usdcDiff !== 0 && (
                              <span className={`ml-1.5 text-[10px] ${usdcDiff < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
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
