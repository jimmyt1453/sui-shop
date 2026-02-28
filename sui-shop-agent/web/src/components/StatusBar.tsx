import { useAgentStatus } from '../hooks/useAgentStatus';

export function StatusBar() {
  const { status, loading } = useAgentStatus();

  if (loading) {
    return <span className="text-gray-600 text-xs font-mono animate-pulse">Connecting…</span>;
  }

  if (!status?.ok) {
    return <span className="text-red-400 text-xs">⚠ Server offline</span>;
  }

  const shortAddr = `${status.address.slice(0, 6)}…${status.address.slice(-4)}`;

  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full uppercase font-medium tracking-wide">
        {status.network}
      </span>
      <span className="text-gray-400 font-mono" title={status.address}>
        Wallet: <span className="text-green-400">{shortAddr}</span>
      </span>
    </div>
  );
}
