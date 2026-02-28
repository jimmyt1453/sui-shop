import { ChatWindow } from './components/ChatWindow';
import { StatusBar } from './components/StatusBar';

function App() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl select-none">🤖</span>
            <span className="text-lg font-bold text-white">SUI Shop Agent</span>
          </div>
          <StatusBar />
        </div>
      </header>

      {/* Chat */}
      <main className="flex-1 flex flex-col max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 min-h-0">
        <ChatWindow />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-3">
        <p className="text-center text-gray-700 text-xs">
          Jimmy's SUI Shop Agent — Powered by Claude AI &amp; SUI Blockchain
        </p>
      </footer>
    </div>
  );
}

export default App;
