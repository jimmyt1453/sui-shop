import { useEffect, useRef } from 'react';
import { useChat } from '../hooks/useChat';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';

const SUGGESTIONS: { icon: string; label: string; text: string }[] = [
  { icon: '📋', label: 'Browse Products', text: 'What products are available?' },
  { icon: '💰', label: 'Check Balance', text: 'Check the agent wallet balance' },
  { icon: '📜', label: 'Order History', text: 'Show my order history' },
  { icon: '🛒', label: 'Make a Purchase', text: 'Buy Steam Gift Card $10 and send to me@example.com' },
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
            className="flex items-center gap-1 text-xs text-gray-600 hover:text-red-400 transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
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
          <div className="flex flex-col items-center justify-center flex-1 gap-6 py-16">
            {/* Gradient hero icon with pulse ring */}
            <div className="relative flex items-center justify-center">
              <span className="absolute w-16 h-16 bg-blue-600/30 rounded-2xl motion-safe:animate-ping" />
              <div className="relative w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center text-3xl select-none shadow-lg">
                🤖
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-white mb-1">Jimmy's SUI Shop Agent</h2>
              <p className="text-gray-500 text-sm max-w-sm">
                I can browse products, check wallet balances, and make purchases on the SUI blockchain using natural language.
              </p>
            </div>
            {/* 2×2 suggestion card grid */}
            <div className="grid grid-cols-2 gap-3 max-w-sm w-full px-4">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => sendMessage(s.text)}
                  className="flex flex-col items-start gap-1 text-left bg-gray-800 border border-gray-700 hover:border-blue-500 hover:bg-gray-750 rounded-xl p-3 transition-colors cursor-pointer"
                >
                  <span className="text-xl">{s.icon}</span>
                  <span className="text-sm font-semibold text-white">{s.label}</span>
                  <span className="text-xs text-gray-500 leading-snug">{s.text}</span>
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
          <p className="text-center text-gray-700 text-xs">
            Enter to send · Shift+Enter for new line
          </p>
        )}
      </div>
    </div>
  );
}
