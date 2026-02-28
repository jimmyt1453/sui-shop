import { useCurrentAccount } from '@mysten/dapp-kit-react';
import { useOrders } from '../hooks/useOrders';
import { formatUsdc, PRODUCTS, NETWORK } from '../config/constants';

export function OrderHistory() {
  const account = useCurrentAccount();
  const { orders, loading, error, refetch } = useOrders();

  if (!account) {
    return (
      <div className="text-center py-16">
        <span className="text-6xl block mb-4">🔒</span>
        <h2 className="text-2xl font-bold text-white mb-2">
          Connect Your Wallet
        </h2>
        <p className="text-gray-400">
          Connect your SUI wallet to view your order history.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin text-4xl mb-4">⏳</div>
        <p className="text-gray-400">Loading orders from the blockchain...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <span className="text-4xl block mb-4">⚠️</span>
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={refetch}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-16">
        <span className="text-6xl block mb-4">📋</span>
        <h2 className="text-2xl font-bold text-white mb-2">No Orders Yet</h2>
        <p className="text-gray-400">
          Your on-chain purchase receipts will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">
          Order History{' '}
          <span className="text-sm text-gray-500 font-normal">
            ({orders.length} orders)
          </span>
        </h2>
        <button
          onClick={refetch}
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-3">
        {orders.map((order) => {
          const product = PRODUCTS.find((p) => p.id === order.productId);
          const emoji = product?.emoji || '📦';

          return (
            <div
              key={order.id}
              className="bg-gray-800 rounded-lg border border-gray-700 p-4 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl">{emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-medium text-sm">
                      {order.productName}
                    </h3>
                    <span className="text-xs bg-green-900 text-green-400 px-2 py-0.5 rounded-full">
                      Order #{order.orderNumber}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                    <span>
                      {new Date(order.timestamp).toLocaleString()}
                    </span>
                    <span>Delivered to: {order.email}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-mono font-bold">
                    {formatUsdc(order.price)} USDC
                  </p>
                  <a
                    href={`https://suiscan.xyz/${NETWORK}/object/${order.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    View Receipt →
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
