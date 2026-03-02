import { ChatWindow } from './components/ChatWindow';
import { StatusBar } from './components/StatusBar';
import { BalanceWidget } from './components/BalanceWidget';

function App() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Glass header with gradient top accent */}
      <header className="sticky top-0 z-50">
        <div className="h-px bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
        <div className="bg-slate-900/80 backdrop-blur-md border-b border-white/5">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-base select-none shrink-0 shadow-lg shadow-blue-500/25">
                🤖
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-bold text-white">SUI Shop Agent</span>
                <span className="text-xs text-slate-500">Powered by Claude AI</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <BalanceWidget />
              <StatusBar />
            </div>
          </div>
        </div>
      </header>

      {/* Chat */}
      <main className="flex-1 flex flex-col max-w-3xl w-full mx-auto px-4 sm:px-6 py-4 min-h-0">
        <ChatWindow />
      </main>
    </div>
  );
}

export default App;
