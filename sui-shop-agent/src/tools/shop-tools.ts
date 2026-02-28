import { tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import { Transaction } from '@mysten/sui/transactions';
import { getKeypair, getClient, getAgentAddress } from './sui-client.js';
import {
  PRODUCTS,
  PACKAGE_ID,
  SHOP_OBJECT_ID,
  CLOCK_OBJECT_ID,
  getUsdcType,
  formatUsdc,
  NETWORK,
} from '../config.js';

// ===== Tool 1: List Products =====
const listProductsTool = tool(
  'list_products',
  'List all available products in Jimmy\'s SUI Shop with names, prices (in USDC), and IDs. Use this to find product IDs before purchasing.',
  {},
  async () => {
    const productList = PRODUCTS.map(
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
      const client = getClient();
      const address = getAgentAddress();

      // Get SUI balance
      const suiBalance = await client.getBalance({ owner: address });

      // Get USDC balance
      const usdcBalance = await client.getBalance({
        owner: address,
        coinType: getUsdcType(),
      });

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
      const purchases: Array<{ id: number; name: string; price: number }> = [];
      for (const pid of product_ids) {
        const product = PRODUCTS.find((p) => p.id === pid);
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
      const client = getClient();
      const address = getAgentAddress();
      const receiptType = `${PACKAGE_ID}::shop::OrderReceipt`;

      const result = await client.getOwnedObjects({
        owner: address,
        filter: { StructType: receiptType },
        options: { showContent: true },
      });

      if (result.data.length === 0) {
        return {
          content: [
            { type: 'text' as const, text: 'No orders found. The agent has not made any purchases yet.' },
          ],
        };
      }

      const orders = result.data
        .map((item) => {
          const content = item.data?.content;
          const fields = (content?.dataType === 'moveObject'
            ? content.fields
            : {}) as Record<string, any>;
          return {
            orderNumber: Number(fields?.order_number || 0),
            productName: String(fields?.product_name || 'Unknown'),
            price: Number(fields?.price || 0),
            email: String(fields?.email || ''),
            timestamp: Number(fields?.timestamp || 0),
          };
        })
        .sort((a, b) => b.timestamp - a.timestamp);

      const orderList = orders
        .map(
          (o) =>
            `  #${o.orderNumber} | ${o.productName} | ${formatUsdc(o.price)} USDC | ${new Date(o.timestamp).toLocaleString()} | ${o.email}`
        )
        .join('\n');

      return {
        content: [
          {
            type: 'text' as const,
            text: `Agent Order History (${orders.length} orders):\n\n${orderList}`,
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

// ===== Create MCP Server =====
export const shopMcpServer = createSdkMcpServer({
  name: 'sui-shop-tools',
  version: '1.0.0',
  tools: [listProductsTool, getBalanceTool, purchaseTool, orderHistoryTool],
});
