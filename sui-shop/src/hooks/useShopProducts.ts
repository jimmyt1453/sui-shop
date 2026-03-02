import { useState, useEffect, useCallback } from 'react';
import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';
import { ORIGINAL_PACKAGE_ID, SHOP_OBJECT_ID, NETWORK, RPC_URLS } from '../config/constants';

const rpc = new SuiJsonRpcClient({ url: RPC_URLS[NETWORK], network: NETWORK });

function decodeField(val: number[] | string | unknown): string {
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return new TextDecoder().decode(new Uint8Array(val));
  return '';
}

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
      const shopObj = await rpc.getObject({
        id: SHOP_OBJECT_ID,
        options: { showContent: true },
      });

      const shopFields = (shopObj.data?.content?.dataType === 'moveObject'
        ? shopObj.data.content.fields
        : null) as Record<string, any> | null;
      const productCount = Number(shopFields?.product_count ?? 0);

      // Fetch each product via dynamic fields
      const results: OnChainProduct[] = [];
      for (let i = 0; i < productCount; i++) {
        try {
          const df = await rpc.getDynamicFieldObject({
            parentId: SHOP_OBJECT_ID,
            name: {
              type: `${ORIGINAL_PACKAGE_ID}::shop::ProductKey`,
              value: { product_id: String(i) },
            },
          });

          // Product data is nested under the dynamic field wrapper's value.fields
          const outerFields = (df.data?.content?.dataType === 'moveObject'
            ? df.data.content.fields
            : null) as Record<string, any> | null;
          const fields = (outerFields?.value?.fields ?? outerFields) as Record<string, any> | null;

          if (fields) {
            results.push({
              id: i,
              name: decodeField(fields.name),
              description: decodeField(fields.description),
              price: Number(fields.price ?? 0),
              imageUrl: decodeField(fields.image_url),
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
