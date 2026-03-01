import { useState, useEffect } from 'react';
import { useCurrentAccount, useDAppKit } from '@mysten/dapp-kit-react';
import { useCart } from '../context/CartContext';
import { useUsdcBalance } from '../hooks/useUsdcBalance';
import { useTxStatus } from '../hooks/useTxStatus';
import { PRODUCTS, formatUsdc } from '../config/constants';
import { buildMultiPurchaseWithCoins } from '../lib/transactions';
import { useNavigate } from 'react-router-dom';

export function Checkout() {
  const account = useCurrentAccount();
  const dAppKit = useDAppKit();
  const { items, totalPrice, clearCart } = useCart();
  const { balance, coins } = useUsdcBalance();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<
    'idle' | 'processing' | 'confirming' | 'success' | 'error'
  >('idle');
  const [txDigest, setTxDigest] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const { confirmStatus, attempts, startPolling, reset: resetTxStatus } = useTxStatus();

  const canPurchase =
    account &&
    email.includes('@') &&
    items.length > 0 &&
    balance >= totalPrice &&
    status === 'idle';

  const handlePurchase = async () => {
    if (!canPurchase || coins.length === 0) return;

    setStatus('processing');
    setErrorMsg('');

    try {
      // Build purchases array - one entry per item * quantity
      const purchases: Array<{ productId: number; price: number }> = [];
      for (const item of items) {
        const product = PRODUCTS.find((p) => p.id === item.productId);
        if (!product) continue;
        for (let i = 0; i < item.quantity; i++) {
          purchases.push({ productId: product.id, price: product.price });
        }
      }

      const coinIds = coins.map((c) => c.coinObjectId);
      const tx = buildMultiPurchaseWithCoins(purchases, email, coinIds);

      const result = await dAppKit.signAndExecuteTransaction({
        transaction: tx,
      });

      if ('FailedTransaction' in result) {
        throw new Error('Transaction failed on chain');
      }

      const digest = result.Transaction?.digest || 'unknown';
      setTxDigest(digest);
      clearCart();
      setStatus('confirming');
      startPolling(digest);
    } catch (err: any) {
      console.error('Purchase failed:', err);
      setErrorMsg(err.message || 'Transaction failed');
      setStatus('error');
      resetTxStatus();
    }
  };

  useEffect(() => {
    if (status !== 'confirming') return;
    if (confirmStatus === 'confirmed' || confirmStatus === 'timeout') {
      setStatus('success');
    } else if (confirmStatus === 'failed') {
      setErrorMsg('Transaction rejected on-chain.');
      setStatus('error');
    }
  }, [confirmStatus, status]);

  if (items.length === 0 && status !== 'success' && status !== 'confirming') {
    return null;
  }

  if (status === 'confirming') {
    return (
      <div className="max-w-lg mx-auto mt-8 bg-gray-800 rounded-xl border border-blue-700 p-8 text-center">
        <div className="relative inline-flex items-center justify-center mb-4">
          <div className="absolute w-16 h-16 rounded-2xl bg-blue-600/30 motion-safe:animate-ping" />
          <div className="relative w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center text-3xl">
            ⛓️
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Confirming on-chain...
        </h2>
        <p className="text-gray-400 mb-2">
          Waiting for the network to confirm your transaction.
        </p>
        <p className="text-blue-400 text-sm mb-4">
          Attempt {attempts} of 15
        </p>
        {txDigest && (
          <a
            href={`https://suiscan.xyz/testnet/tx/${txDigest}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 text-sm block"
          >
            View transaction on SuiScan →
          </a>
        )}
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="max-w-lg mx-auto mt-8 bg-gray-800 rounded-xl border border-green-700 p-8 text-center">
        {confirmStatus === 'timeout' ? (
          <>
            <div className="relative inline-flex items-center justify-center mb-4">
              <div className="absolute w-16 h-16 rounded-2xl bg-blue-600/30 motion-safe:animate-ping" />
              <div className="relative w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center text-3xl">
                📡
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Transaction Submitted
            </h2>
            <p className="text-gray-400 mb-4">
              Your transaction was submitted. Check SuiScan for the final status.
            </p>
          </>
        ) : (
          <>
            <div className="relative inline-flex items-center justify-center mb-4">
              <div className="absolute w-16 h-16 rounded-2xl bg-emerald-600/30 motion-safe:animate-ping" />
              <div className="relative w-16 h-16 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl flex items-center justify-center text-3xl">
                ✅
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Transaction confirmed on-chain ✓
            </h2>
            <p className="text-gray-400 mb-4">
              Your digital products will be delivered to{' '}
              <span className="text-blue-400">{email}</span>
            </p>
          </>
        )}
        {txDigest && (
          <a
            href={`https://suiscan.xyz/testnet/tx/${txDigest}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 text-sm block mb-6"
          >
            View transaction on SuiScan →
          </a>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate('/orders')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition-colors cursor-pointer"
          >
            View Orders
          </button>
          <button
            onClick={() => {
              resetTxStatus();
              setStatus('idle');
              navigate('/');
            }}
            className="bg-gray-700 hover:bg-gray-600 text-white font-medium px-6 py-2 rounded-lg transition-colors cursor-pointer"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto mt-8 bg-gray-800 rounded-xl border border-gray-700 p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-lg flex items-center justify-center text-sm">
          💳
        </div>
        <h3 className="text-lg font-bold text-white">Checkout</h3>
      </div>

      {/* Email Input */}
      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-1">
          Email for delivery
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Wallet Status */}
      {!account && (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3 mb-4">
          <p className="text-yellow-400 text-sm">
            Please connect your SUI wallet to proceed.
          </p>
        </div>
      )}

      {/* Balance Check */}
      {account && balance < totalPrice && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-4">
          <p className="text-red-400 text-sm">
            Insufficient USDC balance. You need{' '}
            <span className="font-mono">{formatUsdc(totalPrice)} USDC</span> but
            have{' '}
            <span className="font-mono">{formatUsdc(balance)} USDC</span>.
          </p>
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-4">
          <p className="text-red-400 text-sm">{errorMsg}</p>
          <button
            onClick={() => { resetTxStatus(); setStatus('idle'); }}
            className="text-red-300 text-xs mt-1 hover:underline cursor-pointer"
          >
            Try again
          </button>
        </div>
      )}

      {/* Summary */}
      <div className="flex items-center justify-between py-3 border-t border-gray-700">
        <span className="text-gray-400">
          {items.reduce((sum, i) => sum + i.quantity, 0)} item(s)
        </span>
        <span className="text-xl font-bold text-green-400 font-mono">
          {formatUsdc(totalPrice)} USDC
        </span>
      </div>

      {/* Pay Button */}
      <button
        onClick={handlePurchase}
        disabled={!canPurchase}
        className={`w-full py-3 rounded-lg font-bold text-white transition-colors mt-2 cursor-pointer ${
          canPurchase
            ? 'bg-green-600 hover:bg-green-700'
            : 'bg-gray-700 cursor-not-allowed opacity-50'
        }`}
      >
        {status === 'processing' ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Processing...
          </span>
        ) : (
          `Pay ${formatUsdc(totalPrice)} USDC`
        )}
      </button>
    </div>
  );
}
