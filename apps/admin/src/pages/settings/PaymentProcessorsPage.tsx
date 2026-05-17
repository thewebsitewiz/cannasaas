import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Loader2, ShieldCheck, X } from 'lucide-react';

import { gqlRequest } from '../../lib/graphql-client';
import { useAuthStore } from '../../stores/auth.store';

type ProcessorName = 'aeropay' | 'canpay';

interface ProcessorRow {
  id: string;
  dispensaryId: string;
  processorName: ProcessorName;
  isEnabled: boolean;
  isSandbox: boolean;
  merchantExternalId: string | null;
  provisionedAt: string | null;
}

interface ActiveResult {
  activePaymentProcessor: ProcessorName | null;
}

const LIST_QUERY = `
  query($id: ID!) {
    dispensaryPaymentProcessors(dispensaryId: $id) {
      id dispensaryId processorName isEnabled isSandbox
      merchantExternalId provisionedAt
    }
    activeDispensaryProcessor(dispensaryId: $id) {
      activePaymentProcessor
    }
  }
`;

const SET_ENABLED = `
  mutation($input: SetDispensaryProcessorEnabledInput!) {
    setDispensaryProcessorEnabled(input: $input) {
      id processorName isEnabled isSandbox
    }
  }
`;

const SET_ACTIVE = `
  mutation($input: SetActiveDispensaryProcessorInput!) {
    setActiveDispensaryProcessor(input: $input) {
      activePaymentProcessor
    }
  }
`;

const PROVISION_AEROPAY = `
  mutation($input: ProvisionAeropayInput!) {
    provisionAeropayForDispensary(input: $input) {
      id processorName isEnabled merchantExternalId provisionedAt
    }
  }
`;

const PROVISION_CANPAY = `
  mutation($input: ProvisionCanPayInput!) {
    provisionCanPayForDispensary(input: $input) {
      id processorName isEnabled merchantExternalId provisionedAt
    }
  }
`;

const DEPROVISION_AEROPAY = `
  mutation($id: ID!) { deprovisionAeropayForDispensary(dispensaryId: $id) }
`;

const DEPROVISION_CANPAY = `
  mutation($id: ID!) { deprovisionCanPayForDispensary(dispensaryId: $id) }
`;

const PROCESSORS: ReadonlyArray<{
  name: ProcessorName;
  label: string;
  description: string;
}> = [
  {
    name: 'aeropay',
    label: 'Aeropay',
    description: 'Pay-by-bank. Customer is redirected to Aeropay to authorize.',
  },
  {
    name: 'canpay',
    label: 'CanPay',
    description:
      'Customer scans a QR code in the CanPay mobile app to authorize.',
  },
];

export function PaymentProcessorsPage() {
  const dispensaryId = useAuthStore((s) => s.user?.dispensaryId);
  const queryClient = useQueryClient();
  const [provisioning, setProvisioning] = useState<ProcessorName | null>(null);
  const [form, setForm] = useState({
    merchantId: '',
    apiKey: '',
    sandbox: true,
  });
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['processors', dispensaryId],
    queryFn: () =>
      gqlRequest<{
        dispensaryPaymentProcessors: ProcessorRow[];
        activeDispensaryProcessor: ActiveResult;
      }>(LIST_QUERY, { id: dispensaryId }),
    enabled: !!dispensaryId,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['processors'] });
  };

  const setEnabled = useMutation({
    mutationFn: (vars: {
      processorName: ProcessorName;
      isEnabled: boolean;
      isSandbox?: boolean;
    }) =>
      gqlRequest(SET_ENABLED, {
        input: { dispensaryId, ...vars },
      }),
    onSuccess: invalidate,
    onError: (err: Error) => setError(err.message),
  });

  const setActive = useMutation({
    mutationFn: (processorName: ProcessorName | null) =>
      gqlRequest(SET_ACTIVE, {
        input: { dispensaryId, processorName },
      }),
    onSuccess: invalidate,
    onError: (err: Error) => setError(err.message),
  });

  const provisionAeropay = useMutation({
    mutationFn: (vars: {
      merchantId: string;
      apiKey: string;
      sandbox: boolean;
    }) =>
      gqlRequest(PROVISION_AEROPAY, {
        input: {
          dispensaryId,
          merchantId: vars.merchantId,
          apiKey: vars.apiKey,
          isSandbox: vars.sandbox,
        },
      }),
    onSuccess: () => {
      setProvisioning(null);
      setForm({ merchantId: '', apiKey: '', sandbox: true });
      invalidate();
    },
    onError: (err: Error) => setError(err.message),
  });

  const provisionCanPay = useMutation({
    mutationFn: (vars: {
      merchantId: string;
      apiKey: string;
      sandbox: boolean;
    }) =>
      gqlRequest(PROVISION_CANPAY, {
        input: {
          dispensaryId,
          merchantId: vars.merchantId,
          apiKey: vars.apiKey,
          isSandbox: vars.sandbox,
        },
      }),
    onSuccess: () => {
      setProvisioning(null);
      setForm({ merchantId: '', apiKey: '', sandbox: true });
      invalidate();
    },
    onError: (err: Error) => setError(err.message),
  });

  const deprovision = useMutation({
    mutationFn: (processorName: ProcessorName) =>
      gqlRequest(
        processorName === 'aeropay' ? DEPROVISION_AEROPAY : DEPROVISION_CANPAY,
        { id: dispensaryId },
      ),
    onSuccess: invalidate,
    onError: (err: Error) => setError(err.message),
  });

  if (!dispensaryId) {
    return (
      <p className="text-sm text-txt-muted">No dispensary scope resolved.</p>
    );
  }

  if (isLoading) {
    return (
      <p className="flex items-center gap-2 text-sm text-txt-muted">
        <Loader2 size={16} className="animate-spin" /> Loading processor config…
      </p>
    );
  }

  const rows = data?.dispensaryPaymentProcessors ?? [];
  const active =
    data?.activeDispensaryProcessor?.activePaymentProcessor ?? null;

  function rowFor(name: ProcessorName): ProcessorRow | undefined {
    return rows.find((r) => r.processorName === name);
  }

  function submitProvision(name: ProcessorName) {
    setError(null);
    const mut = name === 'aeropay' ? provisionAeropay : provisionCanPay;
    mut.mutate({
      merchantId: form.merchantId,
      apiKey: form.apiKey,
      sandbox: form.sandbox,
    });
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-txt">Payment Processors</h1>
        <p className="mt-1 text-sm text-txt-muted">
          Enable and provision the ACH-based processors your dispensary accepts.
          One processor may be marked as the default — non-cash orders use it
          unless explicitly overridden.
        </p>
      </header>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="space-y-4">
        {PROCESSORS.map((p) => {
          const row = rowFor(p.name);
          const isProvisioned = !!row?.merchantExternalId;
          const isActive = active === p.name;
          const isFormOpen = provisioning === p.name;

          return (
            <section
              key={p.name}
              className="rounded-xl border border-bdr bg-surface p-5"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <CreditCard size={18} className="text-brand-600" />
                    <h2 className="text-lg font-semibold text-txt">
                      {p.label}
                    </h2>
                    {isActive && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                        Active default
                      </span>
                    )}
                    {row?.isSandbox && row.isEnabled && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                        Sandbox
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-txt-muted">{p.description}</p>
                </div>
                <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-border-strong text-brand-600 focus:ring-brand-500"
                    checked={row?.isEnabled ?? false}
                    onChange={(e) =>
                      setEnabled.mutate({
                        processorName: p.name,
                        isEnabled: e.target.checked,
                      })
                    }
                  />
                  Enabled
                </label>
              </div>

              {row?.isEnabled && (
                <div className="space-y-3 border-t border-bdr pt-3">
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-border-strong text-brand-600 focus:ring-brand-500"
                        checked={row.isSandbox}
                        onChange={(e) =>
                          setEnabled.mutate({
                            processorName: p.name,
                            isEnabled: true,
                            isSandbox: e.target.checked,
                          })
                        }
                      />
                      Sandbox mode
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="active-processor"
                        className="h-4 w-4 border-border-strong text-brand-600 focus:ring-brand-500"
                        checked={isActive}
                        onChange={() => setActive.mutate(p.name)}
                      />
                      Use as default
                    </label>
                    {isActive && (
                      <button
                        type="button"
                        className="text-xs text-txt-muted underline"
                        onClick={() => setActive.mutate(null)}
                      >
                        Clear default
                      </button>
                    )}
                  </div>

                  {isProvisioned ? (
                    <div className="flex items-center justify-between rounded-md bg-emerald-50 px-3 py-2 text-sm">
                      <span className="flex items-center gap-2 text-emerald-700">
                        <ShieldCheck size={14} />
                        Provisioned · merchant
                        <code className="rounded bg-white/60 px-1.5 py-0.5 text-xs">
                          {row.merchantExternalId}
                        </code>
                      </span>
                      <button
                        type="button"
                        className="text-xs text-rose-700 underline"
                        onClick={() => deprovision.mutate(p.name)}
                      >
                        Deprovision
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-txt-muted">
                      Not provisioned — credentials required before this
                      processor can accept payments.
                    </p>
                  )}

                  {isFormOpen ? (
                    <form
                      className="space-y-2 rounded-md border border-bdr bg-bg p-3"
                      onSubmit={(e) => {
                        e.preventDefault();
                        submitProvision(p.name);
                      }}
                    >
                      <label className="block text-xs font-medium">
                        Merchant ID
                        <input
                          type="text"
                          required
                          className="mt-1 block w-full rounded-md border border-bdr bg-surface px-2 py-1.5 text-sm"
                          value={form.merchantId}
                          onChange={(e) =>
                            setForm({ ...form, merchantId: e.target.value })
                          }
                        />
                      </label>
                      <label className="block text-xs font-medium">
                        API Key
                        <input
                          type="password"
                          required
                          className="mt-1 block w-full rounded-md border border-bdr bg-surface px-2 py-1.5 text-sm font-mono"
                          value={form.apiKey}
                          onChange={(e) =>
                            setForm({ ...form, apiKey: e.target.value })
                          }
                        />
                      </label>
                      <label className="flex cursor-pointer items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={form.sandbox}
                          onChange={(e) =>
                            setForm({ ...form, sandbox: e.target.checked })
                          }
                        />
                        Sandbox (uncheck for production)
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="submit"
                          className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-semibold text-txt-inverse hover:bg-brand-700 disabled:opacity-50"
                          disabled={
                            provisionAeropay.isPending ||
                            provisionCanPay.isPending
                          }
                        >
                          {provisionAeropay.isPending ||
                          provisionCanPay.isPending
                            ? 'Provisioning…'
                            : 'Save credentials'}
                        </button>
                        <button
                          type="button"
                          className="rounded-md border border-bdr px-3 py-1.5 text-xs"
                          onClick={() => setProvisioning(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      type="button"
                      className="rounded-md border border-bdr px-3 py-1.5 text-xs"
                      onClick={() => {
                        setProvisioning(p.name);
                        setForm({ merchantId: '', apiKey: '', sandbox: true });
                      }}
                    >
                      {isProvisioned
                        ? 'Rotate credentials'
                        : 'Provision credentials'}
                    </button>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
