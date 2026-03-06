import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessage } from '../hooks/useChat';
import { useAgentStatus } from '../hooks/useAgentStatus';

interface Props {
  message: ChatMessage;
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';
  const { status } = useAgentStatus();
  const network = status?.network || 'testnet';

  if (isUser) {
    return (
      <div className="flex gap-4 group animate-in slide-in-from-right-4 duration-300">
        <div className="w-7 h-7 rounded border border-subtle bg-subtle flex items-center justify-center text-xs shrink-0 text-gray-400 mt-0.5 shadow-sm">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
        </div>
        <div className="flex-1">
          <div className="text-[12px] font-medium text-gray-500 mb-1">You</div>
          <div className="text-[15px] leading-relaxed text-gray-200">
            {message.text}
          </div>
        </div>
      </div>
    );
  }

  // Agent message
  const hasTools = message.tools.length > 0;
  const isThinking = message.text === '' && message.isStreaming;
  const isPurchaseSuccess = message.tools.some(t => t.name === 'purchase') && /successful/i.test(message.text);
  
  // Try to extract tx hash if it exists in the text
  const txHashMatch = message.text.match(/0x[a-fA-F0-9]{64}/);
  const txHash = txHashMatch ? txHashMatch[0] : undefined;

  return (
    <div className="flex gap-4 relative animate-in slide-in-from-left-4 duration-300">
      {/* Vertical SVG line connecting steps if tools are used */}
      {hasTools && (
        <div className="absolute left-[13.5px] top-8 bottom-4 w-px bg-gradient-to-b from-subtle via-blue-500/20 to-transparent -z-10"></div>
      )}
      
      <div className="w-7 h-7 rounded bg-white text-black flex items-center justify-center text-xs shrink-0 mt-0.5 shadow-[0_0_10px_rgba(255,255,255,0.1)] z-10">
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
      </div>
      
      <div className="flex-1 space-y-5">
        <div className="text-[12px] font-medium text-gray-500 mb-1">SuiPulse</div>
        
        {/* Tool Trace */}
        {hasTools && (
          <div className="space-y-3 font-mono text-[11px] mb-4">
            {message.tools.map((tool, i) => (
              <TraceStep key={i} name={tool.name} />
            ))}
          </div>
        )}

        {/* Thinking State */}
        {isThinking && !hasTools && (
          <div className="flex items-center gap-2">
            <svg className="w-6 h-2 think-pulse" viewBox="0 0 24 8">
              <circle cx="4" cy="4" r="3" fill="#ededed"/>
              <circle cx="12" cy="4" r="3" fill="#ededed"/>
              <circle cx="20" cy="4" r="3" fill="#ededed"/>
            </svg>
          </div>
        )}

        {/* Final response text */}
        {message.text && (
          <div className="text-[15px] leading-relaxed text-gray-200 prose prose-invert max-w-none
            prose-p:my-1 prose-p:leading-relaxed
            prose-headings:text-white prose-headings:font-bold prose-headings:mt-3 prose-headings:mb-1
            prose-ul:my-1 prose-ul:pl-4 prose-li:my-0.5
            prose-ol:my-1 prose-ol:pl-4
            prose-strong:text-white
            prose-code:text-blue-300 prose-code:bg-gray-900 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-[12px]
            prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-800 prose-pre:rounded-xl prose-pre:p-3 prose-pre:my-2
            prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.text}
            </ReactMarkdown>
            {message.isStreaming && (
              <span className="inline-block w-1.5 h-4 ml-0.5 bg-blue-500 animate-pulse align-middle rounded-sm" />
            )}
          </div>
        )}

        {/* If purchase was successful, show the rich card */}
        {isPurchaseSuccess && !message.isStreaming && (
          <PurchaseSuccessCard txHash={txHash} network={network} />
        )}
      </div>
    </div>
  );
}

function TraceStep({ name }: { name: string }) {
  const getToolDescription = (toolName: string) => {
    switch (toolName) {
      case 'get_inventory': return '15 items available';
      case 'get_balance': return 'Balance checked';
      case 'purchase': return 'Transaction submitted';
      case 'get_orders': return 'History retrieved';
      default: return 'Action complete';
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-left-2 duration-300">
      <div className="flex items-start gap-3">
        <svg className="w-3 h-3 text-blue-500 mt-0.5 shrink-0 bg-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
        <div>
          <span className="text-blue-400">call</span> <span className="text-gray-300">{name}()</span>
          <div className="text-emerald-500/80 mt-1 flex items-center gap-1.5">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
            {getToolDescription(name)}
          </div>
        </div>
      </div>
    </div>
  );
}

function PurchaseSuccessCard({ txHash, network }: { txHash?: string, network: string }) {
  return (
    <div className="border border-subtle rounded-xl p-4 flex items-center justify-between bg-black hover:border-gray-600 transition-colors max-w-sm group shadow-sm animate-in zoom-in-95 duration-500">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 border border-subtle rounded flex items-center justify-center bg-subtle relative overflow-hidden shrink-0">
          <svg className="absolute w-full h-full text-blue-500/10 scale-150 group-hover:rotate-12 transition-transform duration-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
          <svg className="w-5 h-5 text-gray-300 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-white truncate">Purchase Complete</p>
          {txHash ? (
            <p className="text-[11px] text-emerald-400 font-mono mt-0.5 truncate">Confirmed on {network}</p>
          ) : (
            <p className="text-[11px] text-emerald-400 font-mono mt-0.5 truncate">Confirmed on {network}</p>
          )}
        </div>
      </div>
      {txHash && (
        <a 
          href={`https://suiscan.xyz/${network}/tx/${txHash}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-white text-black px-4 py-2 rounded text-xs font-semibold hover:bg-gray-200 transition-colors active:scale-95 shadow-lg shadow-white/10 shrink-0 ml-4 whitespace-nowrap"
        >
          View Tx
        </a>
      )}
    </div>
  );
}
