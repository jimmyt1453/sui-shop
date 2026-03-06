import { useBalance } from '../hooks/useBalance';
import { useAgentStatus } from '../hooks/useAgentStatus';
import { useOrders } from '../hooks/useOrders';

interface Props {
  onOpenSettings: () => void;
}

export function CommandCenter({ onOpenSettings }: Props) {
  const { current, loading: balanceLoading } = useBalance();
  const { status } = useAgentStatus();
  const { orders, loading: ordersLoading } = useOrders(10);

  const usdcBalance = current ? (current.usdcBalance / 1e6).toFixed(2) : '0.00';
  const suiBalance = current ? (current.suiBalance / 1e9).toFixed(4) : '0.0000';

  const isConnected = status?.ok === true;
  const network = status?.network || 'testnet';

  return (
    <aside className="w-64 border-r border-subtle bg-subtle/80 flex-col hidden md:flex shrink-0 z-20">
      <div className="p-5 border-b border-subtle flex items-center gap-3 bg-app/50 backdrop-blur-md">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center relative overflow-hidden bg-white shrink-0">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-black" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <div className="min-w-0">
          <h1 className="text-sm font-semibold tracking-tight text-white truncate">SuiPulse</h1>
          <p className="text-[10px] text-gray-500 font-mono mt-0.5 flex items-center gap-1.5 uppercase">
            <svg className={`w-2 h-2 ${isConnected ? 'animate-pulse' : ''}`} viewBox="0 0 10 10">
              <circle cx="5" cy="5" r="4" fill={isConnected ? (network === 'mainnet' ? '#10b981' : '#f59e0b') : '#ef4444'}/>
            </svg>
            {isConnected ? network : 'OFFLINE'}
          </p>
        </div>
      </div>

      <div className="p-5 space-y-8 flex-1 overflow-y-auto relative no-scrollbar">
        {/* Data flow SVG graphic behind sidebar items */}
        <svg className="absolute top-10 right-0 w-32 h-64 opacity-10 pointer-events-none" viewBox="0 0 100 200" fill="none" stroke="currentColor">
          <path d="M100 0 C 50 50, 50 150, 0 200" stroke="#3b82f6" strokeWidth="1" strokeDasharray="4 4">
            <animate attributeName="stroke-dashoffset" from="40" to="0" dur="2s" repeatCount="indefinite" />
          </path>
          <path d="M100 50 C 70 80, 80 180, 20 200" stroke="#10b981" strokeWidth="0.5" strokeDasharray="2 4">
            <animate attributeName="stroke-dashoffset" from="20" to="0" dur="1.5s" repeatCount="indefinite" />
          </path>
        </svg>

        {/* Wallet Info */}
        <div className="space-y-3 relative z-10">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Wallet</p>
          <div 
            onClick={() => {
              if (status?.address) {
                navigator.clipboard.writeText(status.address);
              }
            }}
            className="p-3 border border-subtle rounded-lg bg-black hover:border-gray-700 transition-colors cursor-pointer group shadow-inner"
          >
            <div className="flex justify-between items-center mb-3 border-b border-subtle pb-2">
              <p className="text-[10px] text-gray-500 font-mono flex items-center gap-2">
                <svg className="w-3 h-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                {status?.address ? `${status.address.slice(0, 6)}...${status.address.slice(-4)}` : 'Loading...'}
              </p>
              <svg className="w-3 h-3 text-gray-600 group-hover:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
              </svg>
            </div>
            <div className="space-y-2">
              <div className="flex items-end justify-between">
                <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">USDC</p>
                <p className={`font-medium text-white text-sm font-mono ${balanceLoading ? 'animate-pulse' : ''}`}>{usdcBalance}</p>
              </div>
              <div className="flex items-end justify-between">
                <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">SUI</p>
                <p className={`font-medium text-white text-sm font-mono ${balanceLoading ? 'animate-pulse' : ''}`}>{suiBalance}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-3 relative z-10">
          <div className="flex justify-between items-center">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Activity</p>
          </div>
          <div className="space-y-4">
            {ordersLoading && orders.length === 0 ? (
              <div className="animate-pulse space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-3 relative">
                    <div className="w-px h-full bg-subtle absolute left-1.5 top-3 -z-10"></div>
                    <div className="w-3 h-3 bg-gray-800 rounded-full shrink-0 mt-0.5"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-2.5 bg-gray-800 rounded w-2/3"></div>
                      <div className="h-2 bg-gray-800 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : orders.length === 0 ? (
              <p className="text-[10px] text-gray-600 font-medium italic">No recent activity</p>
            ) : (
              orders.map((order, i) => (
                <div key={`${order.txDigest}-${i}`} className="flex gap-3 items-start group relative">
                  <div className="w-px h-full bg-subtle absolute left-1.5 top-3 -z-10"></div>
                  <svg className="w-3 h-3 text-emerald-500 mt-0.5 bg-subtle shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-300 font-medium group-hover:text-white transition-colors truncate" title={order.productName}>
                      Bought {order.productName}
                    </p>
                    <a 
                      href={`https://suiscan.xyz/${network}/tx/${order.txDigest}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-mono text-blue-500/70 mt-1 block hover:text-blue-400 transition-colors truncate"
                    >
                      Tx: {order.txDigest.slice(0, 6)}...{order.txDigest.slice(-4)}
                    </a>
                    <p className="text-[9px] text-gray-600 mt-0.5">{formatTimeAgo(order.timestamp)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div 
        onClick={onOpenSettings}
        className="p-5 border-t border-subtle text-xs text-gray-500 flex justify-between items-center hover:text-white cursor-pointer transition-colors bg-subtle/50 backdrop-blur-md"
      >
        <span className="font-medium tracking-wide">Preferences</span>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
      </div>
    </aside>
  );
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(timestamp).toLocaleDateString();
}
