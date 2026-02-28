import { useState, useEffect } from 'react';

interface AgentStatus {
  address: string;
  network: string;
  ok: boolean;
}

export function useAgentStatus() {
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/status')
      .then((r) => r.json())
      .then((data: AgentStatus) => setStatus(data))
      .catch(() => setStatus(null))
      .finally(() => setLoading(false));
  }, []);

  return { status, loading };
}
