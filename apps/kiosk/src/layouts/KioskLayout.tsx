import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, RotateCcw } from 'lucide-react';
import { useCartStore } from '../stores/cart.store';

export function KioskLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const itemCount = useCartStore((s) => s.itemCount());
  const clearCart = useCartStore((s) => s.clearCart);
  const isHome = location.pathname === '/';

  const handleReset = () => { clearCart(); navigate('/'); };

  return (
    <div className="h-screen flex flex-col bg-stone-50 select-none">
      {/* Header */}
      <header className="bg-[#0a1a0f] px-8 h-20 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          {!isHome && (
            <button onClick={() => navigate(-1)} className="p-3 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 transition-colors">
              <ArrowLeft size={24} className="text-white" />
            </button>
          )}
          <button onClick={() => navigate('/')} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-sm tracking-tighter">GL</div>
            <span className="text-2xl font-semibold text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>GreenLeaf</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/cart')}
            className="relative flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-7 py-3.5 rounded-full text-lg font-semibold transition-all active:scale-95">
            <ShoppingBag size={22} />
            Cart
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-white text-emerald-700 text-sm font-bold rounded-full w-7 h-7 flex items-center justify-center shadow-md">
                {itemCount}
              </span>
            )}
          </button>
          <button onClick={handleReset}
            className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white/60 transition-colors">
            <RotateCcw size={20} />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-[#0a1a0f] px-6 py-3 text-center text-xs text-white/30 shrink-0">
        Must be 21+ with valid ID · Tap any product to learn more
      </footer>
    </div>
  );
}
