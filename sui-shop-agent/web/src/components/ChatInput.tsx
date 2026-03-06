import { useState, useRef, useEffect, type KeyboardEvent } from 'react';

interface Props {
  onSend: (text: string) => void;
  disabled: boolean;
}

export function ChatInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  };

  return (
    <div className="relative bg-black rounded-xl shadow-2xl input-wrapper">
      <div className="input-glow"></div>
      <div className={`relative border focus-within:border-gray-600 rounded-xl bg-black flex items-end p-2 transition-colors ${disabled ? 'border-gray-800' : 'border-subtle'}`}>
        <div className="p-2.5 text-gray-500 shrink-0 cursor-default">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
        </div>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder="Message SuiPulse..."
          disabled={disabled}
          rows={1}
          className="w-full bg-transparent px-2 py-2.5 text-[14px] text-white placeholder-gray-600 focus:outline-none resize-none disabled:opacity-50"
          style={{ maxHeight: '160px' }}
        />
        <button
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className="p-2 mb-0.5 mr-0.5 bg-white text-black rounded-lg hover:bg-gray-200 transition-all shadow-md shadow-white/10 shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {disabled ? (
            <svg className="w-4 h-4 animate-spin text-black" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
          )}
        </button>
      </div>
    </div>
  );
}
