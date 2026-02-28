import { useState, useEffect, useCallback } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit-react';
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { PACKAGE_ID, NETWORK, GRPC_URLS } from '../config/constants';
import type { OrderReceipt } from '../types';

const client = new SuiGrpcClient({ network: NETWORK, baseUrl: GRPC_URLS[NETWORK] });

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
      const receiptType = `${PACKAGE_ID}::shop::OrderReceipt`;

      const result = await client.listOwnedObjects({
        owner: account.address,
        type: receiptType,
        include: {
          json: true,
        },
      });

      const receipts: OrderReceipt[] = [];
      for (const obj of result.objects) {
        if (obj.json) {
          const fields = obj.json as Record<string, any>;
          receipts.push({
            id: obj.objectId,
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
