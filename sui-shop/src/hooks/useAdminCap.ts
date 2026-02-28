import { useState, useEffect } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit-react';
import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';
import { ORIGINAL_PACKAGE_ID, NETWORK, RPC_URLS } from '../config/constants';

const rpc = new SuiJsonRpcClient({ url: RPC_URLS[NETWORK], network: NETWORK });

export function useAdminCap() {
  const account = useCurrentAccount();
  const [adminCapId, setAdminCapId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!account?.address) {
      setAdminCapId(null);
      return;
    }

    const check = async () => {
      setLoading(true);
      try {
        const adminCapType = `${ORIGINAL_PACKAGE_ID}::shop::AdminCap`;
        const result = await rpc.getOwnedObjects({
          owner: account.address,
          filter: { StructType: adminCapType },
          options: { showType: true },
        });

        const cap = result.data[0]?.data ?? null;
        setAdminCapId(cap?.objectId ?? null);
      } catch {
        setAdminCapId(null);
      } finally {
        setLoading(false);
      }
    };

    check();
  }, [account?.address]);

  return { adminCapId, isAdmin: adminCapId !== null, loading };
}
