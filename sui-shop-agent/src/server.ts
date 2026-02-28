/**
 * Jimmy's SUI Shop - Agent Web Server
 *
 * Express HTTP server that exposes the AI agent via a browser-friendly
 * Server-Sent Events (SSE) API, and serves the React frontend in production.
 *
 * Usage (dev):    npm run web:dev
 * Usage (prod):   npm run web:build && npm run web
 *
 * Endpoints:
 *   GET  /api/status          → agent wallet address + network
 *   POST /api/chat            → SSE stream of agent responses (multi-turn)
 *   DELETE /api/sessions/:id  → clear a conversation session
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '@anthropic-ai/claude-agent-sdk';
import { shopMcpServer } from './tools/shop-tools.js';
import { getAgentAddress } from './tools/sui-client.js';
import { NETWORK } from './config.js';
import { startOrderWatcher, getRecentOrders } from './orderWatcher.js';
import { startBalanceTracker, getLatestBalance, getBalanceHistory } from './balanceTracker.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

const app = express();
const PORT = process.env.AGENT_PORT ? Number(process.env.AGENT_PORT) : 3001;

// ── Session tracking ─────────────────────────────────────────────────────────
const activeSessions = new Set<string>();

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── GET /api/status ─────────────────────────────────────────────────────────
app.get('/api/status', (_req, res) => {
  try {
    const address = getAgentAddress();
    res.json({ address, network: NETWORK, ok: true });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── DELETE /api/sessions/:sessionId ─────────────────────────────────────────
app.delete('/api/sessions/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  activeSessions.delete(sessionId);
  res.json({ ok: true });
});

// ── POST /api/chat ───────────────────────────────────────────────────────────
// Body:   { message: string, sessionId: string }
// Stream: Server-Sent Events  →  data: { type, ... }\n\n
app.post('/api/chat', async (req, res) => {
  const { message, sessionId } = req.body as { message?: string; sessionId?: string };

  if (!message || typeof message !== 'string' || !message.trim()) {
    res.status(400).json({ error: 'message is required' });
    return;
  }

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    send({ type: 'thinking' });

    // The Agent SDK spawns a Claude Code subprocess. When this server is run
    // from inside a Claude Code terminal, CLAUDECODE is set in the environment
    // and causes the child process to refuse to start. Unset it right before
    // spawning so the subprocess launches cleanly.
    const claudeExecutable = process.env.CLAUDE_EXECUTABLE ?? '/Users/jimmyt1453/.local/bin/claude';

    // Strip Claude Code host-session env vars so the child subprocess doesn't
    // think it's already inside a Claude Code session and refuse to start.
    const CLAUDE_HOST_VARS = new Set(['CLAUDECODE', 'CLAUDE_CODE_ENTRYPOINT']);
    const childEnv: Record<string, string> = {};
    for (const [k, v] of Object.entries(process.env)) {
      if (!CLAUDE_HOST_VARS.has(k) && v !== undefined) childEnv[k] = v;
    }

    console.log(`[chat] sessionId=${sessionId}, active=${activeSessions.has(sessionId ?? '')}, strippedVars=${[...CLAUDE_HOST_VARS].join(',')}`);

    const sessionOptions = sessionId
      ? activeSessions.has(sessionId)
        ? { resume: sessionId }
        : { sessionId }
      : {};

    const conversation = query({
      prompt: message,
      options: {
        systemPrompt: SYSTEM_PROMPT,
        mcpServers: { 'sui-shop': shopMcpServer },
        maxTurns: 10,
        allowDangerouslySkipPermissions: true,
        permissionMode: 'bypassPermissions',
        pathToClaudeCodeExecutable: claudeExecutable,
        env: childEnv,
        ...sessionOptions,
      },
    });

    for await (const sdkMessage of conversation) {
      if (sdkMessage.type === 'assistant') {
        for (const block of sdkMessage.message.content) {
          if (block.type === 'text' && block.text.trim()) {
            send({ type: 'text', content: block.text });
          } else if (block.type === 'tool_use') {
            send({ type: 'tool', name: block.name });
          }
        }
      } else if (sdkMessage.type === 'result' && sdkMessage.subtype !== 'success') {
        send({ type: 'error', message: `Agent error: ${sdkMessage.subtype}` });
      }
    }

    if (sessionId) activeSessions.add(sessionId);

    send({ type: 'done' });
  } catch (err: any) {
    console.error('[chat] error:', err);
    send({ type: 'error', message: err.message ?? 'Unknown error' });
  } finally {
    res.end();
  }
});

// ── GET /api/balance ─────────────────────────────────────────────────────────
app.get('/api/balance', (_req, res) => {
  const balance = getLatestBalance();
  if (!balance) { res.json({ ok: false, error: 'Balance not yet sampled' }); return; }
  res.json({ ok: true, ...balance });
});

// ── GET /api/balance/history ──────────────────────────────────────────────────
app.get('/api/balance/history', (_req, res) => {
  res.json({ ok: true, history: getBalanceHistory() });
});

// ── GET /api/orders/recent ───────────────────────────────────────────────────
app.get('/api/orders/recent', (req, res) => {
  const limit = Math.min(Math.max(1, Number(req.query.limit ?? 20)), 100);
  res.json({ ok: true, orders: getRecentOrders().slice(0, limit), count: getRecentOrders().length });
});

// ── Static files (production) ────────────────────────────────────────────────
const webDistPath = path.join(__dirname, '..', 'web', 'dist');
app.use(express.static(webDistPath));

app.use((_req, res) => {
  res.sendFile(path.join(webDistPath, 'index.html'));
});

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🤖 SUI Shop Agent Server → http://localhost:${PORT}`);
  console.log(`   Network : ${NETWORK}`);
  console.log(`   CLAUDECODE env: ${process.env.CLAUDECODE ?? '(not set)'}`);
  try {
    console.log(`   Wallet  : ${getAgentAddress()}`);
  } catch {
    console.log(`   Wallet  : not configured — run "npm run setup" first`);
  }
  console.log('');
  startOrderWatcher(10_000);
  startBalanceTracker(60_000);
});
