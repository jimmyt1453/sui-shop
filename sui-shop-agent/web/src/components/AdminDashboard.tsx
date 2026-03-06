import { useEffect, useState } from 'react';
import { useAgentStatus } from '../hooks/useAgentStatus';

interface OrderEvent {
  orderNumber: number;
  productId: number;
  productName: string;
  price: number;
  timestamp: number;
  buyer: string;
  txDigest: string;
}

interface OrdersResponse {
  ok: boolean;
  orders: OrderEvent[];
  count: number;
}

function formatUsdc(raw: number): string {
  return (raw / 1_000_000).toFixed(2);
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

export function AdminDashboard() {
  const [orders, setOrders] = useState<OrderEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { status } = useAgentStatus();
  const network = status?.network || 'testnet';

  useEffect(() => {
    fetch('/api/orders/recent?limit=100')
      .then((r) => r.json() as Promise<OrdersResponse>)
      .then((data) => {
        if (data.ok) {
          setOrders(data.orders);
          setTotal(data.count);
        } else {
          setError('Failed to load orders');
        }
      })
      .catch(() => setError('Could not reach server'))
      .finally(() => setLoading(false));
  }, []);

  const totalRevenue = orders.reduce((s, o) => s + o.price, 0);
  const avgOrder = orders.length > 0 ? totalRevenue / orders.length : 0;

  return (
    <div className="flex flex-col gap-6 py-4">
      <div>
        <h2 className="text-lg font-bold text-white">Admin Dashboard</h2>
        <p className="text-slate-500 text-sm">On-chain order events from the SUI Shop contract ({network})</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <span className="w-6 h-6 border-2 border-slate-700 border-t-blue-400 rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="bg-red-950/40 border border-red-800/40 text-red-400 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard
              icon="📦"
              label="Total Orders"
              value={String(total)}
              iconBg="bg-blue-500/15 text-blue-400"
            />
            <StatCard
              icon="💰"
              label="Total Revenue"
              value={`$${formatUsdc(totalRevenue)}`}
              iconBg="bg-emerald-500/15 text-emerald-400"
            />
            <StatCard
              icon="📊"
              label="Avg Order"
              value={`$${formatUsdc(avgOrder)}`}
              iconBg="bg-violet-500/15 text-violet-400"
            />
          </div>

          {/* Orders table */}
          <div className="bg-black border border-subtle rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-subtle flex justify-between items-center bg-subtle">
              <h3 className="text-sm font-semibold text-white">Recent Orders</h3>
              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{network}</span>
            </div>

            {orders.length === 0 ? (
              <div className="px-4 py-12 text-center text-gray-600 text-sm">
                No orders yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-black border-b border-subtle z-0">
                    <tr className="text-xs text-gray-500 uppercase tracking-wide border-b border-subtle bg-black">
                      <th className="px-4 py-3 text-left font-medium">#</th>
                      <th className="px-4 py-3 text-left font-medium">Product</th>
                      <th className="px-4 py-3 text-right font-medium">Price</th>
                      <th className="px-4 py-3 text-left font-medium">Buyer</th>
                      <th className="px-4 py-3 text-left font-medium">Time</th>
                      <th className="px-4 py-3 text-left font-medium">Tx</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.txDigest + order.orderNumber} className="border-b border-subtle hover:bg-subtle transition-colors group">
                        <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                          #{order.orderNumber}
                        </td>
                        <td className="px-4 py-3 text-gray-200 font-medium group-hover:text-white transition-colors">
                          {order.productName}
                        </td>
                        <td className="px-4 py-3 text-emerald-400 text-right font-mono">
                          ${formatUsdc(order.price)}
                        </td>
                        <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                          {order.buyer.slice(0, 6)}…{order.buyer.slice(-4)}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                          {timeAgo(order.timestamp)}
                        </td>
                        <td className="px-4 py-3">
                          <a
                            href={`https://suiscan.xyz/${network}/tx/${order.txDigest}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-400 font-mono text-xs transition-colors"
                          >
                            {order.txDigest.slice(0, 8)}…
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, iconBg }: { icon: string; label: string; value: string; iconBg: string }) {
  return (
    <div className="bg-black border border-subtle rounded-2xl px-4 py-4 flex flex-col gap-3 shadow-sm hover:border-gray-700 transition-colors">
      <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-base ${iconBg}`}>
        {icon}
      </span>
      <div>
        <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">{label}</p>
        <p className="text-white text-xl font-mono">{value}</p>
      </div>
    </div>
  );
}
