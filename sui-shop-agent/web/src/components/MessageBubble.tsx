import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessage } from '../hooks/useChat';
import { ToolBadge } from './ToolBadge';

interface Props {
  message: ChatMessage;
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">
          {message.text}
        </div>
      </div>
    );
  }

  // Agent message
  return (
    <div className="flex justify-start">
      <div
        className={[
          'max-w-[85%] rounded-2xl rounded-tl-sm px-4 py-3 border',
          message.isError
            ? 'bg-red-950/40 border-red-800 text-red-300'
            : 'bg-gray-800 border-gray-700 text-gray-100',
        ].join(' ')}
      >
        {/* Tool badges shown above the response text */}
        {message.tools.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {message.tools.map((tool, i) => (
              <ToolBadge key={i} name={tool.name} />
            ))}
          </div>
        )}

        {/* Message text */}
        <div className="text-sm leading-relaxed">
          {message.text === '' && message.isStreaming ? (
            <span className="text-gray-500 italic">Thinking…</span>
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
                  prose-code:text-blue-300 prose-code:bg-gray-900 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
                  prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-700 prose-pre:rounded-lg prose-pre:p-3 prose-pre:my-2
                  prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
                  prose-blockquote:border-l-blue-500 prose-blockquote:text-gray-400
                  prose-hr:border-gray-700">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.text}
                  </ReactMarkdown>
                </div>
              )}
              {message.isStreaming && (
                <span className="inline-block w-1.5 h-4 ml-0.5 bg-blue-400 animate-pulse align-middle rounded-sm" />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
