import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Leaf, ShoppingCart, ArrowLeft, RotateCcw } from 'lucide-react';
import { useCartStore } from '../stores/cart.store';

export function KioskLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const itemCount = useCartStore((s) => s.itemCount());
  const clearCart = useCartStore((s) => s.clearCart);
  const isHome = location.pathname === '/';

  const handleReset = () => {
    clearCart();
    navigate('/');
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 select-none">
      {/* Kiosk Header — large touch targets */}
      <header className="bg-white border-b border-gray-200 px-6 h-20 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          {!isHome && (
            <button onClick={() => navigate(-1)} className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors">
              <ArrowLeft size={24} />
            </button>
          )}
          <button onClick={() => navigate('/')} className="flex items-center gap-3">
            <Leaf size={32} className="text-brand-600" />
            <span className="text-2xl font-bold text-gray-900">GreenLeaf</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/cart')}
            className="relative flex items-center gap-2 bg-brand-600 text-white px-6 py-3 rounded-xl text-lg font-semibold hover:bg-brand-700 active:bg-brand-800 transition-colors">
            <ShoppingCart size={22} />
            Cart
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-sm font-bold rounded-full w-7 h-7 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </button>
          <button onClick={handleReset}
            className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-500 transition-colors">
            <RotateCcw size={22} />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      {/* Kiosk Footer */}
      <footer className="bg-white border-t border-gray-200 px-6 py-3 text-center text-xs text-gray-400 shrink-0">
        Must be 21+ with valid ID to purchase · Tap to browse our menu
      </footer>
    </div>
  );
}
