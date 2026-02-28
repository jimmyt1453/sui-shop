import { Transaction } from '@mysten/sui/transactions';
import {
  PACKAGE_ID,
  SHOP_OBJECT_ID,
  CLOCK_OBJECT_ID,
  getUsdcType,
} from '../config/constants';

/**
 * Build a purchase transaction given specific USDC coin object IDs.
 * Merges coins, splits exact amount, calls purchase on-chain.
 */
export function buildPurchaseWithCoins(
  productId: number,
  price: number,
  email: string,
  usdcCoinIds: string[],
): Transaction {
  const tx = new Transaction();
  const usdcType = getUsdcType();

  // If we have multiple USDC coins, merge them first
  const primaryCoin = tx.object(usdcCoinIds[0]);
  if (usdcCoinIds.length > 1) {
    const otherCoins = usdcCoinIds.slice(1).map((id) => tx.object(id));
    tx.mergeCoins(primaryCoin, otherCoins);
  }

  // Split exact payment amount
  const [paymentCoin] = tx.splitCoins(primaryCoin, [tx.pure.u64(price)]);

  // Call the purchase function
  tx.moveCall({
    target: `${PACKAGE_ID}::shop::purchase`,
    typeArguments: [usdcType],
    arguments: [
      tx.object(SHOP_OBJECT_ID),
      tx.pure.u64(productId),
      paymentCoin,
      tx.pure.string(email),
      tx.object(CLOCK_OBJECT_ID),
    ],
  });

  return tx;
}

/**
 * Build a multi-purchase transaction (buy multiple items in one tx).
 * Each item gets its own purchase call within the same transaction.
 */
export function buildMultiPurchaseWithCoins(
  purchases: Array<{ productId: number; price: number }>,
  email: string,
  usdcCoinIds: string[],
): Transaction {
  const tx = new Transaction();
  const usdcType = getUsdcType();

  // Merge all USDC coins into one
  const primaryCoin = tx.object(usdcCoinIds[0]);
  if (usdcCoinIds.length > 1) {
    const otherCoins = usdcCoinIds.slice(1).map((id) => tx.object(id));
    tx.mergeCoins(primaryCoin, otherCoins);
  }

  // For each purchase, split the exact amount and call purchase
  for (const purchase of purchases) {
    const [paymentCoin] = tx.splitCoins(primaryCoin, [
      tx.pure.u64(purchase.price),
    ]);

    tx.moveCall({
      target: `${PACKAGE_ID}::shop::purchase`,
      typeArguments: [usdcType],
      arguments: [
        tx.object(SHOP_OBJECT_ID),
        tx.pure.u64(purchase.productId),
        paymentCoin,
        tx.pure.string(email),
        tx.object(CLOCK_OBJECT_ID),
      ],
    });
  }

  return tx;
}
