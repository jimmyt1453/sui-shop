import { useState, useEffect } from 'react';
import { useCurrentAccount, useDAppKit } from '@mysten/dapp-kit-react';
import { ConnectButton } from '@mysten/dapp-kit-react';
import { useAdminCap } from '../hooks/useAdminCap';
import { useShopProducts } from '../hooks/useShopProducts';
import { useMerchantAddress } from '../hooks/useMerchantAddress';
import { formatUsdc, parseUsdc, NETWORK } from '../config/constants';
import {
  buildUpdatePrice,
  buildAddProduct,
  buildToggleProduct,
  buildUpdateMerchant,
} from '../lib/adminTransactions';

export function AdminPage() {
  const account = useCurrentAccount();
  const dAppKit = useDAppKit();
  const { adminCapId, isAdmin, loading: capLoading } = useAdminCap();
  const { products, loading: productsLoading, error, refetch } = useShopProducts();

  if (!account) {
    return (
      <div className="text-center py-20">
        <span className="text-6xl block mb-4">🔒</span>
        <h2 className="text-2xl font-bold text-white mb-2">Admin Access Required</h2>
        <p className="text-gray-400 mb-6">Connect the wallet that holds the AdminCap.</p>
        <ConnectButton />
      </div>
    );
  }

  if (capLoading) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 animate-pulse">Checking admin privileges…</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-20">
        <span className="text-6xl block mb-4">⛔</span>
        <h2 className="text-2xl font-bold text-white mb-2">Not Authorized</h2>
        <p className="text-gray-400">
          The connected wallet does not own the AdminCap for this shop.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        <span className="text-xs bg-green-800 text-green-300 px-3 py-1 rounded-full">
          AdminCap verified ✓
        </span>
      </div>

      {/* Product Manager */}
      <ProductManager
        products={products}
        loading={productsLoading}
        error={error}
        adminCapId={adminCapId!}
        dAppKit={dAppKit}
        refetch={refetch}
      />

      {/* Add Product */}
      <AddProductForm adminCapId={adminCapId!} dAppKit={dAppKit} refetch={refetch} />

      {/* Receiving Address */}
      <MerchantForm adminCapId={adminCapId!} dAppKit={dAppKit} walletAddress={account.address} />
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

  if (loading) return <p className="text-gray-400 animate-pulse">Loading on-chain products…</p>;
  if (error) return <p className="text-red-400">{error}</p>;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Products ({products.length})</h2>
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
            className={`bg-gray-800 rounded-lg border px-4 py-3 flex flex-wrap items-center gap-3 transition-colors ${
              p.active ? 'border-gray-700' : 'border-gray-700 opacity-50'
            }`}
          >
            {/* ID + name */}
            <span className="text-gray-500 text-xs font-mono w-6">#{p.id}</span>
            <span className="text-white text-sm flex-1 min-w-[160px]">{p.name}</span>

            {/* Status badge */}
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                p.active
                  ? 'bg-green-900 text-green-400'
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
                  ? 'bg-red-900 hover:bg-red-800 text-red-300'
                  : 'bg-green-900 hover:bg-green-800 text-green-300'
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
      refetch();
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
          <p className="text-gray-400 text-sm animate-pulse">Loading…</p>
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
