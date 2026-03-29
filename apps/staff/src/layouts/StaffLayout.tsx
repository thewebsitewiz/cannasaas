import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { ClipboardList, Truck, Warehouse, Search, LogOut, CalendarDays, ShoppingCart as ShoppingCartIcon,
} from 'lucide-react';
import { useAuthStore } from '../stores/auth.store';
import { OrderToast } from '../components/OrderToast';
import { ClockWidget } from '../components/layout/ClockWidget';
import { DarkModeToggle } from '../components/DarkModeToggle';

const NAV = [
    { to: '/new-order', label: 'New Order', icon: ShoppingCartIcon },
  { to: '/', label: 'Orders', icon: ClipboardList },
  { to: '/fulfillment', label: 'Fulfillment', icon: Truck },
  { to: '/inventory', label: 'Inventory', icon: Warehouse },
  { to: '/products', label: 'Lookup', icon: Search },
  { to: '/timesheets', label: 'Timesheets', icon: CalendarDays },
];

export function StaffLayout() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 text-white flex flex-col" role="navigation" aria-label="Staff navigation">
        <div className="p-5 border-b border-gray-800">
          <h1 className="text-lg font-bold text-brand-400">CannaSaas</h1>
          <p className="text-xs text-gray-500 mt-0.5">Staff Portal</p>
        </div>

        <nav className="flex-1 py-3" aria-label="Staff navigation">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              aria-label={label}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-gray-800 text-white border-r-2 border-brand-500'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`
              }
            >
              <Icon size={18} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800 space-y-3">
          <ClockWidget />
          <div className="text-xs text-gray-500 truncate">{user?.email}</div>
          <div className="flex items-center justify-between">
            <button
              onClick={() => { logout(); navigate('/login'); }}
              aria-label="Sign out"
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <LogOut size={16} aria-hidden="true" />
              Sign Out
            </button>
            <DarkModeToggle />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-auto">
        <OrderToast />
        <main className="flex-1 p-6" role="main" aria-label="Page content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
