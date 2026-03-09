# SUI Shop

A digital goods marketplace built on the [SUI blockchain](https://sui.io). Buy gift cards and subscriptions with USDC. Includes a React storefront, an AI-powered shopping agent, and a server-side on-chain order watcher.

---

## Architecture

```
sui-shop/          React + Vite storefront (wallet, cart, checkout)
sui-shop-agent/    Express server — AI agent (Claude) + order watcher API
sui-contracts/     Move smart contract (shop module)
```

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Blockchain | Move (SUI) | Testnet |
| Storefront | React 19, Vite, Tailwind CSS 4, dapp-kit | Port 5173 |
| Agent server | Node.js, Express 5, Claude Agent SDK | Port 3001 |
| Agent chat UI | React 19, Vite, Tailwind CSS 4 | Served by agent server |

---

### How a purchase works

1. User connects their SUI wallet (via dapp-kit)
2. Adds items to cart, enters email, clicks Pay
3. Frontend builds a multi-purchase transaction and prompts wallet signature
4. After signing, a polling hook checks `getTransactionBlock` every 2s until confirmed on-chain (up to 15 attempts / ~30s)
5. The agent server's order watcher polls `OrderPlaced` events every 10s and logs fulfilled orders

---

## Packages

### `sui-contracts` — Move contract

The `shop` module lives at `sui-contracts/sources/shop.move`. It exposes a single entry function:

```move
public entry fun purchase<CoinType>(
    shop: &mut Shop,
    product_id: u64,
    payment: Coin<CoinType>,
    email: vector<u8>,
    clock: &Clock,
    ctx: &mut TxContext,
)
```

Emits an `OrderPlaced` event on every successful purchase. Deployed on **testnet**:

| Object | Address |
|---|---|
| Package (current) | `0x39c96b73...e22420` |
| Package (original) | `0x3b5d6f88...02a32` |
| Shop object | `0x6d3362f2...912cc` |

### `sui-shop` — React storefront

- **Wallet integration** — `@mysten/dapp-kit-react` (Slippage, Phantom, Sui Wallet)
- **USDC balance** — polled via gRPC every 10s
- **Cart** — React context, persisted in memory
- **Checkout** — builds a batched transaction (one Move call per cart item), shows a confirming spinner, then a confirmed/submitted success screen
- **Order history** — reads `OrderReceipt` objects owned by the connected wallet

```bash
cd sui-shop
npm install
npm run dev        # http://localhost:5173
```

### `sui-shop-agent` — Agent server

An Express server that exposes two things:

**AI shopping agent** — powered by Claude via the Anthropic Agent SDK. POST a message, get an SSE stream back. The agent can list products, check balances, and execute purchases autonomously from its own funded wallet.

**Order watcher** — polls `OrderPlaced` on-chain events every 10s. Seeds a cursor on startup so history is never replayed. Logs each new order and stores the last 100 in memory.

**Agent chat UI** — an embedded React app (`sui-shop-agent/web/`) with a glass/dark UI, balance widget, and network status indicator. In production it is built and served statically by the agent server. In development it runs on its own Vite dev server with HMR.

**Admin Dashboard** — accessible via the Admin tab in the chat UI. Shows recent orders, wallet balance history, and an Inventory manager for uploading redemption codes per product.

```bash
cd sui-shop-agent
cp .env.example .env   # add ANTHROPIC_API_KEY + AGENT_SUI_PRIVATE_KEY
npm run setup          # generate agent wallet keypair
npm run server         # API only (http://localhost:3001)
npm run web:dev        # Dev: server + chat UI (http://localhost:5174)
npm run web            # Prod: build chat UI + serve everything from :3001
```

#### Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/status` | Agent wallet address + network |
| `POST` | `/api/chat` | SSE stream — AI agent responses |
| `DELETE` | `/api/sessions/:id` | Clear a conversation session |
| `GET` | `/api/orders/recent` | Last N on-chain orders (`?limit=20`) |
| `GET` | `/api/balance` | Current agent wallet SUI + USDC balance |
| `GET` | `/api/balance/history` | Balance change history |
| `GET` | `/api/inventory` | Redemption code counts per product |
| `POST` | `/api/inventory/:productId` | Add redemption codes `{ codes: string[] }` |

---

## On-Chain vs Off-Chain

Understanding what lives on the SUI blockchain versus what runs off-chain is key to understanding the trust model of this project.

### On-Chain (SUI Move contract)

| Component | Details |
|---|---|
| **Product catalog** | Products stored as dynamic fields on the `Shop` shared object. Admin can add/update/deactivate products via on-chain calls. |
| **Payment processing** | USDC coin transferred directly to the merchant address inside the Move transaction — no escrow, no middleman. Change is refunded automatically. |
| **Order receipts** | An `OrderReceipt` object is created and transferred to the buyer's wallet on every purchase. Contains order number, product name, price, buyer address, email, and timestamp. Serves as immutable proof of purchase. |
| **Access control** | An `AdminCap` owned object gates all admin functions (add product, update price, deactivate product). Only the holder can call these. |
| **Order events** | An `OrderPlaced` event is emitted per purchase and indexed by the SUI network. The off-chain order watcher subscribes to these events to trigger fulfillment. |

### Off-Chain (Agent server + frontend)

| Component | Why it's off-chain | File(s) |
|---|---|---|
| **Redemption codes** | Gift card codes must remain secret. The SUI blockchain is a public ledger — storing a code on-chain would expose it to every validator before the buyer claims it. | `sui-shop-agent/src/inventoryStore.ts` |
| **Email delivery** | Move has no ability to make HTTP requests or send emails. An off-chain agent listens for `OrderPlaced` events and sends codes via SMTP. | `sui-shop-agent/src/orderWatcher.ts`, `sui-shop-agent/src/mailer.ts` |
| **Product images & categories** | Large binary assets and UI metadata (images, category tags) are stored off-chain. The contract stores only a string image ID. | `sui-shop/src/config/constants.ts` |
| **AI shopping agent** | The Claude-powered agent runs on Anthropic's servers. It has its own funded SUI wallet and calls on-chain functions autonomously, but the reasoning layer is off-chain. | `sui-shop-agent/src/` |
| **Order history cache** | The last 100 orders are cached in memory for fast API responses. The canonical source of truth is always the on-chain events. | `sui-shop-agent/src/orderWatcher.ts` |

### Purchase data flow

```
1. USER (browser)
   Selects product → enters email → signs transaction in wallet

2. ON-CHAIN (Move)
   Validates product exists and is active
   Verifies payment amount ≥ price
   Transfers USDC to merchant address
   Creates OrderReceipt → transfers to buyer wallet
   Emits OrderPlaced event

3. OFF-CHAIN (order watcher, every 10s)
   Polls for new OrderPlaced events
   Fetches buyer email from OrderReceipt object
   Pops a redemption code from in-memory inventory
   Sends email to buyer via SMTP
```

### What can and cannot move on-chain

- **Can**: Product catalog (already on-chain), payment logic (already on-chain), order receipts (already on-chain), fulfillment status flags
- **Cannot**: Redemption codes (public ledger = exposed secrets), email delivery (Move has no I/O), AI reasoning (off-chain by nature)

---

## Setup

### Prerequisites

- Node.js 22+
- A SUI wallet with testnet USDC ([faucet](https://faucet.sui.io))
- Anthropic API key (for the agent)

### 1. Deploy the contract (already deployed — skip if using testnet)

```bash
cd sui-contracts
sui client publish --gas-budget 100000000
# Update PACKAGE_ID + SHOP_OBJECT_ID in both config files
```

### 2. Start the storefront

```bash
cd sui-shop
npm install
npm run dev
```

### 3. Start the agent server

```bash
cd sui-shop-agent
npm install
npm run setup          # creates agent wallet, writes .env
npm run server
```

Fund the agent wallet with testnet SUI and USDC. Open `http://localhost:3001` for the API, or run `npm run web:dev` to also get the chat UI at `http://localhost:5174`.

---

## Environment variables (`sui-shop-agent/.env`)

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API key |
| `AGENT_SUI_PRIVATE_KEY` | Agent wallet private key (generated by `npm run setup`) |
| `SUI_NETWORK` | `testnet` (default) or `mainnet` |
| `AGENT_PORT` | Server port (default `3001`) |
| `SMTP_HOST` | SMTP server (optional, for order notification emails) |
| `SMTP_PORT` | SMTP port (default `587`) |
| `SMTP_USER` | SMTP username / email address |
| `SMTP_PASS` | SMTP password / app-specific password |
| `FROM_EMAIL` | Sender address for notification emails |
