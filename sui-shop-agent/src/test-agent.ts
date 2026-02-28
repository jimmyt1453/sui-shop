delete process.env.CLAUDECODE;
import { shopMcpServer } from './tools/shop-tools.js';
import { query } from '@anthropic-ai/claude-agent-sdk';

async function main() {
  const conv = query({
    prompt: 'list products',
    options: {
      pathToClaudeCodeExecutable: '/Users/jimmyt1453/.local/bin/claude',
      allowDangerouslySkipPermissions: true,
      permissionMode: 'bypassPermissions',
      mcpServers: { 'sui-shop': shopMcpServer },
      maxTurns: 5,
    }
  });
  for await (const msg of conv) {
    if (msg.type === 'assistant') {
      for (const b of msg.message.content) {
        if (b.type === 'text') console.log('OK:', b.text.slice(0, 200));
      }
    } else if (msg.type === 'result') {
      console.log('result subtype:', msg.subtype);
    }
  }
}
main().catch(e => console.error('ERROR:', e.message));
