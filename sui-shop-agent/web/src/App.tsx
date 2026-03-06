import { useState } from 'react';
import { ChatWindow } from './components/ChatWindow';
import { AdminDashboard } from './components/AdminDashboard';
import { BalanceWidget } from './components/BalanceWidget';
import { CommandCenter } from './components/CommandCenter';
import { SettingsModal } from './components/SettingsModal';

type Tab = 'chat' | 'admin';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="h-screen bg-black text-gray-200 overflow-hidden relative flex items-center justify-center p-4 sm:p-8 font-sans selection:bg-blue-500/30">
      {/* AMBIENT SVG GRID */}
      <div className="svg-grid-bg">
        <svg className="grid-pattern" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#333" strokeWidth="0.5" />
              <circle cx="40" cy="40" r="1" fill="#444" />
            </pattern>
          </defs>
          <rect width="100%" height="150%" fill="url(#grid)" />
        </svg>
      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      
      {/* MAIN APP WINDOW */}
      <div className="app-window w-full max-w-[1060px] h-full max-h-[900px] flex flex-col md:flex-row relative z-10 shadow-2xl">
        
        {/* LEFT SIDEBAR */}
        <CommandCenter onOpenSettings={() => setIsSettingsOpen(true)} />

        {/* MAIN AREA */}
        <main className="flex-1 flex flex-col relative bg-transparent min-w-0">
          
          {/* HEADER */}
          <header className="h-14 border-b border-subtle flex items-center justify-between px-6 shrink-0 bg-transparent backdrop-blur-sm z-50">
            <div className="flex gap-6 text-sm font-medium text-gray-500">
              <button 
                onClick={() => setActiveTab('chat')}
                className={`pt-1 h-14 flex items-center gap-2 transition-colors ${activeTab === 'chat' ? 'text-white border-b-2 border-white' : 'hover:text-gray-300'}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                Chat
              </button>
              <button 
                onClick={() => setActiveTab('admin')}
                className={`pt-1 h-14 flex items-center gap-2 transition-colors ${activeTab === 'admin' ? 'text-white border-b-2 border-white' : 'hover:text-gray-300'}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                Dashboard
              </button>
            </div>
            <div className="flex items-center gap-4">
              <BalanceWidget />
              <button onClick={() => setIsSettingsOpen(true)} className="text-gray-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
              </button>
            </div>
          </header>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden flex flex-col w-full mx-auto">
            {activeTab === 'chat' ? <ChatWindow /> : (
              <div className="flex-1 overflow-y-auto px-4 sm:px-6"><AdminDashboard /></div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
