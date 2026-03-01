import { useState } from 'react';
import { useAgentStatus } from '../hooks/useAgentStatus';

function networkBadgeColor(network: string): string {
  if (network === 'mainnet') return 'bg-emerald-600';
  if (network === 'testnet') return 'bg-amber-500';
  return 'bg-blue-600';
}

export function StatusBar() {
  const { status, loading } = useAgentStatus();
  const [copied, setCopied] = useState(false);

  if (loading) {
    return (
      <span className="flex items-center gap-1">
        <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:300ms]" />
      </span>
    );
  }

  if (!status?.ok) {
    return (
      <span className="flex items-center gap-1.5 text-xs bg-red-900/40 border border-red-800/60 text-red-400 px-2 py-0.5 rounded-full">
        <span className="w-1.5 h-1.5 bg-red-500/70 rounded-full animate-pulse" />
        Server offline
      </span>
    );
  }

  const shortAddr = `${status.address.slice(0, 6)}…${status.address.slice(-4)}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(status.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex items-center gap-3 text-xs">
      <span className={`flex items-center gap-1.5 text-white px-2 py-0.5 rounded-full uppercase font-medium tracking-wide ${networkBadgeColor(status.network)}`}>
        <span className="w-1.5 h-1.5 bg-white/70 rounded-full animate-pulse" />
        {status.network}
      </span>
      <button
        onClick={handleCopy}
        title={copied ? 'Copied!' : status.address}
        className="text-green-400 font-mono hover:text-green-300 transition-colors cursor-pointer"
      >
        {copied ? 'Copied!' : shortAddr}
      </button>
    </div>
  );
}
