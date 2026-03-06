import { useEffect, useRef } from 'react';
import { useChat } from '../hooks/useChat';
import { useToast } from '../hooks/useToast';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { ToastStack } from './Toast';

const SUGGESTIONS: { icon: string; label: string; text: string; cardColor: string; iconBg: string }[] = [
  {
    icon: '📦',
    label: 'Browse Products',
    text: 'What products are available?',
    cardColor: 'bg-black border-subtle hover:border-gray-600',
    iconBg: 'bg-subtle text-white border-subtle',
  },
  {
    icon: '💰',
    label: 'Check Balance',
    text: 'Check the agent wallet balance',
    cardColor: 'bg-black border-subtle hover:border-gray-600',
    iconBg: 'bg-subtle text-white border-subtle',
  },
  {
    icon: '📜',
    label: 'Order History',
    text: 'Show my order history',
    cardColor: 'bg-black border-subtle hover:border-gray-600',
    iconBg: 'bg-subtle text-white border-subtle',
  },
  {
    icon: '🛒',
    label: 'Make a Purchase',
    text: 'Buy Steam Gift Card $10 and send to me@example.com',
    cardColor: 'bg-black border-subtle hover:border-gray-600',
    iconBg: 'bg-subtle text-white border-subtle',
  },
];

const QUICK_CHIPS: { icon: string; label: string; text: string }[] = [
  { icon: '📦', label: 'Products', text: 'What products are available?' },
  { icon: '💰', label: 'Balance', text: 'Check the agent wallet balance' },
  { icon: '📜', label: 'History', text: 'Show my order history' },
];

export function ChatWindow() {
  const { toasts, addToast, removeToast } = useToast();

  const handlePurchaseComplete = (text: string) => {
    const success = /successful/i.test(text);
    addToast(
      success
        ? { type: 'success', title: 'Purchase complete!', message: 'Transaction submitted to the SUI blockchain.' }
        : { type: 'error', title: 'Purchase failed', message: 'Check the agent response for details.' }
    );
  };

  const { messages, isLoading, sendMessage, clearMessages } = useChat(handlePurchaseComplete);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = (text: string) => {
    sendMessage(text);
  };

  return (
    <>
      <ToastStack toasts={toasts} onRemove={removeToast} />

      <div className="flex flex-col flex-1 min-h-0 relative z-10">
        {/* Message list */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 space-y-8 scroll-smooth no-scrollbar relative">
          {messages.length === 0 ? (
            /* Welcome screen */
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in fade-in duration-700">
                <div className="relative w-24 h-24 mb-6">
                    {/* Rotating dash ring */}
                    <svg className="absolute inset-0 w-full h-full text-blue-500/20 animate-[spin_10s_linear_infinite]" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 8" />
                    </svg>
                    {/* Inner pulse ring */}
                    <svg className="absolute inset-0 w-full h-full text-emerald-500/20" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="1">
                            <animate attributeName="r" values="35; 40; 35" dur="3s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="1; 0.5; 1" dur="3s" repeatCount="indefinite" />
                        </circle>
                    </svg>
                    {/* Center Logo */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 bg-white text-black rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                    </div>
                </div>
                <h2 className="text-lg font-medium text-white tracking-tight">SuiPulse Initialized</h2>
                <p className="text-sm text-gray-500 max-w-xs mt-2 mb-8 leading-relaxed">Securely connected. I can check balances, list inventory, and execute purchases.</p>

              {/* 2×2 suggestion cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => handleSend(s.text)}
                    className={`flex flex-col items-start gap-2 text-left border rounded-xl p-4 transition-all duration-300 cursor-pointer group ${s.cardColor}`}
                  >
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-transform group-hover:scale-110 ${s.iconBg}`}>
                      {s.icon}
                    </span>
                    <div>
                      <span className="text-[13px] font-medium text-gray-200 block">{s.label}</span>
                      <span className="text-[11px] text-gray-500 leading-snug mt-1 line-clamp-2">{s.text}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              <div ref={bottomRef} className="h-4" />
            </>
          )}
        </div>

        {/* Input area */}
        <div className="p-4 sm:p-6 shrink-0 w-full relative z-20">
            {/* Quick reply chips */}
            {messages.length > 0 && !isLoading && (
              <div className="flex items-center gap-2 flex-wrap mb-4 overflow-x-auto no-scrollbar">
                {QUICK_CHIPS.map((chip) => (
                  <button
                    key={chip.label}
                    onClick={() => handleSend(chip.text)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-black border border-subtle hover:border-gray-600 text-gray-400 hover:text-white text-[11px] font-medium rounded-full transition-all duration-200 cursor-pointer whitespace-nowrap active:scale-95"
                  >
                    <span>{chip.icon}</span>
                    <span>{chip.label}</span>
                  </button>
                ))}
                
                <button
                  onClick={clearMessages}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-black hover:bg-gray-900 border border-subtle hover:border-red-900/50 text-gray-500 hover:text-red-400 text-[11px] font-medium rounded-full transition-all duration-200 cursor-pointer ml-auto"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
                  </svg>
                  Clear Session
                </button>
              </div>
            )}

            <ChatInput onSend={handleSend} disabled={isLoading} />
            
            <div className="flex justify-center items-center mt-3 h-4">
              {!isLoading && messages.length === 0 ? (
                <span className="text-[10px] text-gray-600 font-mono flex items-center gap-1.5">
                    <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    Secure on-chain execution
                </span>
              ) : null}
            </div>
        </div>
      </div>
    </>
  );
}
