import { useCart } from '../context/CartContext';
import { PRODUCTS, formatUsdc } from '../config/constants';
import { Link } from 'react-router-dom';

export function Cart() {
  const { items, removeItem, updateQuantity, totalPrice, clearCart } =
    useCart();

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="relative inline-flex items-center justify-center mb-4">
          <div className="absolute w-16 h-16 rounded-2xl bg-blue-600/30 motion-safe:animate-ping" />
          <div className="relative w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center text-3xl">
            🛒
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Your cart is empty
        </h2>
        <p className="text-gray-400 mb-6">
          Browse our products and add items to your cart.
        </p>
        <Link
          to="/"
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors inline-block"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Shopping Cart</h2>
        <button
          onClick={clearCart}
          className="text-sm text-red-400 hover:text-red-400 transition-colors cursor-pointer flex items-center gap-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
            <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
          </svg>
          Clear Cart
        </button>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const product = PRODUCTS.find((p) => p.id === item.productId);
          if (!product) return null;

          return (
            <div
              key={item.productId}
              className="bg-gray-800 rounded-lg border border-gray-700 p-4 flex items-center gap-4"
            >
              <span className="text-3xl">{product.emoji}</span>
              <div className="flex-1">
                <h3 className="text-white font-medium text-sm">
                  {product.name}
                </h3>
                <p className="text-green-400 text-sm font-mono">
                  {formatUsdc(product.price)} USDC
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    updateQuantity(item.productId, item.quantity - 1)
                  }
                  className="w-8 h-8 rounded bg-gray-700 text-white hover:bg-gray-600 transition-colors cursor-pointer flex items-center justify-center"
                >
                  -
                </button>
                <span className="text-white font-mono w-8 text-center">
                  {item.quantity}
                </span>
                <button
                  onClick={() =>
                    updateQuantity(item.productId, item.quantity + 1)
                  }
                  className="w-8 h-8 rounded bg-gray-700 text-white hover:bg-gray-600 transition-colors cursor-pointer flex items-center justify-center"
                >
                  +
                </button>
              </div>
              <div className="text-right min-w-[80px]">
                <p className="text-white font-mono text-sm">
                  {formatUsdc(product.price * item.quantity)} USDC
                </p>
              </div>
              <button
                onClick={() => removeItem(item.productId)}
                className="text-gray-500 hover:text-red-400 transition-colors cursor-pointer ml-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                  <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div className="mt-6 bg-gray-800 rounded-lg border border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-lg">Total</span>
          <span className="text-2xl font-bold text-green-400 font-mono">
            {formatUsdc(totalPrice)} USDC
          </span>
        </div>
      </div>
    </div>
  );
}
