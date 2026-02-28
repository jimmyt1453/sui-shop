import { useState, useEffect } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit-react';
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { NETWORK, GRPC_URLS, getUsdcType } from '../config/constants';

const client = new SuiGrpcClient({ network: NETWORK, baseUrl: GRPC_URLS[NETWORK] });

export interface UsdcCoin {
  coinObjectId: string;
  balance: number;
}

export function useUsdcBalance() {
  const account = useCurrentAccount();
  const [balance, setBalance] = useState<number>(0);
  const [coins, setCoins] = useState<UsdcCoin[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!account?.address) {
      setBalance(0);
      setCoins([]);
      return;
    }

    const fetchBalance = async () => {
      setLoading(true);
      try {
        const usdcType = getUsdcType();
        const result = await client.listCoins({
          owner: account.address,
          coinType: usdcType,
        });

        const usdcCoins: UsdcCoin[] = result.objects.map((coin) => ({
          coinObjectId: coin.objectId,
          balance: Number(coin.balance),
        }));

        const total = usdcCoins.reduce((sum, c) => sum + c.balance, 0);
        setCoins(usdcCoins);
        setBalance(total);
      } catch (err) {
        console.error('Failed to fetch USDC balance:', err);
        setBalance(0);
        setCoins([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, [account?.address]);

  return { balance, coins, loading };
}
