import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DAppKitProvider } from '@mysten/dapp-kit-react';
import { dAppKit } from './dapp-kit';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { CartPage } from './pages/CartPage';
import { OrdersPage } from './pages/OrdersPage';
import { AdminPage } from './pages/AdminPage';


function App() {
  return (
    <DAppKitProvider dAppKit={dAppKit}>
      <CartProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-gray-950">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/admin" element={<AdminPage />} />
              </Routes>
            </main>
            <footer className="border-t border-gray-800 py-6 mt-16">
              <div className="max-w-7xl mx-auto px-4 text-center text-gray-600 text-sm">
                Jimmy's SUI Shop &mdash; Powered by SUI Blockchain &amp; USDC
              </div>
            </footer>
          </div>
        </BrowserRouter>
      </CartProvider>
    </DAppKitProvider>
  );
}

export default App;
