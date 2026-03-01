import { ChatWindow } from './components/ChatWindow';
import { StatusBar } from './components/StatusBar';
import { BalanceWidget } from './components/BalanceWidget';

function App() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-base select-none shrink-0">
              🤖
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold text-white">SUI Shop Agent</span>
              <span className="text-xs text-gray-500">Powered by Claude AI</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <BalanceWidget />
            <StatusBar />
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
