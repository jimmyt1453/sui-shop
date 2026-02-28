import { useState, useCallback, useRef } from 'react';

export type MessageRole = 'user' | 'agent';

export interface ToolEvent {
  name: string;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  tools: ToolEvent[];
  isStreaming: boolean;
  isError: boolean;
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // Each browser session gets a stable UUID used to resume the Claude session.
  const sessionIdRef = useRef<string>(crypto.randomUUID());
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (userText: string) => {
      if (!userText.trim() || isLoading) return;

      const userId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        { id: userId, role: 'user', text: userText, tools: [], isStreaming: false, isError: false },
      ]);

      const agentId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        { id: agentId, role: 'agent', text: '', tools: [], isStreaming: true, isError: false },
      ]);

      setIsLoading(true);
      const abort = new AbortController();
      abortRef.current = abort;

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userText, sessionId: sessionIdRef.current }),
          signal: abort.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(`Server error: HTTP ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          const parts = buffer.split('\n\n');
          buffer = parts.pop() ?? '';

          for (const part of parts) {
            const line = part.trim();
            if (!line.startsWith('data: ')) continue;

            let event: { type: string; content?: string; name?: string; message?: string };
            try {
              event = JSON.parse(line.slice(6));
            } catch {
              continue;
            }

            setMessages((prev) =>
              prev.map((msg) => {
                if (msg.id !== agentId) return msg;

                switch (event.type) {
                  case 'thinking':
                    return { ...msg, text: '' };
                  case 'tool':
                    return { ...msg, tools: [...msg.tools, { name: event.name! }] };
                  case 'text':
                    return { ...msg, text: msg.text + (event.content ?? '') };
                  case 'done':
                    return { ...msg, isStreaming: false };
                  case 'error':
                    return { ...msg, text: event.message ?? 'An error occurred', isStreaming: false, isError: true };
                  default:
                    return msg;
                }
              })
            );
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === agentId
              ? { ...msg, text: 'Connection error — is the server running?', isStreaming: false, isError: true }
              : msg
          )
        );
      } finally {
        setIsLoading(false);
        abortRef.current = null;
      }
    },
    [isLoading]
  );

  const clearMessages = useCallback(async () => {
    abortRef.current?.abort();

    // Tell the server to drop the current session so next message starts fresh
    const oldSessionId = sessionIdRef.current;
    sessionIdRef.current = crypto.randomUUID();

    setMessages([]);
    setIsLoading(false);

    // Fire-and-forget: don't block UI on server response
    fetch(`/api/sessions/${oldSessionId}`, { method: 'DELETE' }).catch(() => {});
  }, []);

  return { messages, isLoading, sendMessage, clearMessages };
}
