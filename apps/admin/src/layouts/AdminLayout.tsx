import {
  ArrowRightLeft,
  BarChart3,
  Building2,
  CalendarDays,
  Clock,
  LayoutDashboard,
  LogOut,
  Package,
  Receipt,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Star,
  Users,
  Monitor,
  Warehouse,
  List,
} from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import { useAuthStore } from '../stores/auth.store';
import { DarkModeToggle } from '../components/DarkModeToggle';

const NAV_ITEMS: Array<{ to: string; label: string; icon: typeof LayoutDashboard; superOnly?: boolean }> = [
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
  { to: '/menu-board', label: 'Menu Board', icon: Monitor },
  { to: '/tax-management', label: 'Tax Rules', icon: Receipt, superOnly: true },
  { to: '/menu-categories', label: 'Menu Categories', icon: List },
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

  const visibleNav = NAV_ITEMS.filter(
    (item) => !item.superOnly || user?.role === 'super_admin',
  );

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gs-deep-pine text-txt-inverse flex flex-col" role="navigation" aria-label="Main navigation">
        <div className="p-6 border-b border-gs-pine">
          <h1 className="text-xl font-bold text-brand-400">CannaSaas</h1>
          <p className="text-xs text-txt-muted mt-1">Admin Portal</p>
        </div>

        <nav className="flex-1 py-4" aria-label="Admin navigation">
          {visibleNav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              aria-label={label}
              className={({ isActive }) =>
                `flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-gs-pine text-txt-inverse border-r-2 border-brand-500'
                    : 'text-txt-muted hover:text-txt-inverse hover:bg-gs-pine/50'
                }`
              }
            >
              <Icon size={18} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gs-pine">
          <div className="text-xs text-txt-secondary mb-2" aria-label="Logged in user">{user?.email}</div>
          <div className="flex items-center justify-between">
            <button
              onClick={handleLogout}
              aria-label="Sign out"
              className="flex items-center gap-2 text-sm text-txt-muted hover:text-txt-inverse transition-colors"
            >
              <LogOut size={16} aria-hidden="true" />
              Sign Out
            </button>
            <DarkModeToggle />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto" role="main" aria-label="Page content">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
