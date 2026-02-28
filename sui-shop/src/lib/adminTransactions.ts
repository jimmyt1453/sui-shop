import { Transaction } from '@mysten/sui/transactions';
import { PACKAGE_ID, SHOP_OBJECT_ID } from '../config/constants';

export function buildUpdatePrice(
  productId: number,
  newPrice: number,
  adminCapId: string,
): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::shop::update_price`,
    arguments: [
      tx.object(SHOP_OBJECT_ID),
      tx.object(adminCapId),
      tx.pure.u64(productId),
      tx.pure.u64(newPrice),
    ],
  });
  return tx;
}

export function buildAddProduct(
  name: string,
  description: string,
  price: number,
  imageUrl: string,
  adminCapId: string,
): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::shop::add_product`,
    arguments: [
      tx.object(SHOP_OBJECT_ID),
      tx.object(adminCapId),
      tx.pure.string(name),
      tx.pure.string(description),
      tx.pure.u64(price),
      tx.pure.string(imageUrl),
    ],
  });
  return tx;
}

export function buildToggleProduct(
  productId: number,
  activate: boolean,
  adminCapId: string,
): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::shop::${activate ? 'activate_product' : 'deactivate_product'}`,
    arguments: [
      tx.object(SHOP_OBJECT_ID),
      tx.object(adminCapId),
      tx.pure.u64(productId),
    ],
  });
  return tx;
}

export function buildUpdateMerchant(
  newAddress: string,
  adminCapId: string,
): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::shop::update_merchant_address`,
    arguments: [
      tx.object(SHOP_OBJECT_ID),
      tx.object(adminCapId),
      tx.pure.address(newAddress),
    ],
  });
  return tx;
}
