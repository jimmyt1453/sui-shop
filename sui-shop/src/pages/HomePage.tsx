import { ProductGrid } from '../components/ProductGrid';

export function HomePage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Digital Products
        </h1>
        <p className="text-gray-400">
          Pay with USDC on SUI. Instant delivery to your email.
        </p>
      </div>
      <ProductGrid />
    </div>
  );
}
