import { useState, useEffect, useCallback } from 'react';
import { useCurrentAccount, useDAppKit } from '@mysten/dapp-kit-react';
import { ConnectButton } from '@mysten/dapp-kit-react';
import { useAdminCap } from '../hooks/useAdminCap';
import { useShopProducts } from '../hooks/useShopProducts';
import { useMerchantAddress } from '../hooks/useMerchantAddress';
import { formatUsdc, parseUsdc, NETWORK, AGENT_API_URL } from '../config/constants';
import {
  buildUpdatePrice,
  buildAddProduct,
  buildToggleProduct,
  buildUpdateMerchant,
} from '../lib/adminTransactions';

type Tab = 'products' | 'inventory' | 'orders' | 'settings';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'products', label: 'Products', icon: '📦' },
  { id: 'inventory', label: 'Inventory', icon: '🗃️' },
  { id: 'orders', label: 'Orders', icon: '📋' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

function GradientIcon({ emoji }: { emoji: string }) {
  return (
    <div className="relative inline-flex items-center justify-center mb-4">
      <div className="absolute w-16 h-16 rounded-2xl bg-blue-600/30 motion-safe:animate-ping" />
      <div className="relative w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center text-3xl">
        {emoji}
      </div>
    </div>
  );
}

function BounceDots() {
  return (
    <div className="flex items-center justify-center gap-1.5 mb-4">
      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
    </div>
  );
}

export function AdminPage() {
  const account = useCurrentAccount();
  const dAppKit = useDAppKit();
  const { adminCapId, isAdmin, loading: capLoading } = useAdminCap();
  const { products, loading: productsLoading, error, refetch } = useShopProducts();
  const [activeTab, setActiveTab] = useState<Tab>('products');

  if (!account) {
    return (
      <div className="text-center py-20">
        <GradientIcon emoji="🔒" />
        <h2 className="text-2xl font-bold text-white mb-2">Admin Access Required</h2>
        <p className="text-gray-400 mb-6">Connect the wallet that holds the AdminCap.</p>
        <ConnectButton />
      </div>
    );
  }

  if (capLoading) {
    return (
      <div className="text-center py-20">
        <BounceDots />
        <p className="text-gray-400">Checking admin privileges…</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-20">
        <GradientIcon emoji="⛔" />
        <h2 className="text-2xl font-bold text-white mb-2">Not Authorized</h2>
        <p className="text-gray-400">
          The connected wallet does not own the AdminCap for this shop.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-800 rounded-xl flex items-center justify-center text-xl border border-gray-700">
            ⚙️
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white leading-tight">Admin Dashboard</h1>
            <p className="text-gray-500 text-xs">Jimmy's SUI Shop</p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 text-xs bg-green-900 text-green-300 px-3 py-1 rounded-full">
          <span className="w-1.5 h-1.5 bg-green-400/70 rounded-full animate-pulse" />
          AdminCap verified ✓
        </span>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-700 mb-8">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium rounded-t-lg transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'bg-gray-800 text-white border border-b-gray-800 border-gray-700 -mb-px'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            <span className="text-base">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'products' && (
        <div className="space-y-8">
          <ProductManager
            products={products}
            loading={productsLoading}
            error={error}
            adminCapId={adminCapId!}
            dAppKit={dAppKit}
            refetch={refetch}
          />
          <AddProductForm adminCapId={adminCapId!} dAppKit={dAppKit} refetch={refetch} />
        </div>
      )}

      {activeTab === 'inventory' && (
        <InventoryManager />
      )}

      {activeTab === 'orders' && (
        <RecentOrders />
      )}

      {activeTab === 'settings' && (
        <MerchantForm adminCapId={adminCapId!} dAppKit={dAppKit} walletAddress={account.address} />
      )}
    </div>
  );
}

// ─── Product Manager ──────────────────────────────────────────────────────────

function ProductManager({
  products,
  loading,
  error,
  adminCapId,
  dAppKit,
  refetch,
}: {
  products: ReturnType<typeof useShopProducts>['products'];
  loading: boolean;
  error: string | null;
  adminCapId: string;
  dAppKit: ReturnType<typeof useDAppKit>;
  refetch: () => void;
}) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [busy, setBusy] = useState<number | null>(null);
  const [txMsg, setTxMsg] = useState<{ id: number; msg: string; ok: boolean } | null>(null);

  const execTx = async (productId: number, tx: ReturnType<typeof buildUpdatePrice>) => {
    setBusy(productId);
    setTxMsg(null);
    try {
      const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });
      if ('FailedTransaction' in result) throw new Error('Transaction failed');
      setTxMsg({ id: productId, msg: 'Done!', ok: true });
      refetch();
    } catch (e: any) {
      setTxMsg({ id: productId, msg: e.message ?? 'Failed', ok: false });
    } finally {
      setBusy(null);
      setEditingId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-8 text-center">
        <BounceDots />
        <p className="text-gray-400 text-sm">Loading on-chain products…</p>
      </div>
    );
  }
  if (error) return <p className="text-red-400">{error}</p>;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-white">Products</h2>
          <p className="text-gray-500 text-xs mt-0.5">{products.length} product{products.length !== 1 ? 's' : ''} on-chain</p>
        </div>
        <button
          onClick={refetch}
          className="text-sm text-blue-400 hover:text-blue-300 cursor-pointer"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-2">
        {products.map((p) => (
          <div
            key={p.id}
            className={`bg-gray-800 rounded-lg border border-l-4 px-4 py-3 flex flex-wrap items-center gap-3 transition-colors ${
              p.active
                ? 'border-gray-700 border-l-emerald-600'
                : 'border-gray-700 border-l-gray-600 opacity-50'
            }`}
          >
            {/* ID + name */}
            <span className="text-gray-500 text-xs font-mono w-6">#{p.id}</span>
            <span className="text-white text-sm flex-1 min-w-[160px]">{p.name}</span>

            {/* Status badge */}
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                p.active
                  ? 'bg-emerald-900/60 text-emerald-400'
                  : 'bg-gray-700 text-gray-500'
              }`}
            >
              {p.active ? 'Active' : 'Inactive'}
            </span>

            {/* Price / edit */}
            {editingId === p.id ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="w-24 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-blue-500"
                  placeholder="USDC"
                  autoFocus
                />
                <button
                  disabled={busy === p.id}
                  onClick={() => {
                    const price = parseUsdc(Number(editPrice));
                    if (!price || price <= 0) return;
                    execTx(p.id, buildUpdatePrice(p.id, price, adminCapId));
                  }}
                  className="text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1 rounded cursor-pointer"
                >
                  {busy === p.id ? '…' : 'Save'}
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="text-xs text-gray-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-green-400 font-mono text-sm">
                  {formatUsdc(p.price)} USDC
                </span>
                <button
                  onClick={() => {
                    setEditingId(p.id);
                    setEditPrice((p.price / 1e6).toFixed(2));
                  }}
                  className="text-xs text-gray-400 hover:text-blue-400 cursor-pointer"
                >
                  Edit
                </button>
              </div>
            )}

            {/* Toggle active */}
            <button
              disabled={busy === p.id}
              onClick={() =>
                execTx(p.id, buildToggleProduct(p.id, !p.active, adminCapId))
              }
              className={`text-xs px-3 py-1 rounded cursor-pointer disabled:opacity-50 ${
                p.active
                  ? 'bg-red-900/60 hover:bg-red-800 text-red-300'
                  : 'bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300'
              }`}
            >
              {p.active ? 'Deactivate' : 'Activate'}
            </button>

            {/* Inline tx result */}
            {txMsg?.id === p.id && (
              <span
                className={`text-xs ${txMsg.ok ? 'text-green-400' : 'text-red-400'}`}
              >
                {txMsg.msg}
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Add Product Form ─────────────────────────────────────────────────────────

function AddProductForm({
  adminCapId,
  dAppKit,
  refetch,
}: {
  adminCapId: string;
  dAppKit: ReturnType<typeof useDAppKit>;
  refetch: () => void;
}) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
  });
  const [status, setStatus] = useState<'idle' | 'busy' | 'ok' | 'error'>('idle');
  const [errMsg, setErrMsg] = useState('');

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseUsdc(Number(form.price));
    if (!form.name || !price) return;

    setStatus('busy');
    setErrMsg('');
    try {
      const tx = buildAddProduct(form.name, form.description, price, form.imageUrl, adminCapId);
      const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });
      if ('FailedTransaction' in result) throw new Error('Transaction failed');
      setStatus('ok');
      setForm({ name: '', description: '', price: '', imageUrl: '' });
      refetch();
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err: any) {
      setErrMsg(err.message ?? 'Failed');
      setStatus('error');
    }
  };

  return (
    <section className="bg-gray-800 rounded-xl border border-gray-700 p-6">
      <h2 className="text-xl font-bold text-white mb-4">Add New Product</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            required
            value={form.name}
            onChange={set('name')}
            placeholder="Product name"
            className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <input
            required
            type="number"
            step="0.01"
            min="0.01"
            value={form.price}
            onChange={set('price')}
            placeholder="Price in USDC (e.g. 9.99)"
            className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <textarea
          value={form.description}
          onChange={set('description') as any}
          placeholder="Description (optional)"
          rows={2}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
        />
        <input
          value={form.imageUrl}
          onChange={set('imageUrl')}
          placeholder="Image URL key (optional, e.g. steam-10)"
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />

        {status === 'error' && <p className="text-red-400 text-sm">{errMsg}</p>}
        {status === 'ok' && <p className="text-green-400 text-sm">Product added successfully!</p>}

        <button
          type="submit"
          disabled={status === 'busy'}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium px-6 py-2 rounded-lg transition-colors cursor-pointer"
        >
          {status === 'busy' ? 'Adding…' : 'Add Product'}
        </button>
      </form>
    </section>
  );
}

// ─── Merchant Address Form ────────────────────────────────────────────────────

const SUI_ADDRESS_RE = /^0x[0-9a-fA-F]{64}$/;

function MerchantForm({
  adminCapId,
  dAppKit,
  walletAddress,
}: {
  adminCapId: string;
  dAppKit: ReturnType<typeof useDAppKit>;
  walletAddress: string;
}) {
  const { address: currentAddress, loading: currentLoading, refetch } = useMerchantAddress();
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<'idle' | 'busy' | 'ok' | 'error'>('idle');
  const [errMsg, setErrMsg] = useState('');
  const [txDigest, setTxDigest] = useState<string | null>(null);

  useEffect(() => { refetch(); }, [refetch]);

  const isValid = SUI_ADDRESS_RE.test(input);

  const handleCopy = async () => {
    if (!currentAddress) return;
    await navigator.clipboard.writeText(currentAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setStatus('busy');
    setErrMsg('');
    setTxDigest(null);
    try {
      const tx = buildUpdateMerchant(input, adminCapId);
      const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });
      if ('FailedTransaction' in result) throw new Error('Transaction failed');
      const digest = result.Transaction?.digest ?? null;
      setTxDigest(digest);
      setStatus('ok');
      setInput('');
      // Delay refetch — RPC needs ~2s to index the updated on-chain state
      setTimeout(refetch, 2500);
    } catch (err: any) {
      setErrMsg(err.message ?? 'Failed');
      setStatus('error');
    }
  };

  return (
    <section className="bg-gray-800 rounded-xl border border-gray-700 p-6">
      <h2 className="text-xl font-bold text-white mb-1">Receiving Address</h2>
      <p className="text-gray-500 text-sm mb-5">
        All purchase payments are sent to this address on-chain.
      </p>

      {/* Current address */}
      <div className="bg-gray-900 rounded-lg border border-gray-700 px-4 py-3 mb-5">
        <p className="text-xs text-gray-500 mb-1">Current receiving address</p>
        {currentLoading ? (
          <div className="flex items-center gap-1.5 py-1">
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
          </div>
        ) : currentAddress ? (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-green-400 font-mono text-sm break-all">{currentAddress}</span>
            <button
              onClick={handleCopy}
              className="text-xs text-gray-400 hover:text-white shrink-0 cursor-pointer transition-colors"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <a
              href={`https://suiscan.xyz/${NETWORK}/account/${currentAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300 shrink-0"
            >
              SuiScan ↗
            </a>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Not set</p>
        )}
      </div>

      {/* Update form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2 flex-wrap">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value.trim())}
            placeholder="0x… new receiving address"
            className={`flex-1 min-w-[300px] bg-gray-900 border rounded-lg px-4 py-2 text-white text-sm placeholder-gray-500 focus:outline-none font-mono transition-colors ${
              input && !isValid
                ? 'border-red-600 focus:border-red-500'
                : 'border-gray-700 focus:border-blue-500'
            }`}
          />
          <button
            type="button"
            onClick={() => setInput(walletAddress)}
            className="text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            Use my wallet
          </button>
        </div>

        {input && !isValid && (
          <p className="text-red-400 text-xs">
            Must be a full SUI address (0x + 64 hex characters)
          </p>
        )}

        {status === 'error' && <p className="text-red-400 text-sm">{errMsg}</p>}

        {status === 'ok' && (
          <div className="flex items-center gap-3">
            <p className="text-green-400 text-sm">Receiving address updated!</p>
            {txDigest && (
              <a
                href={`https://suiscan.xyz/${NETWORK}/tx/${txDigest}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-xs"
              >
                View tx ↗
              </a>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={status === 'busy' || !isValid}
          className="bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-6 py-2 rounded-lg transition-colors cursor-pointer"
        >
          {status === 'busy' ? 'Updating…' : 'Update receiving address'}
        </button>
      </form>
    </section>
  );
}

// ─── Inventory Manager ────────────────────────────────────────────────────────

function InventoryManager() {
  const [inventory, setInventory] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [addStatus, setAddStatus] = useState<Record<string, 'idle' | 'busy' | 'ok' | 'error'>>({});

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${AGENT_API_URL}/api/inventory`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setInventory(data.inventory ?? {});
    } catch (err: any) {
      setError(err.message ?? 'Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  const handleAdd = async (productId: string) => {
    const raw = inputs[productId] ?? '';
    const codes = raw.split(/[\n,]+/).map((c) => c.trim()).filter(Boolean);
    if (codes.length === 0) return;

    setAddStatus((s) => ({ ...s, [productId]: 'busy' }));
    try {
      const res = await fetch(`${AGENT_API_URL}/api/inventory/${productId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codes }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setInventory(data.inventory ?? {});
      setInputs((i) => ({ ...i, [productId]: '' }));
      setAddStatus((s) => ({ ...s, [productId]: 'ok' }));
      setTimeout(() => setAddStatus((s) => ({ ...s, [productId]: 'idle' })), 2000);
    } catch (err: any) {
      setAddStatus((s) => ({ ...s, [productId]: 'error' }));
    }
  };

  const [newProductId, setNewProductId] = useState('');
  const allProductIds = Array.from(
    new Set([...Object.keys(inventory), newProductId].filter(Boolean))
  ).sort((a, b) => Number(a) - Number(b));

  const lowStockIds = allProductIds.filter((pid) => (inventory[pid] ?? 0) <= 2 && (inventory[pid] ?? 0) > 0);
  const noStockIds = allProductIds.filter((pid) => (inventory[pid] ?? 0) === 0);

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-white">Inventory</h2>
          <p className="text-gray-500 text-xs mt-0.5">Redemption codes per product</p>
        </div>
        <button
          onClick={fetchInventory}
          disabled={loading}
          className="text-sm text-blue-400 hover:text-blue-300 disabled:opacity-50 cursor-pointer"
        >
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {loading && (
        <div className="py-8 text-center">
          <BounceDots />
          <p className="text-gray-400 text-sm">Loading inventory…</p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 mb-4">
          <p className="text-red-400 text-sm">Could not reach agent server: {error}</p>
        </div>
      )}

      {/* Stock warnings */}
      {(lowStockIds.length > 0 || noStockIds.length > 0) && !error && (
        <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg px-4 py-3 mb-4 space-y-1">
          {noStockIds.length > 0 && (
            <p className="text-yellow-400 text-xs">
              Out of stock: Product{noStockIds.length > 1 ? 's' : ''} #{noStockIds.join(', #')}
            </p>
          )}
          {lowStockIds.length > 0 && (
            <p className="text-yellow-500 text-xs">
              Low stock (&le;2): Product{lowStockIds.length > 1 ? 's' : ''} #{lowStockIds.join(', #')}
            </p>
          )}
        </div>
      )}

      <div className="space-y-3">
        {allProductIds.map((pid) => (
          <div key={pid} className="bg-gray-800 rounded-lg border border-gray-700 px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white text-sm font-medium">Product #{pid}</span>
              <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${
                (inventory[pid] ?? 0) > 2
                  ? 'bg-emerald-900/60 text-emerald-400'
                  : (inventory[pid] ?? 0) > 0
                  ? 'bg-amber-900/60 text-amber-400'
                  : 'bg-gray-700 text-gray-500'
              }`}>
                {inventory[pid] ?? 0} in stock
              </span>
            </div>
            <div className="flex gap-2 items-start">
              <textarea
                value={inputs[pid] ?? ''}
                onChange={(e) => setInputs((i) => ({ ...i, [pid]: e.target.value }))}
                placeholder="Paste codes here, one per line or comma-separated"
                rows={2}
                className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none font-mono"
              />
              <button
                onClick={() => handleAdd(pid)}
                disabled={addStatus[pid] === 'busy' || !(inputs[pid] ?? '').trim()}
                className="text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-2 rounded cursor-pointer shrink-0"
              >
                {addStatus[pid] === 'busy' ? '…' : addStatus[pid] === 'ok' ? 'Added!' : 'Add'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-4">
        <input
          value={newProductId}
          onChange={(e) => setNewProductId(e.target.value.replace(/\D/g, ''))}
          placeholder="Product ID (number)"
          className="w-40 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={() => {
            if (newProductId && !allProductIds.includes(newProductId)) {
              setInventory((inv) => ({ ...inv, [newProductId]: inv[newProductId] ?? 0 }));
            }
          }}
          className="text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded cursor-pointer"
        >
          Add product slot
        </button>
      </div>
    </section>
  );
}

// ─── Recent Orders ────────────────────────────────────────────────────────────

type FulfillmentStatus = 'pending' | 'fulfilled' | 'failed' | 'no_inventory';

interface FulfillmentRecord {
  status: FulfillmentStatus;
  email?: string;
  code?: string;
  fulfilledAt?: string;
  error?: string;
}

interface OrderEvent {
  orderNumber: number;
  productName: string;
  price: number;
  timestamp: number;
  buyer: string;
  txDigest: string;
  fulfillment: FulfillmentRecord | null;
}

function FulfillmentBadge({
  orderNumber,
  fulfillment,
  onRetry,
}: {
  orderNumber: number;
  fulfillment: FulfillmentRecord | null;
  onRetry: (orderNumber: number) => void;
}) {
  if (!fulfillment) {
    return <span className="text-xs text-gray-600">—</span>;
  }

  const { status } = fulfillment;

  if (status === 'fulfilled') {
    return <span className="text-xs bg-emerald-900/60 text-emerald-400 px-2 py-0.5 rounded-full">fulfilled</span>;
  }
  if (status === 'pending') {
    return <span className="text-xs bg-amber-900/60 text-amber-400 px-2 py-0.5 rounded-full">pending</span>;
  }
  if (status === 'no_inventory') {
    return <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">no stock</span>;
  }
  // failed
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs bg-red-900/60 text-red-400 px-2 py-0.5 rounded-full">failed</span>
      <button
        onClick={() => onRetry(orderNumber)}
        className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer"
      >
        Retry
      </button>
    </div>
  );
}

function RecentOrders() {
  const [orders, setOrders] = useState<OrderEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${AGENT_API_URL}/api/orders/recent?limit=50`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setOrders(data.orders ?? []);
      setLastFetched(new Date());
    } catch (err: any) {
      setError(err.message ?? 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10_000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleRetry = async (orderNumber: number) => {
    try {
      await fetch(`${AGENT_API_URL}/api/fulfillments/${orderNumber}/retry`, { method: 'POST' });
      setTimeout(fetchOrders, 1000);
    } catch {
      // ignore
    }
  };

  const pendingCount = orders.filter((o) => o.fulfillment?.status === 'pending').length;
  const failedCount = orders.filter((o) => o.fulfillment?.status === 'failed').length;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-white">Recent Orders</h2>
          <p className="text-gray-500 text-xs mt-0.5">
            Live feed · refreshes every 10s
            {lastFetched && (
              <span className="ml-2 text-gray-600">
                · {lastFetched.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <span className="text-xs bg-amber-900/60 text-amber-400 px-2 py-0.5 rounded-full">
              {pendingCount} pending
            </span>
          )}
          {failedCount > 0 && (
            <span className="text-xs bg-red-900/60 text-red-400 px-2 py-0.5 rounded-full">
              {failedCount} failed
            </span>
          )}
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="text-sm text-blue-400 hover:text-blue-300 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 mb-4">
          <p className="text-red-400 text-sm">
            Could not reach agent server — is it running at{' '}
            <span className="font-mono">{AGENT_API_URL}</span>?
          </p>
          <p className="text-red-500 text-xs mt-1">{error}</p>
        </div>
      )}

      {!error && orders.length === 0 && !loading && (
        <div className="text-center py-16">
          <GradientIcon emoji="📋" />
          <p className="text-gray-500 text-sm">No orders recorded yet.</p>
        </div>
      )}

      {loading && orders.length === 0 && (
        <div className="py-8 text-center">
          <BounceDots />
          <p className="text-gray-400 text-sm">Loading orders…</p>
        </div>
      )}

      {orders.length > 0 && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 bg-gray-900/50 border-b border-gray-700">
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Buyer</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">Tx</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr
                    key={o.txDigest}
                    className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-4 py-2.5 text-gray-500 font-mono">{o.orderNumber}</td>
                    <td className="px-4 py-2.5 text-white">{o.productName}</td>
                    <td className="px-4 py-2.5 text-green-400 font-mono">
                      {formatUsdc(o.price)} USDC
                    </td>
                    <td className="px-4 py-2.5 text-gray-400 font-mono text-xs">
                      {o.buyer.slice(0, 6)}…{o.buyer.slice(-4)}
                    </td>
                    <td className="px-4 py-2.5 text-gray-400 text-xs">
                      {o.fulfillment?.email
                        ? o.fulfillment.email.length > 20
                          ? `${o.fulfillment.email.slice(0, 18)}…`
                          : o.fulfillment.email
                        : '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      <FulfillmentBadge
                        orderNumber={o.orderNumber}
                        fulfillment={o.fulfillment}
                        onRetry={handleRetry}
                      />
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(o.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5">
                      <a
                        href={`https://suiscan.xyz/${NETWORK}/tx/${o.txDigest}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-xs"
                      >
                        View ↗
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
