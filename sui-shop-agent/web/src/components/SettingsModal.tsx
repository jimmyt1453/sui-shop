import { useAgentStatus } from '../hooks/useAgentStatus';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: Props) {
  const { status } = useAgentStatus();

  if (!isOpen) return null;

  const copyAddress = () => {
    if (status?.address) {
      navigator.clipboard.writeText(status.address);
      alert('Address copied to clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200" 
        onClick={onClose} 
      />
      
      <div className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest">Agent Settings</h2>
          <button 
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Wallet Section */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Agent Wallet Address</label>
            <div className="flex items-center gap-2 p-3 bg-slate-950/50 border border-white/5 rounded-xl group">
              <code className="text-[11px] text-blue-400 font-mono truncate flex-1">
                {status?.address || 'Loading...'}
              </code>
              <button 
                onClick={copyAddress}
                className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
                title="Copy Address"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              </button>
            </div>
          </div>

          {/* Network Section */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Connected Network</label>
            <div className="flex items-center justify-between p-3 bg-slate-950/50 border border-white/5 rounded-xl">
              <span className="text-xs text-slate-300 font-medium">SUI Network</span>
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 uppercase bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                {status?.network || 'mainnet'}
              </span>
            </div>
          </div>

          {/* Version Info */}
          <div className="pt-4 border-t border-white/5">
            <div className="flex justify-between items-center text-[10px] text-slate-600">
              <span>Agent Protocol Version</span>
              <span className="font-mono">v2.0.4-stable</span>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-950/30">
          <button 
            onClick={onClose}
            className="w-full bg-white/5 hover:bg-white/10 text-white text-xs font-bold py-3 rounded-xl transition-all border border-white/5 cursor-pointer active:scale-95"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
