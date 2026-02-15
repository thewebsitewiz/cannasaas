import {
  AlertTriangle,
  Building2,
  DollarSign,
  Package,
  ShoppingCart,
  Store,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardStats {
  companies: number;
  dispensaries: number;
  products: number;
  users: number;
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number | string;
  icon: any;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div
          className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    companies: 0,
    dispensaries: 0,
    products: 0,
    users: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch stats from API endpoints
    // For now, fetch counts from each entity
    Promise.allSettled([
      api.get('/companies').then((r) => r.data),
      api.get('/dispensaries').then((r) => r.data),
      api.get('/products').then((r) => r.data),
    ])
      .then(([companies, dispensaries, products]) => {
        setStats({
          companies:
            companies.status === 'fulfilled'
              ? Array.isArray(companies.value)
                ? companies.value.length
                : 0
              : 0,
          dispensaries:
            dispensaries.status === 'fulfilled'
              ? Array.isArray(dispensaries.value)
                ? dispensaries.value.length
                : 0
              : 0,
          products:
            products.status === 'fulfilled'
              ? Array.isArray(products.value)
                ? products.value.length
                : 0
              : 0,
          users: 0, // No public user count endpoint yet
        });
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.firstName || 'Admin'}
        </h1>
        <p className="text-gray-500 mt-1">
          Here's what's happening across your organization today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          label="Companies"
          value={loading ? '...' : stats.companies}
          icon={Building2}
          color="bg-blue-500"
        />
        <StatCard
          label="Dispensaries"
          value={loading ? '...' : stats.dispensaries}
          icon={Store}
          color="bg-green-500"
        />
        <StatCard
          label="Products"
          value={loading ? '...' : stats.products}
          icon={Package}
          color="bg-purple-500"
        />
        <StatCard
          label="Users"
          value={loading ? '...' : stats.users}
          icon={Users}
          color="bg-orange-500"
        />
      </div>

      {/* Quick Actions + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="space-y-3">
            <QuickAction
              label="Add New Product"
              description="Create a new product listing"
              href="/products"
              icon={Package}
            />
            <QuickAction
              label="View Orders"
              description="Check recent order activity"
              href="/orders"
              icon={ShoppingCart}
            />
            <QuickAction
              label="Compliance Check"
              description="Review compliance status"
              href="/compliance"
              icon={AlertTriangle}
            />
            <QuickAction
              label="Manage Dispensaries"
              description="Edit dispensary details and hours"
              href="/dispensaries"
              icon={Store}
            />
          </div>
        </div>

        {/* Recent Activity (placeholder) */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </h2>
          <div className="space-y-4">
            <ActivityItem
              message="System initialized with seed data"
              time="Just now"
              type="info"
            />
            <ActivityItem
              message="4 organizations configured"
              time="Just now"
              type="success"
            />
            <ActivityItem
              message="43 dispensaries ready to operate"
              time="Just now"
              type="success"
            />
            <ActivityItem
              message="AWS file uploads disabled (no credentials)"
              time="Startup"
              type="warning"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  label,
  description,
  href,
  icon: Icon,
}: {
  label: string;
  description: string;
  href: string;
  icon: any;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
    >
      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-green-50">
        <Icon className="w-5 h-5 text-gray-500 group-hover:text-green-600" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </a>
  );
}

function ActivityItem({
  message,
  time,
  type,
}: {
  message: string;
  time: string;
  type: 'info' | 'success' | 'warning';
}) {
  const colors = {
    info: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-2 h-2 rounded-full ${type === 'success' ? 'bg-green-500' : type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'}`}
      />
      <div className="flex-1">
        <p className="text-sm text-gray-700">{message}</p>
      </div>
      <span className="text-xs text-gray-400">{time}</span>
    </div>
  );
}
