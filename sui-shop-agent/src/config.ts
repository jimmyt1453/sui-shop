import 'dotenv/config';

// ===== Network =====
export type NetworkType = 'testnet' | 'mainnet';
export const NETWORK: NetworkType = (process.env.SUI_NETWORK as NetworkType) || 'testnet';

// ===== USDC Coin Types =====
export const USDC_TYPE: Record<NetworkType, string> = {
  testnet: '0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC',
  mainnet: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC',
};

export const USDC_DECIMALS = 6;

// ===== Contract Addresses =====
// Update these after deploying the contract
export const PACKAGE_ID = '0x39c96b73349e608b06d5def73b612e6783f8aa315348af9a7d8f7ebff9e22420';
export const ORIGINAL_PACKAGE_ID = '0x3b5d6f883d690d5297cbc1c84e37a3a7b1dfc5de401239be04f048355ed02a32';
export const SHOP_OBJECT_ID = '0x6d3362f2eb0d1c5ea6efcbec5d659443f82e47d88a82a8bfa1ffd5b42a3912cc';

// ===== Clock object =====
export const CLOCK_OBJECT_ID = '0x6';

// ===== Helpers =====
export function getUsdcType(): string {
  return USDC_TYPE[NETWORK];
}

export function formatUsdc(amount: number): string {
  return (amount / 10 ** USDC_DECIMALS).toFixed(2);
}

// ===== Product Catalog (same as web shop) =====
export interface ProductInfo {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
}

export const PRODUCTS: ProductInfo[] = [
  { id: 0, name: 'Steam Gift Card $10', description: 'Digital Steam wallet code worth $10', price: 10_000_000, category: 'Gaming' },
  { id: 1, name: 'Steam Gift Card $25', description: 'Digital Steam wallet code worth $25', price: 25_000_000, category: 'Gaming' },
  { id: 2, name: 'PlayStation Store $20', description: 'PlayStation Store credit $20', price: 20_000_000, category: 'Gaming' },
  { id: 3, name: 'Xbox Game Pass 1 Month', description: '1 month of Xbox Game Pass Ultimate', price: 15_000_000, category: 'Gaming' },
  { id: 4, name: 'Nintendo eShop $15', description: 'Nintendo eShop digital credit $15', price: 15_000_000, category: 'Gaming' },
  { id: 5, name: 'Spotify Premium 1 Month', description: '1 month of Spotify Premium', price: 10_000_000, category: 'Entertainment' },
  { id: 6, name: 'Netflix Gift Card $15', description: 'Netflix streaming credit $15', price: 15_000_000, category: 'Entertainment' },
  { id: 7, name: 'Apple App Store $10', description: 'App Store & iTunes gift card $10', price: 10_000_000, category: 'Digital' },
  { id: 8, name: 'Google Play $10', description: 'Google Play Store credit $10', price: 10_000_000, category: 'Digital' },
  { id: 9, name: 'Roblox 800 Robux', description: '800 Robux for Roblox', price: 10_000_000, category: 'Gaming' },
  { id: 10, name: 'Fortnite 1000 V-Bucks', description: '1000 V-Bucks for Fortnite', price: 8_000_000, category: 'Gaming' },
  { id: 11, name: 'Minecraft Java Edition', description: 'Minecraft Java Edition game key', price: 27_000_000, category: 'Gaming' },
  { id: 12, name: 'Discord Nitro 1 Month', description: '1 month of Discord Nitro', price: 10_000_000, category: 'Digital' },
  { id: 13, name: 'Amazon Gift Card $10', description: 'Amazon.com gift card $10', price: 10_000_000, category: 'Shopping' },
  { id: 14, name: 'Uber Eats $15', description: 'Uber Eats delivery credit $15', price: 15_000_000, category: 'Food' },
];
