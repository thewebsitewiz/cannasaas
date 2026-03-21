import {
  ArrowRightLeft,
  BarChart3,
  Building2,
  CalendarDays,
  Clock,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Star,
  Users,
  Warehouse,
} from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import { useAuthStore } from '../stores/auth.store';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/inventory', label: 'Inventory', icon: Warehouse },
  { to: '/compliance', label: 'Compliance', icon: ShieldCheck },
  { to: '/staffing', label: 'Staffing', icon: Users },
  { to: '/timeclock', label: 'Time Clock', icon: Clock },
  { to: '/scheduling', label: 'Scheduling', icon: CalendarDays },
  { to: '/inventory-control', label: 'Inv. Control', icon: ArrowRightLeft },
  { to: '/vendors', label: 'Vendors', icon: Building2 },
  { to: '/loyalty', label: 'Loyalty', icon: Star },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gs-deep-pine text-txt-inverse flex flex-col">
        <div className="p-6 border-b border-gs-pine">
          <h1 className="text-xl font-bold text-brand-400">CannaSaas</h1>
          <p className="text-xs text-txt-muted mt-1">Admin Portal</p>
        </div>

        <nav className="flex-1 py-4">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-gs-pine text-txt-inverse border-r-2 border-brand-500'
                    : 'text-txt-muted hover:text-txt-inverse hover:bg-gs-pine/50'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gs-pine">
          <div className="text-xs text-txt-secondary mb-2">{user?.email}</div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-txt-muted hover:text-txt-inverse transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
