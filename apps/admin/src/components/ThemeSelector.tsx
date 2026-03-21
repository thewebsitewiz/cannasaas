import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gqlRequest } from '../lib/graphql-client';
import { Palette, Check } from 'lucide-react';

const THEMES_Q = `query { themes { themeId code name description } }`;
const CURRENT_Q = `query($id: ID!) { dispensaryTheme(dispensaryId: $id) { themeCode } }`;
const SET_THEME = `mutation($id: ID!, $code: String!) { setDispensaryTheme(dispensaryId: $id, themeCode: $code) { themeCode } }`;

const DISP = localStorage.getItem('cannasaas-dispensary-id') || 'b406186e-4d6a-425b-b7af-851cde868c5c';

const PREVIEWS: Record<string, { bg: string; accent: string; text: string }> = {
  default: { bg:'#fff', accent:'#16a34a', text:'#111827' }, dark: { bg:'#0f172a', accent:'#10b981', text:'#f1f5f9' },
  earth: { bg:'#fefcf8', accent:'#8b5a2b', text:'#3d2710' }, purple: { bg:'#fff', accent:'#9333ea', text:'#1e1033' },
  minimal: { bg:'#fff', accent:'#525252', text:'#171717' }, luxury: { bg:'#0a0a0a', accent:'#f59e0b', text:'#fafafa' },
  ocean: { bg:'#fff', accent:'#0891b2', text:'#164e63' }, sunset: { bg:'#fffbf5', accent:'#ea580c', text:'#431407' },
  forest: { bg:'#1a2e1a', accent:'#22c55e', text:'#e8f5e8' }, neon: { bg:'#0a0a0a', accent:'#4ade80', text:'#4ade80' },
};

export function ThemeSelector() {
  const qc = useQueryClient();
  const { data: themes } = useQuery({ queryKey: ['themes'], queryFn: () => gqlRequest<any>(THEMES_Q), select: d => d.themes });
  const { data: current } = useQuery({ queryKey: ['currentTheme'], queryFn: () => gqlRequest<any>(CURRENT_Q, { id: DISP }), select: d => d.dispensaryTheme });
  const setTheme = useMutation({ mutationFn: (code: string) => gqlRequest(SET_THEME, { id: DISP, code }), onSuccess: () => qc.invalidateQueries({ queryKey: ['currentTheme'] }) });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Palette size={20} className="text-brand-600" />
        <h2 className="text-lg font-semibold text-txt">Storefront Theme</h2>
        {current && <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">Current: {current.themeCode}</span>}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {(themes ?? []).map((theme: any) => {
          const p = PREVIEWS[theme.code] ?? PREVIEWS.default;
          const isActive = current?.themeCode === theme.code;
          return (
            <button key={theme.code} onClick={() => setTheme.mutate(theme.code)}
              className={'relative rounded-xl border-2 overflow-hidden transition-all ' + (isActive ? 'border-brand-600 ring-2 ring-brand-200' : 'border-border hover:border-border-strong')}>
              <div className="aspect-[4/3] p-3" style={{ backgroundColor: p.bg }}>
                <div className="h-2 rounded-full mb-2" style={{ backgroundColor: p.accent, width: '40%' }} />
                <div className="space-y-1.5"><div className="h-1.5 rounded-full" style={{ backgroundColor: p.text, opacity: 0.3, width: '80%' }} /><div className="h-1.5 rounded-full" style={{ backgroundColor: p.text, opacity: 0.2, width: '60%' }} /></div>
                <div className="flex gap-1.5 mt-2">{[1,2,3].map(i => <div key={i} className="flex-1 h-6 rounded" style={{ backgroundColor: p.accent, opacity: 0.15 }} />)}</div>
              </div>
              <div className="px-2 py-2 text-center bg-surface border-t border-border"><p className="text-xs font-semibold text-txt truncate">{theme.name}</p></div>
              {isActive && <div className="absolute top-2 right-2 w-5 h-5 bg-brand-600 rounded-full flex items-center justify-center"><Check size={12} className="text-txt-inverse" /></div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
