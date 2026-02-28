import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';
import { NETWORK } from '../config.js';

const RPC_URLS: Record<string, string> = {
  testnet: 'https://fullnode.testnet.sui.io:443',
  mainnet: 'https://fullnode.mainnet.sui.io:443',
};

let _keypair: Ed25519Keypair | null = null;
let _client: SuiJsonRpcClient | null = null;

export function getKeypair(): Ed25519Keypair {
  if (_keypair) return _keypair;

  const privateKey = process.env.AGENT_SUI_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error(
      'AGENT_SUI_PRIVATE_KEY not set in .env. Run "npm run setup" first.'
    );
  }

  _keypair = Ed25519Keypair.fromSecretKey(privateKey);
  return _keypair;
}

export function getClient(): SuiJsonRpcClient {
  if (_client) return _client;
  const url = RPC_URLS[NETWORK] ?? RPC_URLS['testnet'];
  _client = new SuiJsonRpcClient({ url, network: NETWORK });
  return _client;
}

export function getAgentAddress(): string {
  return getKeypair().toSuiAddress();
}
