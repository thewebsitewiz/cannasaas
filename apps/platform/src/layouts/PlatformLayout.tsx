import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Building2, CreditCard, Calculator, BarChart3, Activity, LogOut, Shield } from 'lucide-react';
import { useEffect } from 'react';
import { getUser, logout } from '../lib/api';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/tenants', label: 'Tenants', icon: Building2 },
  { to: '/billing', label: 'Billing', icon: CreditCard },
  { to: '/tax', label: 'Tax Config', icon: Calculator },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/activity', label: 'Activity', icon: Activity },
];

export function PlatformLayout() {
  const navigate = useNavigate();
  const user = getUser();

  useEffect(() => { if (!user) navigate('/login'); }, [user, navigate]);

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-56 bg-slate-900 text-white flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-brand-400" />
            <span className="font-bold text-sm">Platform Manager</span>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) => 'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ' +
                (isActive ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800')}>
              <Icon size={16} /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-700">
          <button onClick={() => { logout(); navigate('/login'); }}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white w-full px-3 py-2">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-y-auto"><Outlet /></main>
    </div>
  );
}
