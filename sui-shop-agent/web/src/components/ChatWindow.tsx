import { useEffect, useRef } from 'react';
import { useChat } from '../hooks/useChat';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';

const SUGGESTIONS: { icon: string; label: string; text: string; cardColor: string; iconBg: string }[] = [
  {
    icon: '📋',
    label: 'Browse Products',
    text: 'What products are available?',
    cardColor: 'bg-violet-500/10 border-violet-500/25 hover:border-violet-400/50 hover:bg-violet-500/15',
    iconBg: 'bg-violet-500/20 text-violet-300',
  },
  {
    icon: '💰',
    label: 'Check Balance',
    text: 'Check the agent wallet balance',
    cardColor: 'bg-emerald-500/10 border-emerald-500/25 hover:border-emerald-400/50 hover:bg-emerald-500/15',
    iconBg: 'bg-emerald-500/20 text-emerald-300',
  },
  {
    icon: '📜',
    label: 'Order History',
    text: 'Show my order history',
    cardColor: 'bg-amber-500/10 border-amber-500/25 hover:border-amber-400/50 hover:bg-amber-500/15',
    iconBg: 'bg-amber-500/20 text-amber-300',
  },
  {
    icon: '🛒',
    label: 'Make a Purchase',
    text: 'Buy Steam Gift Card $10 and send to me@example.com',
    cardColor: 'bg-blue-500/10 border-blue-500/25 hover:border-blue-400/50 hover:bg-blue-500/15',
    iconBg: 'bg-blue-500/20 text-blue-300',
  },
];

export function ChatWindow() {
  const { messages, isLoading, sendMessage, clearMessages } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col flex-1 gap-4 min-h-0">
      {/* Clear button above scroll area */}
      {messages.length > 0 && (
        <div className="flex justify-end shrink-0">
          <button
            onClick={clearMessages}
            disabled={isLoading}
            className="flex items-center gap-1 text-xs text-slate-600 hover:text-red-400 transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
            </svg>
            Clear conversation
          </button>
        </div>
      )}

      {/* Message list */}
      <div className="flex-1 flex flex-col gap-4 overflow-y-auto min-h-0 pr-1">
        {messages.length === 0 ? (
          /* Welcome screen */
          <div className="relative flex flex-col items-center justify-center flex-1 gap-6 py-16 overflow-hidden">
            {/* Radial glow background */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-80 h-80 bg-blue-600/8 rounded-full blur-3xl" />
            </div>

            {/* Multi-ring avatar */}
            <div className="relative flex items-center justify-center">
              <span className="absolute w-28 h-28 rounded-3xl bg-blue-500/8 motion-safe:animate-ping" style={{ animationDuration: '3s' }} />
              <span className="absolute w-22 h-22 rounded-3xl bg-blue-500/12" style={{ width: '5.5rem', height: '5.5rem' }} />
              <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-3xl select-none shadow-xl shadow-blue-500/30">
                🤖
              </div>
            </div>

            <div className="relative text-center">
              <h2 className="text-xl font-bold text-white mb-1">Jimmy's SUI Shop Agent</h2>
              <p className="text-slate-500 text-sm max-w-sm">
                I can browse products, check wallet balances, and make purchases on the SUI blockchain using natural language.
              </p>
            </div>

            {/* 2×2 color-coded suggestion cards */}
            <div className="relative grid grid-cols-2 gap-3 max-w-sm w-full px-4">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => sendMessage(s.text)}
                  className={`flex flex-col items-start gap-2 text-left border rounded-xl p-3 transition-all duration-200 cursor-pointer ${s.cardColor}`}
                >
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-base ${s.iconBg}`}>
                    {s.icon}
                  </span>
                  <span className="text-sm font-semibold text-white">{s.label}</span>
                  <span className="text-xs text-slate-500 leading-snug">{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input area */}
      <div className="flex flex-col gap-2">
        <ChatInput onSend={sendMessage} disabled={isLoading} />
        {!isLoading && (
          <p className="text-center text-slate-700 text-xs">
            Enter to send · Shift+Enter for new line
          </p>
        )}
      </div>
    </div>
  );
}
