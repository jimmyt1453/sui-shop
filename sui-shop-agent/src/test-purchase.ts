/**
 * Standalone test script: makes a real on-chain purchase using the agent wallet.
 * Run: npm run test-purchase
 */
import 'dotenv/config';
import { Transaction } from '@mysten/sui/transactions';
import { getKeypair, getClient, getAgentAddress } from './tools/sui-client.js';
import {
  PACKAGE_ID,
  SHOP_OBJECT_ID,
  CLOCK_OBJECT_ID,
  getUsdcType,
  formatUsdc,
  NETWORK,
  PRODUCTS,
} from './config.js';

const PRODUCT_ID = 10; // Fortnite 1000 V-Bucks — 8 USDC
const EMAIL = 'test@suishop.dev';

async function main() {
  const client = getClient();
  const keypair = getKeypair();
  const address = getAgentAddress();
  const usdcType = getUsdcType();
  const product = PRODUCTS.find((p) => p.id === PRODUCT_ID)!;

  console.log(`\nAgent wallet : ${address}`);
  console.log(`Network      : ${NETWORK}`);
  console.log(`Product      : ${product.name} (${formatUsdc(product.price)} USDC)`);
  console.log(`Email        : ${EMAIL}\n`);

  // Check USDC balance
  const usdcBalance = await client.getBalance({ owner: address, coinType: usdcType });
  console.log(`USDC balance : ${formatUsdc(Number(usdcBalance.totalBalance))} USDC`);

  if (Number(usdcBalance.totalBalance) < product.price) {
    console.error('Insufficient USDC — fund the agent wallet first.');
    process.exit(1);
  }

  // Get USDC coins
  const coinsResult = await client.getCoins({ owner: address, coinType: usdcType, limit: 10 });
  const coinIds = coinsResult.data.map((c) => c.coinObjectId);

  // Build transaction
  const tx = new Transaction();
  const primaryCoin = tx.object(coinIds[0]);
  if (coinIds.length > 1) {
    tx.mergeCoins(primaryCoin, coinIds.slice(1).map((id) => tx.object(id)));
  }
  const [paymentCoin] = tx.splitCoins(primaryCoin, [tx.pure.u64(product.price)]);
  tx.moveCall({
    target: `${PACKAGE_ID}::shop::purchase`,
    typeArguments: [usdcType],
    arguments: [
      tx.object(SHOP_OBJECT_ID),
      tx.pure.u64(product.id),
      paymentCoin,
      tx.pure.string(EMAIL),
      tx.object(CLOCK_OBJECT_ID),
    ],
  });

  console.log('Submitting transaction...');
  const result = await client.signAndExecuteTransaction({ transaction: tx, signer: keypair });

  if (result.errors && result.errors.length > 0) {
    console.error('Transaction failed:', result.errors);
    process.exit(1);
  }

  console.log(`\nPurchase successful!`);
  console.log(`Digest : ${result.digest}`);
  console.log(`SuiScan: https://suiscan.xyz/${NETWORK}/tx/${result.digest}\n`);
}

main().catch((err) => { console.error(err); process.exit(1); });
