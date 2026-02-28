import { useState, useEffect, useRef } from 'react';
import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';
import { NETWORK, RPC_URLS } from '../config/constants';

const client = new SuiJsonRpcClient({ url: RPC_URLS[NETWORK], network: NETWORK });

export type TxConfirmStatus = 'idle' | 'polling' | 'confirmed' | 'failed' | 'timeout';

export function useTxStatus() {
  const [confirmStatus, setConfirmStatus] = useState<TxConfirmStatus>('idle');
  const [attempts, setAttempts] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopPolling() {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  function startPolling(digest: string) {
    stopPolling();
    setConfirmStatus('polling');
    setAttempts(0);
    let attempt = 0;

    async function poll() {
      attempt++;
      setAttempts(attempt);

      if (attempt > 15) {
        stopPolling();
        setConfirmStatus('timeout');
        return;
      }

      try {
        const tx = await client.getTransactionBlock({
          digest,
          options: { showEffects: true },
        });
        const status = (tx as any)?.effects?.status?.status;
        if (status === 'success') {
          stopPolling();
          setConfirmStatus('confirmed');
        } else if (status === 'failure') {
          stopPolling();
          setConfirmStatus('failed');
        }
        // otherwise keep polling — node not indexed yet
      } catch {
        // node not indexed yet, keep polling
      }
    }

    poll(); // immediate first poll
    intervalRef.current = setInterval(poll, 2000);
  }

  function reset() {
    stopPolling();
    setConfirmStatus('idle');
    setAttempts(0);
  }

  useEffect(() => {
    return () => stopPolling();
  }, []);

  return { confirmStatus, attempts, startPolling, reset };
}
