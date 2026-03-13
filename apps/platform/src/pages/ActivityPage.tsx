import { useQuery } from '@tanstack/react-query';
import { gql } from '../lib/api';
import { Activity } from 'lucide-react';

const Q = `query { platformActivity(limit: 50) { activity_id activity_type description org_name created_at } }`;

const TYPE_COLORS: Record<string,string> = {
  tenant_onboarded: 'bg-green-100 text-green-700', tenant_updated: 'bg-blue-100 text-blue-700',
  tenant_suspended: 'bg-red-100 text-red-700', payment_received: 'bg-emerald-100 text-emerald-700',
  trial_started: 'bg-amber-100 text-amber-700', tax_rule_added: 'bg-purple-100 text-purple-700',
};

export function ActivityPage() {
  const { data: events } = useQuery({ queryKey: ['activity'], queryFn: () => gql<any>(Q), select: r => r.platformActivity });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Platform Activity</h1>
      <div className="bg-white rounded-xl border border-slate-200">
        {(events ?? []).map((e: any) => (
          <div key={e.activity_id} className="flex items-center gap-4 px-4 py-3 border-b border-slate-50 last:border-0">
            <span className={'text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap ' + (TYPE_COLORS[e.activity_type] || 'bg-gray-100 text-gray-700')}>{e.activity_type.replace(/_/g, ' ')}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-700 truncate">{e.description}</p>
              {e.org_name && <p className="text-xs text-slate-400">{e.org_name}</p>}
            </div>
            <span className="text-xs text-slate-400 whitespace-nowrap">{new Date(e.created_at).toLocaleString()}</span>
          </div>
        ))}
        {(!events || events.length === 0) && <div className="p-8 text-center text-slate-400">No activity yet</div>}
      </div>
    </div>
  );
}
