import { useState } from 'react';
import { useAgentStatus } from '../hooks/useAgentStatus';

function networkColor(network: string): string {
  if (network === 'mainnet') return 'bg-emerald-500';
  if (network === 'testnet') return 'bg-amber-500';
  return 'bg-blue-500';
}

function networkTextColor(network: string): string {
  if (network === 'mainnet') return 'text-slate-500';
  if (network === 'testnet') return 'text-amber-500/80';
  return 'text-blue-500/80';
}

export function StatusBar() {
  const { status, loading } = useAgentStatus();
  const [copied, setCopied] = useState(false);

  if (loading) {
    return (
      <span className="flex items-center gap-1">
        <span className="w-1 h-1 bg-slate-700 rounded-full animate-pulse" />
        <span className="text-[10px] text-slate-700 font-bold uppercase tracking-widest">Loading...</span>
      </span>
    );
  }

  if (!status?.ok) {
    return (
      <span className="flex items-center gap-1.5 text-[10px] font-bold text-red-500/80 uppercase tracking-widest">
        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
        Offline
      </span>
    );
  }

  const shortAddr = `${status.address.slice(0, 6)}…${status.address.slice(-4)}`;
  const displayNetwork = status.network === 'mainnet' ? 'SUI Mainnet' : `SUI ${status.network.charAt(0).toUpperCase() + status.network.slice(1)}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(status.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex items-center gap-3">
      <span className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${networkTextColor(status.network)}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${networkColor(status.network)}`} />
        {displayNetwork}
      </span>
      
      <button
        onClick={handleCopy}
        title={copied ? 'Copied!' : status.address}
        className="text-[10px] font-mono text-emerald-500/60 hover:text-emerald-400 transition-colors cursor-pointer"
      >
        {copied ? 'COPIED' : shortAddr}
      </button>
    </div>
  );
}
