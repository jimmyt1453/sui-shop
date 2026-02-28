import { useState, useEffect, useCallback } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit-react';
import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';
import { ORIGINAL_PACKAGE_ID, NETWORK, RPC_URLS } from '../config/constants';
import type { OrderReceipt } from '../types';

const client = new SuiJsonRpcClient({ url: RPC_URLS[NETWORK], network: NETWORK });

export function useOrders() {
  const account = useCurrentAccount();
  const [orders, setOrders] = useState<OrderReceipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!account?.address) {
      setOrders([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const receiptType = `${ORIGINAL_PACKAGE_ID}::shop::OrderReceipt`;

      const result = await client.getOwnedObjects({
        owner: account.address,
        filter: { StructType: receiptType },
        options: { showContent: true },
      });

      const receipts: OrderReceipt[] = [];
      for (const item of result.data) {
        const content = item.data?.content;
        if (content?.dataType === 'moveObject') {
          const fields = content.fields as Record<string, any>;
          receipts.push({
            id: item.data!.objectId,
            orderNumber: Number(fields.order_number),
            productId: Number(fields.product_id),
            productName: String(fields.product_name || ''),
            price: Number(fields.price),
            buyer: String(fields.buyer || ''),
            email: String(fields.email || ''),
            timestamp: Number(fields.timestamp),
            shopId: String(fields.shop_id || ''),
          });
        }
      }
      receipts.sort((a, b) => b.timestamp - a.timestamp);

      setOrders(receipts);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError('Failed to load order history');
    } finally {
      setLoading(false);
    }
  }, [account?.address]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, loading, error, refetch: fetchOrders };
}
