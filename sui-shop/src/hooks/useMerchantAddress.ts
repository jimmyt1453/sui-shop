import { useState, useCallback } from 'react';
import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';
import { SHOP_OBJECT_ID, NETWORK, RPC_URLS } from '../config/constants';

const rpc = new SuiJsonRpcClient({ url: RPC_URLS[NETWORK], network: NETWORK });

export function useMerchantAddress() {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const shopObj = await rpc.getObject({
        id: SHOP_OBJECT_ID,
        options: { showContent: true },
      });
      const fields = (shopObj.data?.content?.dataType === 'moveObject'
        ? shopObj.data.content.fields
        : null) as Record<string, any> | null;
      setAddress(String(fields?.merchant_address ?? ''));
    } catch (err: any) {
      setError(err.message ?? 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  return { address, loading, error, refetch: fetch };
}
