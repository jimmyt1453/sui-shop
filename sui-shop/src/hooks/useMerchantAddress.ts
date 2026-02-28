import { useState, useCallback } from 'react';
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { SHOP_OBJECT_ID, NETWORK, GRPC_URLS } from '../config/constants';

const grpc = new SuiGrpcClient({ network: NETWORK, baseUrl: GRPC_URLS[NETWORK] });

export function useMerchantAddress() {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const shopObj = await grpc.getObject({
        objectId: SHOP_OBJECT_ID,
        include: { json: true },
      });
      const fields = shopObj.object.json as Record<string, any> | undefined;
      setAddress(String(fields?.merchant_address ?? ''));
    } catch (err: any) {
      setError(err.message ?? 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  return { address, loading, error, refetch: fetch };
}
