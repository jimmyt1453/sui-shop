import { getClient } from './tools/sui-client.js';
import { ORIGINAL_PACKAGE_ID } from './config.js';

const EVENT_TYPE = `${ORIGINAL_PACKAGE_ID}::shop::OrderPlaced`;

export interface OrderEvent {
  orderNumber: number;
  productName: string;
  price: number;
  timestamp: number;
  buyer: string;
  txDigest: string;
}

const recentOrders: OrderEvent[] = [];
let cursor: { txDigest: string; eventSeq: string } | null = null;

function decodeBytes(val: number[] | string): string {
  if (typeof val === 'string') return val;
  return Buffer.from(val).toString('utf8');
}

async function initCursor(): Promise<void> {
  const client = getClient();
  try {
    // Fetch the last 20 events descending to pre-populate history
    const result = await client.queryEvents({
      query: { MoveEventType: EVENT_TYPE },
      limit: 20,
      order: 'descending',
    });

    if (result.data.length > 0) {
      // Add to recentOrders in newest-first order (already descending)
      for (const event of result.data) {
        const fields = event.parsedJson as Record<string, any>;
        recentOrders.push({
          orderNumber: Number(fields?.order_number ?? 0),
          productName: decodeBytes(fields?.product_name ?? ''),
          price: Number(fields?.price ?? 0),
          timestamp: Number(fields?.timestamp ?? 0),
          buyer: String(fields?.buyer ?? ''),
          txDigest: event.id.txDigest,
        });
      }
      // Cursor = most recent event — ongoing polls only catch new events
      cursor = result.data[0].id as { txDigest: string; eventSeq: string };
      console.log(`[orderWatcher] Backfilled ${result.data.length} orders, cursor set to latest`);
    } else {
      console.log('[orderWatcher] No existing events found');
    }
  } catch (err: any) {
    console.error('[orderWatcher] initCursor error:', err.message);
  }
}

async function pollNewOrders(): Promise<void> {
  const client = getClient();
  try {
    const result = await client.queryEvents({
      query: { MoveEventType: EVENT_TYPE },
      cursor,
      limit: 50,
      order: 'ascending',
    });

    for (const event of result.data) {
      const fields = event.parsedJson as Record<string, any>;
      const order: OrderEvent = {
        orderNumber: Number(fields?.order_number ?? 0),
        productName: decodeBytes(fields?.product_name ?? ''),
        price: Number(fields?.price ?? 0),
        timestamp: Number(fields?.timestamp ?? 0),
        buyer: String(fields?.buyer ?? ''),
        txDigest: event.id.txDigest,
      };

      console.log(`[orderWatcher] NEW ORDER #${order.orderNumber}: ${order.productName} (${order.buyer.slice(0, 10)}...)`);
      recentOrders.unshift(order);
      if (recentOrders.length > 100) recentOrders.pop();
    }

    if (result.data.length > 0) {
      cursor = result.data[result.data.length - 1].id as { txDigest: string; eventSeq: string };
    }
  } catch (err: any) {
    console.error('[orderWatcher] poll error:', err.message);
  }
}

export function getRecentOrders(): OrderEvent[] {
  return recentOrders;
}

export async function startOrderWatcher(intervalMs = 10_000): Promise<void> {
  console.log('[orderWatcher] Starting...');
  await initCursor();
  await pollNewOrders();
  setInterval(pollNewOrders, intervalMs);
}
