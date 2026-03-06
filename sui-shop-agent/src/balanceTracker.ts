import { getClient, getAgentAddress } from './tools/sui-client.js';
import { getUsdcType } from './config.js';

export interface BalanceSnapshot {
  suiBalance: number;   // raw MIST
  usdcBalance: number;  // raw micro-USDC
  timestamp: number;    // ms epoch
}

const history: BalanceSnapshot[] = [];
let current: BalanceSnapshot | null = null;

export async function sampleBalance(): Promise<void> {
  try {
    const client = getClient();
    const address = getAgentAddress();
    const [sui, usdc] = await Promise.all([
      client.getBalance({ owner: address }),
      client.getBalance({ owner: address, coinType: getUsdcType() }),
    ]);
    const snapshot: BalanceSnapshot = {
      suiBalance: Number(sui.totalBalance),
      usdcBalance: Number(usdc.totalBalance),
      timestamp: Date.now(),
    };
    current = snapshot;
    history.push(snapshot);
    if (history.length > 100) history.shift();
    console.log(`[balanceTracker] SUI: ${(snapshot.suiBalance / 1e9).toFixed(4)} | USDC: ${(snapshot.usdcBalance / 1e6).toFixed(2)}`);
  } catch (err: any) {
    console.error('[balanceTracker] sample error:', err.message);
  }
}

export function getLatestBalance(): BalanceSnapshot | null {
  return current;
}

export function getBalanceHistory(): BalanceSnapshot[] {
  return history;
}

export async function startBalanceTracker(intervalMs = 60_000): Promise<void> {
  console.log('[balanceTracker] Starting...');
  await sampleBalance();
  setInterval(sampleBalance, intervalMs);
}
