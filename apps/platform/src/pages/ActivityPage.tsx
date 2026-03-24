import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { gql } from '../lib/api';
import { Activity, Filter } from 'lucide-react';

const Q = `query { platformActivity(limit: 50) { activity_id activity_type description org_name created_at } }`;

const TYPE_COLORS: Record<string, string> = {
  tenant_onboarded: 'bg-green-100 text-green-700 border-green-200',
  tenant_updated:   'bg-blue-100 text-blue-700 border-blue-200',
  tenant_suspended: 'bg-red-100 text-red-700 border-red-200',
  payment_received: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  payment_failed:   'bg-red-100 text-red-700 border-red-200',
  trial_started:    'bg-amber-100 text-amber-700 border-amber-200',
  trial_expired:    'bg-orange-100 text-orange-700 border-orange-200',
  tax_rule_added:   'bg-purple-100 text-purple-700 border-purple-200',
  tax_rule_updated: 'bg-purple-100 text-purple-700 border-purple-200',
  user_login:       'bg-gray-100 text-gray-700 border-gray-200',
  config_changed:   'bg-indigo-100 text-indigo-700 border-indigo-200',
};

const TIMELINE_COLORS: Record<string, string> = {
  tenant_onboarded: 'bg-green-500',
  tenant_updated:   'bg-blue-500',
  tenant_suspended: 'bg-red-500',
  payment_received: 'bg-emerald-500',
  payment_failed:   'bg-red-500',
  trial_started:    'bg-amber-500',
  trial_expired:    'bg-orange-500',
  tax_rule_added:   'bg-purple-500',
  tax_rule_updated: 'bg-purple-500',
  user_login:       'bg-gray-400',
  config_changed:   'bg-indigo-500',
};

export function ActivityPage() {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const { data: events, isLoading } = useQuery({
    queryKey: ['activity'],
    queryFn: () => gql<any>(Q),
    select: (r) => r.platformActivity,
    refetchInterval: 30_000,
  });

  const allEvents = events ?? [];
  const uniqueTypes = [...new Set(allEvents.map((e: any) => e.activity_type))].sort();
  const filtered = typeFilter === 'all' ? allEvents : allEvents.filter((e: any) => e.activity_type === typeFilter);

  // Group events by date
  const grouped: Record<string, any[]> = {};
  filtered.forEach((e: any) => {
    const dateKey = new Date(e.created_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(e);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Platform Activity</h1>
        <span className="text-xs text-slate-400">{allEvents.length} events</span>
      </div>

      {/* Type Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={14} className="text-slate-400" />
        <button
          onClick={() => setTypeFilter('all')}
          className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
            typeFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All ({allEvents.length})
        </button>
        {uniqueTypes.map((type: string) => {
          const count = allEvents.filter((e: any) => e.activity_type === type).length;
          return (
            <button
              key={type}
              onClick={() => setTypeFilter(typeFilter === type ? 'all' : type)}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                typeFilter === type
                  ? (TYPE_COLORS[type] || 'bg-gray-900 text-white')
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {type.replace(/_/g, ' ')} ({count})
            </button>
          );
        })}
      </div>

      {/* Timeline Feed */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
          Loading activity...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
          <Activity size={32} className="mx-auto mb-2 text-slate-300" />
          <p>No activity yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, dayEvents]) => (
            <div key={date}>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">{date}</p>
              <div className="bg-white rounded-xl border border-slate-200">
                {dayEvents.map((e: any, idx: number) => (
                  <div
                    key={e.activity_id}
                    className={`flex items-start gap-4 px-5 py-3.5 ${
                      idx < dayEvents.length - 1 ? 'border-b border-slate-50' : ''
                    }`}
                  >
                    {/* Timeline dot */}
                    <div className="flex flex-col items-center pt-1">
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${TIMELINE_COLORS[e.activity_type] || 'bg-gray-400'}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap border ${
                          TYPE_COLORS[e.activity_type] || 'bg-gray-100 text-gray-700 border-gray-200'
                        }`}>
                          {e.activity_type.replace(/_/g, ' ')}
                        </span>
                        {e.org_name && (
                          <span className="text-xs text-slate-500 font-medium">{e.org_name}</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-700">{e.description}</p>
                    </div>

                    {/* Timestamp */}
                    <span className="text-xs text-slate-400 whitespace-nowrap shrink-0 pt-0.5">
                      {new Date(e.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
