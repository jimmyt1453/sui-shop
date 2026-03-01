import type { ProductInfo } from '../config/constants';
import { formatUsdc } from '../config/constants';
import { useCart } from '../context/CartContext';

const CATEGORY_COLORS: Record<string, string> = {
  Gaming: 'bg-violet-900/60 text-violet-300',
  Entertainment: 'bg-blue-900/60 text-blue-300',
  Digital: 'bg-amber-900/60 text-amber-300',
  Shopping: 'bg-emerald-900/60 text-emerald-300',
  Food: 'bg-orange-900/60 text-orange-300',
};

interface Props {
  product: ProductInfo;
}

export function ProductCard({ product }: Props) {
  const { addItem, items } = useCart();
  const cartItem = items.find((item) => item.productId === product.id);
  const inCart = cartItem ? cartItem.quantity : 0;

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden hover:border-blue-500 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/10 flex flex-col">
      {/* Product Image/Emoji Area */}
      <div className="bg-gradient-to-br from-blue-950/60 to-gray-800 p-8 flex items-center justify-center">
        <span className="text-6xl">{product.emoji}</span>
      </div>

      {/* Product Info */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-white font-semibold text-sm leading-tight">
            {product.name}
          </h3>
          <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${CATEGORY_COLORS[product.category] ?? 'bg-gray-700 text-gray-300'}`}>
            {product.category}
          </span>
        </div>

        <p className="text-gray-400 text-xs mt-1 flex-1">
          {product.description}
        </p>

        <div className="flex items-center justify-between mt-4">
          <div className="text-lg font-bold text-green-400">
            {formatUsdc(product.price)}{' '}
            <span className="text-xs text-gray-500">USDC</span>
          </div>

          <button
            onClick={() => addItem(product.id)}
            className={`text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              inCart > 0
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {inCart > 0 ? (
              <>
                <span>In Cart ({inCart})</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 opacity-80">
                  <path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z" />
                </svg>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                  <path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z" />
                </svg>
                Add to Cart
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
