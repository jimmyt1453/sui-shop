import { tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import { Transaction } from '@mysten/sui/transactions';
import { getKeypair, getClient, getAgentAddress } from './sui-client.js';
import {
  PRODUCTS,
  PACKAGE_ID,
  ORIGINAL_PACKAGE_ID,
  SHOP_OBJECT_ID,
  CLOCK_OBJECT_ID,
  getUsdcType,
  formatUsdc,
  NETWORK,
  type ProductInfo,
} from '../config.js';
import { getRecentOrders } from '../orderWatcher.js';
import { getLatestBalance } from '../balanceTracker.js';

// ===== Dynamic product cache =====
interface CachedProducts {
  products: ProductInfo[];
  expiresAt: number;
}
let productCache: CachedProducts | null = null;

function decodeField(val: number[] | string | unknown): string {
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return Buffer.from(val).toString('utf8');
  return '';
}

async function fetchProductsFromChain(): Promise<ProductInfo[]> {
  if (productCache && Date.now() < productCache.expiresAt) {
    return productCache.products;
  }

  const client = getClient();
  try {
    const shopObj = await client.getObject({
      id: SHOP_OBJECT_ID,
      options: { showContent: true },
    });
    const shopFields = (shopObj.data?.content?.dataType === 'moveObject'
      ? shopObj.data.content.fields
      : null) as Record<string, any> | null;
    const productCount = Number(shopFields?.product_count ?? 0);

    const fetches = Array.from({ length: productCount }, (_, i) =>
      client.getDynamicFieldObject({
        parentId: SHOP_OBJECT_ID,
        name: {
          type: `${ORIGINAL_PACKAGE_ID}::shop::ProductKey`,
          value: { product_id: String(i) },
        },
      }).catch(() => null)
    );
    const dfObjects = await Promise.all(fetches);
    const results: ProductInfo[] = dfObjects
      .map((df, i) => {
        if (!df) return null;
        const outerFields = (df.data?.content?.dataType === 'moveObject'
          ? df.data.content.fields
          : null) as Record<string, any> | null;
        const fields = (outerFields?.value?.fields ?? outerFields) as Record<string, any> | null;
        if (!fields) return null;
        return {
          id: i,
          name: decodeField(fields.name),
          description: decodeField(fields.description),
          price: Number(fields.price ?? 0),
          category: 'Digital',
        };
      })
      .filter((p): p is ProductInfo => p !== null);

    productCache = { products: results, expiresAt: Date.now() + 300_000 };
    return results;
  } catch {
    // Fall back to hardcoded list if chain is unreachable
    return PRODUCTS;
  }
}

// Call at server startup to pre-populate cache before any user request
export function warmProductCache(): void {
  fetchProductsFromChain().catch(() => {});
}

// ===== Tool 1: List Products =====
const listProductsTool = tool(
  'list_products',
  'List all available products in Jimmy\'s SUI Shop with names, prices (in USDC), and IDs. Use this to find product IDs before purchasing.',
  {},
  async () => {
    const products = await fetchProductsFromChain();
    const productList = products.map(
      (p) =>
        `ID: ${p.id} | ${p.name} | ${formatUsdc(p.price)} USDC | Category: ${p.category}`
    ).join('\n');

    return {
      content: [
        {
          type: 'text' as const,
          text: `Available products in Jimmy's SUI Shop:\n\n${productList}`,
        },
      ],
    };
  },
  { annotations: { readOnly: true } }
);

// ===== Tool 2: Get Balance =====
const getBalanceTool = tool(
  'get_balance',
  'Check the agent wallet\'s SUI and USDC balance. Use this before purchasing to verify sufficient funds.',
  {},
  async () => {
    try {
      const address = getAgentAddress();
      const cached = getLatestBalance();
      if (cached) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Agent Wallet: ${address}\nSUI Balance: ${(cached.suiBalance / 1e9).toFixed(4)} SUI\nUSDC Balance: ${formatUsdc(cached.usdcBalance)} USDC\nNetwork: ${NETWORK}`,
            },
          ],
        };
      }
      // Tracker not yet run — fall back to live RPC
      const client = getClient();
      const [suiBalance, usdcBalance] = await Promise.all([
        client.getBalance({ owner: address }),
        client.getBalance({ owner: address, coinType: getUsdcType() }),
      ]);
      return {
        content: [
          {
            type: 'text' as const,
            text: `Agent Wallet: ${address}\nSUI Balance: ${(Number(suiBalance.totalBalance) / 1e9).toFixed(4)} SUI\nUSDC Balance: ${formatUsdc(Number(usdcBalance.totalBalance))} USDC\nNetwork: ${NETWORK}`,
          },
        ],
      };
    } catch (err: any) {
      return {
        content: [
          { type: 'text' as const, text: `Error checking balance: ${err.message}` },
        ],
        isError: true,
      };
    }
  },
  { annotations: { readOnly: true } }
);

// ===== Tool 3: Purchase =====
const purchaseTool = tool(
  'purchase',
  'Purchase one or more products from Jimmy\'s SUI Shop. Provide product IDs and the delivery email. Multiple products can be purchased in a single transaction. The agent wallet pays with USDC.',
  {
    product_ids: z
      .array(z.number())
      .describe('Array of product IDs to purchase (e.g., [0, 9] for Steam $10 and Roblox)'),
    email: z
      .string()
      .email()
      .describe('Email address for digital product delivery'),
  },
  async ({ product_ids, email }) => {
    try {
      const client = getClient();
      const keypair = getKeypair();
      const address = getAgentAddress();
      const usdcType = getUsdcType();

      // Validate product IDs
      const availableProducts = await fetchProductsFromChain();
      const purchases: Array<{ id: number; name: string; price: number }> = [];
      for (const pid of product_ids) {
        const product = availableProducts.find((p) => p.id === pid);
        if (!product) {
          return {
            content: [
              { type: 'text' as const, text: `Error: Product ID ${pid} not found. Use list_products to see available products.` },
            ],
            isError: true,
          };
        }
        purchases.push({ id: product.id, name: product.name, price: product.price });
      }

      const totalPrice = purchases.reduce((sum, p) => sum + p.price, 0);

      // Get USDC coins
      const coinsResult = await client.getCoins({
        owner: address,
        coinType: usdcType,
        limit: 50,
      });

      if (coinsResult.data.length === 0) {
        return {
          content: [
            { type: 'text' as const, text: `Error: No USDC coins found in agent wallet. Fund the wallet first.` },
          ],
          isError: true,
        };
      }

      const totalUsdc = coinsResult.data.reduce(
        (sum, c) => sum + Number(c.balance),
        0
      );
      if (totalUsdc < totalPrice) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error: Insufficient USDC. Need ${formatUsdc(totalPrice)} USDC but only have ${formatUsdc(totalUsdc)} USDC.`,
            },
          ],
          isError: true,
        };
      }

      // Build transaction
      const tx = new Transaction();

      // Merge all USDC coins
      const coinIds = coinsResult.data.map((c) => c.coinObjectId);
      const primaryCoin = tx.object(coinIds[0]);
      if (coinIds.length > 1) {
        const otherCoins = coinIds.slice(1).map((id) => tx.object(id));
        tx.mergeCoins(primaryCoin, otherCoins);
      }

      // Add purchase calls for each product
      for (const purchase of purchases) {
        const [paymentCoin] = tx.splitCoins(primaryCoin, [
          tx.pure.u64(purchase.price),
        ]);

        tx.moveCall({
          target: `${PACKAGE_ID}::shop::purchase`,
          typeArguments: [usdcType],
          arguments: [
            tx.object(SHOP_OBJECT_ID),
            tx.pure.u64(purchase.id),
            paymentCoin,
            tx.pure.string(email),
            tx.object(CLOCK_OBJECT_ID),
          ],
        });
      }

      // Sign and execute
      const result = await client.signAndExecuteTransaction({
        transaction: tx,
        signer: keypair,
      });

      if (result.errors && result.errors.length > 0) {
        return {
          content: [
            { type: 'text' as const, text: `Purchase transaction failed! Errors: ${result.errors.join(', ')} (Digest: ${result.digest})` },
          ],
          isError: true,
        };
      }

      const digest = result.digest;
      const itemsList = purchases
        .map((p) => `  - ${p.name} (${formatUsdc(p.price)} USDC)`)
        .join('\n');

      return {
        content: [
          {
            type: 'text' as const,
            text: `Purchase successful!\n\nItems purchased:\n${itemsList}\n\nTotal: ${formatUsdc(totalPrice)} USDC\nDelivery email: ${email}\nTransaction: https://suiscan.xyz/${NETWORK}/tx/${digest}`,
          },
        ],
      };
    } catch (err: any) {
      return {
        content: [
          { type: 'text' as const, text: `Purchase failed: ${err.message}` },
        ],
        isError: true,
      };
    }
  },
  { annotations: { destructive: true } }
);

// ===== Tool 4: Order History =====
const orderHistoryTool = tool(
  'order_history',
  'View the agent\'s past purchase history from Jimmy\'s SUI Shop. Shows all on-chain order receipts.',
  {},
  async () => {
    try {
      const address = getAgentAddress();
      const myOrders = getRecentOrders().filter((o) => o.buyer === address);

      if (myOrders.length === 0) {
        return {
          content: [
            { type: 'text' as const, text: 'No orders found. The agent has not made any purchases yet.' },
          ],
        };
      }

      const orderList = myOrders
        .map(
          (o) =>
            `  #${o.orderNumber} | ${o.productName} | ${formatUsdc(o.price)} USDC | ${new Date(o.timestamp).toLocaleString()} | https://suiscan.xyz/${NETWORK}/tx/${o.txDigest}`
        )
        .join('\n');

      return {
        content: [
          {
            type: 'text' as const,
            text: `Agent Order History (${myOrders.length} orders):\n\n${orderList}`,
          },
        ],
      };
    } catch (err: any) {
      return {
        content: [
          { type: 'text' as const, text: `Error fetching orders: ${err.message}` },
        ],
        isError: true,
      };
    }
  },
  { annotations: { readOnly: true } }
);

// ===== Raw handler exports (used by direct Anthropic SDK agentic loop) =====

export async function runListProducts(): Promise<string> {
  const products = await fetchProductsFromChain();
  const productList = products.map(
    (p) => `ID: ${p.id} | ${p.name} | ${formatUsdc(p.price)} USDC | Category: ${p.category}`
  ).join('\n');
  return `Available products in Jimmy's SUI Shop:\n\n${productList}`;
}

export async function runGetBalance(): Promise<string> {
  try {
    const address = getAgentAddress();
    const cached = getLatestBalance();
    if (cached) {
      return `Agent Wallet: ${address}\nSUI Balance: ${(cached.suiBalance / 1e9).toFixed(4)} SUI\nUSDC Balance: ${formatUsdc(cached.usdcBalance)} USDC\nNetwork: ${NETWORK}`;
    }
    const client = getClient();
    const [suiBalance, usdcBalance] = await Promise.all([
      client.getBalance({ owner: address }),
      client.getBalance({ owner: address, coinType: getUsdcType() }),
    ]);
    return `Agent Wallet: ${address}\nSUI Balance: ${(Number(suiBalance.totalBalance) / 1e9).toFixed(4)} SUI\nUSDC Balance: ${formatUsdc(Number(usdcBalance.totalBalance))} USDC\nNetwork: ${NETWORK}`;
  } catch (err: any) {
    return `Error checking balance: ${err.message}`;
  }
}

export async function runPurchase(args: { product_ids: number[]; email: string }): Promise<string> {
  const { product_ids, email } = args;
  try {
    const client = getClient();
    const keypair = getKeypair();
    const address = getAgentAddress();
    const usdcType = getUsdcType();

    const availableProducts = await fetchProductsFromChain();
    const purchases: Array<{ id: number; name: string; price: number }> = [];
    for (const pid of product_ids) {
      const product = availableProducts.find((p) => p.id === pid);
      if (!product) {
        return `Error: Product ID ${pid} not found. Use list_products to see available products.`;
      }
      purchases.push({ id: product.id, name: product.name, price: product.price });
    }

    const totalPrice = purchases.reduce((sum, p) => sum + p.price, 0);

    const coinsResult = await client.getCoins({ owner: address, coinType: usdcType, limit: 50 });
    if (coinsResult.data.length === 0) {
      return `Error: No USDC coins found in agent wallet. Fund the wallet first.`;
    }

    const totalUsdc = coinsResult.data.reduce((sum, c) => sum + Number(c.balance), 0);
    if (totalUsdc < totalPrice) {
      return `Error: Insufficient USDC. Need ${formatUsdc(totalPrice)} USDC but only have ${formatUsdc(totalUsdc)} USDC.`;
    }

    const tx = new Transaction();
    const coinIds = coinsResult.data.map((c) => c.coinObjectId);
    const primaryCoin = tx.object(coinIds[0]);
    if (coinIds.length > 1) {
      tx.mergeCoins(primaryCoin, coinIds.slice(1).map((id) => tx.object(id)));
    }

    for (const purchase of purchases) {
      const [paymentCoin] = tx.splitCoins(primaryCoin, [tx.pure.u64(purchase.price)]);
      tx.moveCall({
        target: `${PACKAGE_ID}::shop::purchase`,
        typeArguments: [usdcType],
        arguments: [
          tx.object(SHOP_OBJECT_ID),
          tx.pure.u64(purchase.id),
          paymentCoin,
          tx.pure.string(email),
          tx.object(CLOCK_OBJECT_ID),
        ],
      });
    }

    const result = await client.signAndExecuteTransaction({ transaction: tx, signer: keypair });
    if (result.errors && result.errors.length > 0) {
      return `Purchase transaction failed! Errors: ${result.errors.join(', ')} (Digest: ${result.digest})`;
    }

    const itemsList = purchases.map((p) => `  - ${p.name} (${formatUsdc(p.price)} USDC)`).join('\n');
    return `Purchase successful!\n\nItems purchased:\n${itemsList}\n\nTotal: ${formatUsdc(totalPrice)} USDC\nDelivery email: ${email}\nTransaction: https://suiscan.xyz/${NETWORK}/tx/${result.digest}`;
  } catch (err: any) {
    return `Purchase failed: ${err.message}`;
  }
}

export async function runOrderHistory(): Promise<string> {
  try {
    const address = getAgentAddress();
    const myOrders = getRecentOrders().filter((o) => o.buyer === address);

    if (myOrders.length === 0) {
      return 'No orders found. The agent has not made any purchases yet.';
    }

    const orderList = myOrders
      .map((o) => `  #${o.orderNumber} | ${o.productName} | ${formatUsdc(o.price)} USDC | ${new Date(o.timestamp).toLocaleString()} | https://suiscan.xyz/${NETWORK}/tx/${o.txDigest}`)
      .join('\n');

    return `Agent Order History (${myOrders.length} orders):\n\n${orderList}`;
  } catch (err: any) {
    return `Error fetching orders: ${err.message}`;
  }
}

// ===== Create MCP Server =====
export const shopMcpServer = createSdkMcpServer({
  name: 'sui-shop-tools',
  version: '1.0.0',
  tools: [listProductsTool, getBalanceTool, purchaseTool, orderHistoryTool],
});
