// cannasaas-admin/src/components/beta/BetaFeedbackWidget.tsx
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { MessageSquarePlus, Bug, Lightbulb, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api/client';

const TYPES = [
  { value: 'bug', label: 'Bug', icon: Bug, color: 'text-red-500' },
  { value: 'feature_request', label: 'Feature', icon: Lightbulb, color: 'text-yellow-500' },
  { value: 'usability', label: 'UX', icon: Star, color: 'text-blue-500' },
  { value: 'general', label: 'General', icon: MessageSquarePlus, color: 'text-gray-500' },
];

export function BetaFeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('bug');
  const [severity, setSeverity] = useState('medium');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');

  const submit = useMutation({
    mutationFn: (data: any) => apiClient.post('/beta/feedback', data),
    onSuccess: () => { setOpen(false); setTitle(''); setDesc(''); },
  });

  return (
    <>
      <button onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 rounded-full bg-green-700
          p-4 text-white shadow-lg hover:bg-green-800 transition">
        <MessageSquarePlus className="h-6 w-6" />
      </button>

      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-96 rounded-lg
          border bg-white p-6 shadow-xl">
          <h3 className="font-semibold mb-4">Send Beta Feedback</h3>

          <div className="grid grid-cols-4 gap-2 mb-4">
            {TYPES.map(t => (
              <button key={t.value} onClick={() => setType(t.value)}
                className={`flex flex-col items-center gap-1 rounded-lg
                  border p-2 text-xs ${type === t.value
                  ? 'border-green-600 bg-green-50' : ''}`}>
                <t.icon className={`h-5 w-5 ${t.color}`} />
                {t.label}
              </button>
            ))}
          </div>

          {type === 'bug' && (
            <select value={severity} onChange={e => setSeverity(e.target.value)}
              className="w-full mb-3 rounded border p-2 text-sm">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          )}

          <Input placeholder="Title" value={title}
            onChange={e => setTitle(e.target.value)} className="mb-3" />
          <Textarea placeholder="Describe..." value={desc}
            onChange={e => setDesc(e.target.value)} rows={3} className="mb-4" />

          <Button className="w-full" disabled={!title || !desc}
            onClick={() => submit.mutate({
              type, severity, title, description: desc,
              metadata: { url: window.location.href,
                userAgent: navigator.userAgent },
            })}>
            {submit.isPending ? 'Sending...' : 'Submit'}
          </Button>
        </div>
      )}
    </>
  );
}
