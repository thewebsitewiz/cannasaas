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
  Sparkles,
  Star,
  Users,
  Monitor,
  Warehouse,
} from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

import { useAuthStore } from '../stores/auth.store';
import { DarkModeToggle } from '../components/DarkModeToggle';

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
  { to: '/menu-board', label: 'Menu Board', icon: Monitor },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/changelog', label: "What's New", icon: Sparkles },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [hasNewChangelog, setHasNewChangelog] = useState(false);

  useEffect(() => {
    const lastSeen = localStorage.getItem('changelog_last_seen');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    fetch(`${apiUrl}/changelog?limit=1`)
      .then(r => r.json())
      .then(entries => {
        if (entries.length > 0 && (!lastSeen || new Date(entries[0].created_at) > new Date(lastSeen))) {
          setHasNewChangelog(true);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gs-deep-pine text-txt-inverse flex flex-col" role="navigation" aria-label="Main navigation">
        <div className="p-6 border-b border-gs-pine">
          <h1 className="text-xl font-bold text-brand-400">CannaSaas</h1>
          <p className="text-xs text-txt-muted mt-1">Admin Portal</p>
        </div>

        <nav className="flex-1 py-4" aria-label="Admin navigation">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
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
              {label === "What's New" && hasNewChangelog && (
                <span className="ml-auto w-2 h-2 bg-brand-500 rounded-full" />
              )}
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
