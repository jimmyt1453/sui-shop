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

  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Name */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🛍️</span>
            <span className="text-xl font-bold text-white">
              Jimmy's SUI Shop
            </span>
            <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full uppercase">
              {NETWORK}
            </span>
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

            {/* USDC Balance */}
            {account && (
              <div className="text-sm text-gray-400">
                <span className="text-green-400 font-mono">
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
