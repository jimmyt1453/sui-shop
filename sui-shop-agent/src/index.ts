/**
 * Jimmy's SUI Shop - AI Agent
 *
 * An autonomous agent that can purchase items from Jimmy's SUI Shop
 * using natural language instructions.
 *
 * Usage:
 *   npm start
 *
 * Example instructions:
 *   "Buy Steam Gift Card $25 and Roblox 800 Robux, send to jimmy@example.com"
 *   "What products are available?"
 *   "Check my balance"
 *   "Show my order history"
 */
// Prevent "nested Claude Code session" error when launched from a Claude Code terminal
delete process.env.CLAUDECODE;

import { query } from '@anthropic-ai/claude-agent-sdk';
import { shopMcpServer } from './tools/shop-tools.js';
import { getAgentAddress } from './tools/sui-client.js';
import { NETWORK } from './config.js';
import * as readline from 'readline';

const SYSTEM_PROMPT = `You are a shopping assistant for Jimmy's SUI Shop, a digital goods marketplace on the SUI blockchain.

You have access to tools that let you:
1. **list_products** - See all available products with prices
2. **get_balance** - Check the agent wallet's SUI and USDC balance
3. **purchase** - Buy products by ID and send to an email address
4. **order_history** - View past purchases

When the user asks you to buy something:
1. First, use list_products to find the correct product IDs
2. Check the balance to ensure sufficient USDC
3. Use the purchase tool with the product IDs and the user's email
4. Report the result including the transaction link

Always confirm what you're buying and the total cost before executing. All prices are in USDC.
The agent has its own SUI wallet and pays autonomously.`;

async function main() {
  console.log('=== Jimmy\'s SUI Shop - AI Agent ===');
  console.log(`Network: ${NETWORK}`);

  try {
    const address = getAgentAddress();
    console.log(`Agent Wallet: ${address}`);
  } catch (err: any) {
    console.error(`Setup error: ${err.message}`);
    console.log('Run "npm run setup" to generate a wallet first.');
    process.exit(1);
  }

  console.log('');
  console.log('Enter your shopping instructions (type "exit" to quit):');
  console.log('Example: "Buy Steam Gift Card $10 and send it to test@example.com"');
  console.log('');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const askQuestion = (): Promise<string> =>
    new Promise((resolve) => rl.question('You> ', resolve));

  while (true) {
    const userInput = await askQuestion();

    if (userInput.toLowerCase() === 'exit' || userInput.toLowerCase() === 'quit') {
      console.log('Goodbye!');
      rl.close();
      process.exit(0);
    }

    if (!userInput.trim()) continue;

    console.log('');
    console.log('Agent> Thinking...');

    try {
      const conversation = query({
        prompt: userInput,
        options: {
          systemPrompt: SYSTEM_PROMPT,
          mcpServers: {
            'sui-shop': shopMcpServer,
          },
          maxTurns: 10,
          allowDangerouslySkipPermissions: true,
          permissionMode: 'bypassPermissions',
          pathToClaudeCodeExecutable: '/Users/jimmyt1453/.local/bin/claude',
        },
      });

      for await (const message of conversation) {
        if (message.type === 'assistant') {
          // Extract text and tool_use blocks from BetaMessage content
          for (const block of message.message.content) {
            if (block.type === 'text') {
              console.log(`Agent> ${block.text}`);
            } else if (block.type === 'tool_use') {
              console.log(`  [Using tool: ${block.name}]`);
            }
          }
        } else if (message.type === 'result') {
          if (message.subtype !== 'success') {
            console.error(`Agent error: ${message.subtype}`);
          }
          // Successful result text is already printed via assistant messages above
        }
      }
    } catch (err: any) {
      console.error(`Error: ${err.message}`);
    }

    console.log('');
  }
}

main().catch(console.error);
