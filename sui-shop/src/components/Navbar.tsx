import { Link, useLocation } from 'react-router-dom';
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit-react';
import { useCart } from '../context/CartContext';
import { useUsdcBalance } from '../hooks/useUsdcBalance';
import { useAdminCap } from '../hooks/useAdminCap';
import { formatUsdc, NETWORK } from '../config/constants';

export function Navbar() {
  const account = useCurrentAccount();
  const { totalItems } = useCart();
  const { balance } = useUsdcBalance();
  const { isAdmin } = useAdminCap();
  const location = useLocation();

  const isActive = (path: string) =>
    location.pathname === path
      ? 'text-blue-400 border-b-2 border-blue-400'
      : 'text-gray-300 hover:text-white';

  const networkBadgeColor =
    NETWORK === 'mainnet'
      ? 'bg-emerald-600'
      : NETWORK === 'testnet'
        ? 'bg-amber-500'
        : 'bg-blue-600';

  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Name */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
              🛍️
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold text-white">Jimmy's SUI Shop</span>
              <span className="text-xs text-gray-500">SUI Blockchain</span>
            </div>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className={`pb-1 text-sm font-medium transition-colors ${isActive('/')}`}
            >
              Products
            </Link>

            <Link
              to="/cart"
              className={`pb-1 text-sm font-medium transition-colors relative ${isActive('/cart')}`}
            >
              Cart
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-4 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>

            {account && (
              <Link
                to="/orders"
                className={`pb-1 text-sm font-medium transition-colors ${isActive('/orders')}`}
              >
                Orders
              </Link>
            )}

            {isAdmin && (
              <Link
                to="/admin"
                className={`pb-1 text-sm font-medium transition-colors ${isActive('/admin')}`}
              >
                ⚙ Admin
              </Link>
            )}

            {/* Network badge + USDC Balance */}
            {account && (
              <div className="flex items-center gap-2">
                <span
                  className={`flex items-center gap-1 text-xs text-white px-2 py-0.5 rounded-full uppercase font-medium ${networkBadgeColor}`}
                >
                  <span className="w-1.5 h-1.5 bg-white/70 rounded-full animate-pulse" />
                  {NETWORK}
                </span>
                <span className="bg-gray-800 border border-gray-700 rounded-full px-2.5 py-0.5 text-sm font-mono text-green-400">
                  {formatUsdc(balance)} USDC
                </span>
              </div>
            )}

            {/* Wallet Connect */}
            <ConnectButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
