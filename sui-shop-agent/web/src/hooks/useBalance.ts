import { useState, useEffect, useCallback } from 'react';

export interface BalanceSnapshot {
  suiBalance: number;
  usdcBalance: number;
  timestamp: number;
}

export function useBalance() {
  const [current, setCurrent] = useState<BalanceSnapshot | null>(null);
  const [history, setHistory] = useState<BalanceSnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchCurrent = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/balance');
      const data = await res.json();
      if (data.ok) setCurrent(data);
    } catch {
      // server may not be ready
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch('/api/balance/history');
      const data = await res.json();
      if (data.ok) setHistory(data.history);
    } catch {
      // ignore
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // Poll current balance every 30s
  useEffect(() => {
    fetchCurrent();
    const interval = setInterval(fetchCurrent, 30_000);
    return () => clearInterval(interval);
  }, [fetchCurrent]);

  return { current, history, loading, historyLoading, fetchHistory };
}
