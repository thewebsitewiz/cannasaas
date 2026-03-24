import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { ClipboardList, Truck, Warehouse, Search, LogOut } from 'lucide-react';
import { useAuthStore } from '../stores/auth.store';
import { OrderToast } from '../components/OrderToast';
import { ClockWidget } from '../components/layout/ClockWidget';
import { DarkModeToggle } from '../components/DarkModeToggle';

const NAV = [
  { to: '/', label: 'Orders', icon: ClipboardList },
  { to: '/fulfillment', label: 'Fulfillment', icon: Truck },
  { to: '/inventory', label: 'Inventory', icon: Warehouse },
  { to: '/products', label: 'Lookup', icon: Search },
];

export function StaffLayout() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gray-900 text-white">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-6">
            <span className="font-bold text-brand-400">Staff Portal</span>
            <nav className="flex items-center gap-1">
              {NAV.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`
                  }
                >
                  <Icon size={16} />
                  <span className="hidden sm:inline">{label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <ClockWidget />
            <span className="text-xs text-gray-500 hidden sm:inline">{user?.email}</span>
            <DarkModeToggle />
            <button onClick={() => { logout(); navigate('/login'); }} className="text-gray-400 hover:text-white">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <OrderToast />
      <main className="flex-1 p-4 sm:p-6">
        <Outlet />
      </main>
    </div>
  );
}
