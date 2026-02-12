import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, ArrowRight, ArrowLeft } from 'lucide-react';

const STEPS = [
  { key: 'business_info', label: 'Business Info' },
  { key: 'branding', label: 'Branding' },
  { key: 'locations', label: 'Locations' },
  { key: 'payment_processing', label: 'Payments' },
  { key: 'first_products', label: 'Products' },
  { key: 'staff_invite', label: 'Staff' },
  { key: 'compliance', label: 'Compliance' },
  { key: 'review_launch', label: 'Launch' },
];

export function OnboardingWizard() {
  const [idx, setIdx] = useState(0);

  const { data: status, refetch } = useQuery({
    queryKey: ['onboarding-status'],
    queryFn: () => apiClient.get('/onboarding/status').then((r) => r.data),
  });

  const submit = useMutation({
    mutationFn: ({ step, data }: { step: string; data: any }) =>
      apiClient.post(`/onboarding/steps/${step}`, data),
    onSuccess: () => {
      refetch();
      if (idx < STEPS.length - 1) setIdx((i) => i + 1);
    },
  });

  useEffect(() => {
    if (status?.currentStep) {
      const i = STEPS.findIndex((s) => s.key === status.currentStep);
      if (i >= 0) setIdx(i);
    }
  }, [status]);

  const completed = status?.completedSteps || [];

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold">Set Up Your Store</h1>
        <Progress value={status?.progress || 0} className="mt-4" />
      </div>

      {/* Step indicators */}
      <div className="flex justify-between">
        {STEPS.map((step, i) => (
          <button
            key={step.key}
            onClick={() => setIdx(i)}
            className={`flex flex-col items-center gap-1 text-xs
              ${i === idx ? 'text-green-700 font-bold' : 'text-gray-400'}`}
          >
            {completed.includes(step.key) ? (
              <CheckCircle className="h-6 w-6 text-green-500" />
            ) : (
              <Circle className="h-6 w-6" />
            )}
            {step.label}
          </button>
        ))}
      </div>

      {/* Current step form renders here via dynamic component */}
      <div className="rounded-lg border p-6">
        <p className="text-sm text-muted">
          Step {idx + 1} of {STEPS.length}
        </p>
      </div>

      <div className="flex justify-between">
        <Button
         `` variant="outline"
          disabled={idx === 0}
          onClick={() => setIdx((i) => i - 1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Previous
        </Button>
        <Button variant="outline" onClick={() => setIdx((i) => i + 1)}>
          Skip <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}