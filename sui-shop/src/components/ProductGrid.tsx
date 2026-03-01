import { useState } from 'react';
import { PRODUCTS } from '../config/constants';
import { ProductCard } from './ProductCard';

const CATEGORIES = [
  { icon: '✨', label: 'All' },
  { icon: '🎮', label: 'Gaming' },
  { icon: '🎬', label: 'Entertainment' },
  { icon: '💳', label: 'Digital' },
  { icon: '🛍', label: 'Shopping' },
  { icon: '🍔', label: 'Food' },
];

export function ProductGrid() {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredProducts =
    selectedCategory === 'All'
      ? PRODUCTS
      : PRODUCTS.filter((p) => p.category === selectedCategory);

  return (
    <div>
      {/* Hero Header */}
      <div className="text-center mb-10">
        <div className="relative inline-flex items-center justify-center mb-4">
          <div className="absolute w-16 h-16 rounded-2xl bg-blue-600/30 motion-safe:animate-ping" />
          <div className="relative w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center text-3xl">
            🛍️
          </div>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Browse Products</h1>
        <p className="text-gray-400 text-sm">
          Digital gift cards, purchased with USDC on SUI
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {CATEGORIES.map(({ icon, label }) => {
          const count =
            label === 'All'
              ? PRODUCTS.length
              : PRODUCTS.filter((p) => p.category === label).length;
          const isActive = selectedCategory === label;
          return (
            <button
              key={label}
              onClick={() => setSelectedCategory(label)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <span>{icon}</span>
              <span>
                {isActive ? `${label} · ${filteredProducts.length}` : label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
