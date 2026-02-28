import { useState, useEffect, useCallback } from 'react';
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';
import { PACKAGE_ID, SHOP_OBJECT_ID, NETWORK, GRPC_URLS, RPC_URLS } from '../config/constants';

const grpc = new SuiGrpcClient({ network: NETWORK, baseUrl: GRPC_URLS[NETWORK] });
const rpc = new SuiJsonRpcClient({ url: RPC_URLS[NETWORK], network: NETWORK });

export interface OnChainProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  active: boolean;
}

export function useShopProducts() {
  const [products, setProducts] = useState<OnChainProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Get shop object to find product_count
      const shopObj = await grpc.getObject({
        objectId: SHOP_OBJECT_ID,
        include: { json: true },
      });

      const shopFields = shopObj.object.json as Record<string, any> | undefined;
      const productCount = Number(shopFields?.product_count ?? 0);

      // Fetch each product via dynamic fields
      const results: OnChainProduct[] = [];
      for (let i = 0; i < productCount; i++) {
        try {
          const df = await rpc.getDynamicFieldObject({
            parentId: SHOP_OBJECT_ID,
            name: {
              type: `${PACKAGE_ID}::shop::ProductKey`,
              value: { product_id: String(i) },
            },
          });

          const fields = (df.data?.content?.dataType === 'moveObject'
            ? df.data.content.fields
            : null) as Record<string, any> | null;

          if (fields) {
            results.push({
              id: i,
              name: String(fields.name ?? ''),
              description: String(fields.description ?? ''),
              price: Number(fields.price ?? 0),
              imageUrl: String(fields.image_url ?? ''),
              active: Boolean(fields.active),
            });
          }
        } catch {
          // product may not exist
        }
      }

      setProducts(results);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { products, loading, error, refetch: fetch };
}
