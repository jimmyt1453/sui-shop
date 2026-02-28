/**
 * Setup script for the AI agent.
 * Generates a new Ed25519 keypair and prints the private key + address.
 * Save the private key to .env as AGENT_SUI_PRIVATE_KEY.
 */
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { toBase64 } from '@mysten/sui/utils';
import fs from 'fs';
import path from 'path';

console.log('=== Jimmy\'s SUI Shop - Agent Wallet Setup ===\n');

// Check if .env already has a key
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  if (envContent.includes('AGENT_SUI_PRIVATE_KEY=') && !envContent.includes('AGENT_SUI_PRIVATE_KEY=\n') && !envContent.includes('AGENT_SUI_PRIVATE_KEY=\r')) {
    console.log('A private key already exists in .env');
    const keypair = Ed25519Keypair.fromSecretKey(
      envContent.match(/AGENT_SUI_PRIVATE_KEY=(.+)/)?.[1]?.trim() || ''
    );
    console.log(`Agent Address: ${keypair.toSuiAddress()}`);
    console.log('\nTo fund this wallet with testnet SUI, visit:');
    console.log(`https://faucet.sui.io/?address=${keypair.toSuiAddress()}`);
    process.exit(0);
  }
}

// Generate new keypair
const keypair = Ed25519Keypair.generate();
const address = keypair.toSuiAddress();
const secretKey = keypair.getSecretKey();

console.log(`Generated new agent wallet:`);
console.log(`  Address: ${address}`);
console.log(`  Secret Key: ${secretKey}`);
console.log('');

// Write to .env
const envContent = `# Anthropic API Key (for Claude Agent SDK)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Agent's SUI wallet private key
AGENT_SUI_PRIVATE_KEY=${secretKey}

# Network: testnet or mainnet
SUI_NETWORK=testnet
`;

fs.writeFileSync(envPath, envContent);
console.log(`Saved to .env`);
console.log('');
console.log('Next steps:');
console.log('  1. Add your ANTHROPIC_API_KEY to .env');
console.log(`  2. Fund the agent wallet with testnet SUI: https://faucet.sui.io/?address=${address}`);
console.log('  3. Get testnet USDC (you may need to transfer from another wallet)');
console.log('  4. Run the agent: npm start');
