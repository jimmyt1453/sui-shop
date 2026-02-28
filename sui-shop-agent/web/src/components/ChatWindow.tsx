import { useEffect, useRef } from 'react';
import { useChat } from '../hooks/useChat';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';

const SUGGESTIONS = [
  'What products are available?',
  'Check the agent wallet balance',
  'Show my order history',
  'Buy Steam Gift Card $10 and send to me@example.com',
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
      {/* Message list */}
      <div className="flex-1 flex flex-col gap-4 overflow-y-auto min-h-0 pr-1">
        {messages.length === 0 ? (
          /* Welcome screen */
          <div className="flex flex-col items-center justify-center flex-1 gap-6 py-16">
            <div className="text-6xl select-none">🤖</div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-white mb-1">Jimmy's SUI Shop Agent</h2>
              <p className="text-gray-500 text-sm max-w-sm">
                I can browse products, check wallet balances, and make purchases on the SUI blockchain using natural language.
              </p>
            </div>
            {/* Suggestion chips */}
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-sm text-gray-300 bg-gray-800 border border-gray-700 hover:border-blue-500 hover:text-white rounded-full px-4 py-2 transition-colors cursor-pointer"
                >
                  {s}
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
        {messages.length > 0 && (
          <div className="flex justify-end">
            <button
              onClick={clearMessages}
              disabled={isLoading}
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
            >
              Clear conversation
            </button>
          </div>
        )}
        <ChatInput onSend={sendMessage} disabled={isLoading} />
        <p className="text-center text-gray-700 text-xs">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
