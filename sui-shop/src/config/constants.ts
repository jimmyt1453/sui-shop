// ===== Network Configuration =====
// Change NETWORK to 'mainnet' when ready to go live
export type NetworkType = 'testnet' | 'mainnet';
export const NETWORK: NetworkType = 'testnet';

// ===== USDC Coin Types =====
export const USDC_TYPE: Record<NetworkType, string> = {
  testnet: '0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC',
  mainnet: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC',
};

export const USDC_DECIMALS = 6;

// ===== Contract Addresses =====
// Update these after deploying the contract (run deploy.sh)
export const PACKAGE_ID = '0x39c96b73349e608b06d5def73b612e6783f8aa315348af9a7d8f7ebff9e22420';
// Original deploy package — AdminCap type is permanently tied to this ID
export const ORIGINAL_PACKAGE_ID = '0x3b5d6f883d690d5297cbc1c84e37a3a7b1dfc5de401239be04f048355ed02a32';
export const SHOP_OBJECT_ID = '0x6d3362f2eb0d1c5ea6efcbec5d659443f82e47d88a82a8bfa1ffd5b42a3912cc';

// ===== SUI Network URLs =====
export const RPC_URLS: Record<NetworkType, string> = {
  testnet: 'https://fullnode.testnet.sui.io:443',
  mainnet: 'https://fullnode.mainnet.sui.io:443',
};

// gRPC endpoints
export const GRPC_URLS: Record<NetworkType, string> = {
  testnet: 'https://grpc.testnet.sui.io:443',
  mainnet: 'https://grpc.mainnet.sui.io:443',
};

// ===== Clock object (system) =====
export const CLOCK_OBJECT_ID = '0x6';

// ===== Agent server =====
export const AGENT_API_URL = import.meta.env.VITE_AGENT_URL ?? 'http://localhost:3001';

// ===== Helper =====
export function getUsdcType(): string {
  return USDC_TYPE[NETWORK];
}

export function formatUsdc(amount: number): string {
  return (amount / 10 ** USDC_DECIMALS).toFixed(2);
}

export function parseUsdc(amount: number): number {
  return Math.round(amount * 10 ** USDC_DECIMALS);
}

// ===== Product Catalog =====
export interface ProductInfo {
  id: number;
  name: string;
  description: string;
  price: number; // in micro-USDC (6 decimals)
  imageUrl: string;
  category: string;
  emoji: string;
}

export const PRODUCTS: ProductInfo[] = [
  {
    id: 0,
    name: 'Steam Gift Card $10',
    description: 'Digital Steam wallet code worth $10. Redeem on Steam for games, DLC, and more.',
    price: 10_000_000,
    imageUrl: 'steam-10',
    category: 'Gaming',
    emoji: '🎮',
  },
  {
    id: 1,
    name: 'Steam Gift Card $25',
    description: 'Digital Steam wallet code worth $25. Perfect for bigger game purchases.',
    price: 25_000_000,
    imageUrl: 'steam-25',
    category: 'Gaming',
    emoji: '🎮',
  },
  {
    id: 2,
    name: 'PlayStation Store $20',
    description: 'PlayStation Store credit $20. Buy games, add-ons, and subscriptions.',
    price: 20_000_000,
    imageUrl: 'psn-20',
    category: 'Gaming',
    emoji: '🎯',
  },
  {
    id: 3,
    name: 'Xbox Game Pass 1 Month',
    description: '1 month of Xbox Game Pass Ultimate. Access hundreds of games.',
    price: 15_000_000,
    imageUrl: 'xbox-gp',
    category: 'Gaming',
    emoji: '🟢',
  },
  {
    id: 4,
    name: 'Nintendo eShop $15',
    description: 'Nintendo eShop digital credit $15. For Switch games and DLC.',
    price: 15_000_000,
    imageUrl: 'nintendo-15',
    category: 'Gaming',
    emoji: '🍄',
  },
  {
    id: 5,
    name: 'Spotify Premium 1 Month',
    description: '1 month of Spotify Premium. Ad-free music streaming.',
    price: 10_000_000,
    imageUrl: 'spotify',
    category: 'Entertainment',
    emoji: '🎵',
  },
  {
    id: 6,
    name: 'Netflix Gift Card $15',
    description: 'Netflix streaming credit $15. Enjoy movies and TV shows.',
    price: 15_000_000,
    imageUrl: 'netflix-15',
    category: 'Entertainment',
    emoji: '🎬',
  },
  {
    id: 7,
    name: 'Apple App Store $10',
    description: 'App Store & iTunes gift card $10. Apps, games, music, and more.',
    price: 10_000_000,
    imageUrl: 'apple-10',
    category: 'Digital',
    emoji: '🍎',
  },
  {
    id: 8,
    name: 'Google Play $10',
    description: 'Google Play Store credit $10. For Android apps, games, and media.',
    price: 10_000_000,
    imageUrl: 'google-10',
    category: 'Digital',
    emoji: '▶️',
  },
  {
    id: 9,
    name: 'Roblox 800 Robux',
    description: '800 Robux for Roblox. Customize your avatar and unlock experiences.',
    price: 10_000_000,
    imageUrl: 'roblox-800',
    category: 'Gaming',
    emoji: '🧱',
  },
  {
    id: 10,
    name: 'Fortnite 1000 V-Bucks',
    description: '1000 V-Bucks for Fortnite. Buy skins, emotes, and battle passes.',
    price: 8_000_000,
    imageUrl: 'fortnite-1000',
    category: 'Gaming',
    emoji: '⚡',
  },
  {
    id: 11,
    name: 'Minecraft Java Edition',
    description: 'Minecraft Java Edition game key. Build, explore, and survive.',
    price: 27_000_000,
    imageUrl: 'minecraft',
    category: 'Gaming',
    emoji: '⛏️',
  },
  {
    id: 12,
    name: 'Discord Nitro 1 Month',
    description: '1 month of Discord Nitro. Animated avatars, HD streaming, and more.',
    price: 10_000_000,
    imageUrl: 'discord-nitro',
    category: 'Digital',
    emoji: '💬',
  },
  {
    id: 13,
    name: 'Amazon Gift Card $10',
    description: 'Amazon.com gift card $10. Shop millions of products.',
    price: 10_000_000,
    imageUrl: 'amazon-10',
    category: 'Shopping',
    emoji: '📦',
  },
  {
    id: 14,
    name: 'Uber Eats $15',
    description: 'Uber Eats delivery credit $15. Order food from local restaurants.',
    price: 15_000_000,
    imageUrl: 'uber-15',
    category: 'Food',
    emoji: '🍔',
  },
];
