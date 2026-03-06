import { useState, useEffect, useCallback } from 'react';

export interface Order {
  orderNumber: number;
  productId: number;
  productName: string;
  price: number;
  timestamp: number;
  buyer: string;
  txDigest: string;
  receiptId: string;
}

export function useOrders(limit = 10) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/recent?limit=${limit}`);
      const data = await res.json();
      if (data.ok) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [fetchOrders]);

  return { orders, loading, refresh: fetchOrders };
}
