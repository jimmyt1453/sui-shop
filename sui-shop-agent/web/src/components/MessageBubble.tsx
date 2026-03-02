import { useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessage } from '../hooks/useChat';
import { ToolBadge } from './ToolBadge';

interface Props {
  message: ChatMessage;
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';
  const timestampRef = useRef<number>(Date.now());
  const timeStr = new Date(timestampRef.current).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isUser) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="max-w-[80%] bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-lg shadow-blue-500/15">
          {message.text}
        </div>
        <span className="text-slate-700 text-xs pr-1">{timeStr}</span>
      </div>
    );
  }

  // Agent message
  const isThinking = message.text === '' && message.isStreaming;

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex items-start gap-2">
        {/* Gradient avatar */}
        <div className="shrink-0 w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-xs mt-0.5 shadow-md shadow-blue-500/20">
          🤖
        </div>

        <div
          className={[
            'max-w-[85%] rounded-2xl rounded-tl-sm px-4 py-3 border backdrop-blur-sm',
            message.isError
              ? 'bg-red-950/40 border-red-800/60 text-red-300'
              : 'bg-white/[0.04] border-white/[0.08] text-slate-100',
          ].join(' ')}
        >
          {/* Message text */}
          <div className="text-sm leading-relaxed">
            {isThinking ? (
              <span className="flex items-center gap-1 py-0.5">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </span>
            ) : (
              <>
                {message.isError ? (
                  <span className="whitespace-pre-wrap">{message.text}</span>
                ) : (
                  <div className="prose prose-sm prose-invert max-w-none
                    prose-p:my-1 prose-p:leading-relaxed
                    prose-headings:text-white prose-headings:font-bold prose-headings:mt-3 prose-headings:mb-1
                    prose-ul:my-1 prose-ul:pl-4 prose-li:my-0.5
                    prose-ol:my-1 prose-ol:pl-4
                    prose-strong:text-white
                    prose-code:text-blue-300 prose-code:bg-slate-900/80 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
                    prose-pre:bg-slate-900/80 prose-pre:border prose-pre:border-slate-700/60 prose-pre:rounded-xl prose-pre:p-3 prose-pre:my-2
                    prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
                    prose-blockquote:border-l-indigo-500 prose-blockquote:text-slate-400
                    prose-hr:border-slate-700">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.text}
                    </ReactMarkdown>
                  </div>
                )}
                {message.isStreaming && (
                  <span className="inline-block w-1.5 h-4 ml-0.5 bg-slate-400 animate-pulse align-middle rounded-sm" />
                )}
              </>
            )}
          </div>

          {/* Tool badges below text, only when done streaming */}
          {message.tools.length > 0 && !message.isStreaming && (
            <div className="border-t border-white/10 mt-2 pt-2 flex flex-wrap gap-1.5">
              {message.tools.map((tool, i) => (
                <ToolBadge key={i} name={tool.name} />
              ))}
            </div>
          )}
        </div>
      </div>
      <span className="text-slate-600 text-xs pl-8">{timeStr}</span>
    </div>
  );
}
