import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Package,
  ShieldCheck,
  CreditCard,
  Palette,
  Rocket,
  ChevronLeft,
  ChevronRight,
  Upload,
  Plus,
  Check,
} from 'lucide-react';
import { THEME_PRESETS } from '@cannasaas/ui';
import { gqlRequest } from '../lib/graphql-client';

const STEPS = [
  { label: 'Dispensary Info', icon: Building2 },
  { label: 'Products', icon: Package },
  { label: 'Compliance', icon: ShieldCheck },
  { label: 'Payments', icon: CreditCard },
  { label: 'Theme', icon: Palette },
  { label: 'Done', icon: Rocket },
];

const STORAGE_KEY = 'cannasaas_onboarding';

interface OnboardingData {
  // Step 1
  name: string;
  address: string;
  phone: string;
  hours: string;
  // Step 2
  products: { name: string; category: string; price: string }[];
  // Step 3
  state: string;
  licenseNumber: string;
  metrcKey: string;
  biotrackKey: string;
  // Step 4
  cashEnabled: boolean;
  stripeKey: string;
  canPayEnabled: boolean;
  // Step 5
  themePreset: string;
}

const DEFAULT_DATA: OnboardingData = {
  name: '',
  address: '',
  phone: '',
  hours: '',
  products: [],
  state: '',
  licenseNumber: '',
  metrcKey: '',
  biotrackKey: '',
  cashEnabled: true,
  stripeKey: '',
  canPayEnabled: false,
  themePreset: 'casual',
};

function loadSaved(): { step: number; data: OnboardingData } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { step: 0, data: { ...DEFAULT_DATA } };
}

function save(step: number, data: OnboardingData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, data }));
}

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
];

// ─── GraphQL mutations ───
const CREATE_DISPENSARY = `
  mutation CreateDispensary($input: CreateDispensaryInput!) {
    createDispensary(input: $input) { id name }
  }
`;

const SAVE_COMPLIANCE = `
  mutation SaveCompliance($input: SaveComplianceInput!) {
    saveCompliance(input: $input) { id }
  }
`;

const SAVE_PAYMENT_CONFIG = `
  mutation SavePaymentConfig($input: SavePaymentConfigInput!) {
    savePaymentConfig(input: $input) { id }
  }
`;

const SAVE_THEME = `
  mutation SaveThemeConfig($input: SaveThemeConfigInput!) {
    saveThemeConfig(input: $input) { id preset }
  }
`;

export function OnboardingPage() {
  const navigate = useNavigate();
  const saved = loadSaved();
  const [step, setStep] = useState(saved.step);
  const [data, setData] = useState<OnboardingData>(saved.data);
  const [launching, setLaunching] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', category: 'Flower', price: '' });

  useEffect(() => {
    save(step, data);
  }, [step, data]);

  const update = useCallback(
    <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => {
      setData((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const next = () => setStep((s) => Math.min(s + 1, 5));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.price) return;
    update('products', [...data.products, { ...newProduct }]);
    setNewProduct({ name: '', category: 'Flower', price: '' });
  };

  const handleLaunch = async () => {
    setLaunching(true);
    try {
      // Create dispensary
      const res = await gqlRequest<{ createDispensary: { id: string } }>(CREATE_DISPENSARY, {
        input: { name: data.name, address: data.address, phone: data.phone, operatingHours: data.hours },
      });
      const dispensaryId = res.createDispensary.id;

      // Save compliance
      await gqlRequest(SAVE_COMPLIANCE, {
        input: { dispensaryId, state: data.state, licenseNumber: data.licenseNumber, metrcApiKey: data.metrcKey, biotrackApiKey: data.biotrackKey },
      });

      // Save payment config
      await gqlRequest(SAVE_PAYMENT_CONFIG, {
        input: { dispensaryId, cashEnabled: data.cashEnabled, stripeSecretKey: data.stripeKey, canPayEnabled: data.canPayEnabled },
      });

      // Save theme
      await gqlRequest(SAVE_THEME, {
        input: { dispensaryId, preset: data.themePreset },
      });

      localStorage.removeItem(STORAGE_KEY);
      navigate('/');
    } catch (err) {
      console.error('[Onboarding] Launch failed:', err);
      alert('Setup failed. Check console for details.');
    } finally {
      setLaunching(false);
    }
  };

  const progressPct = ((step + 1) / 6) * 100;

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-txt">Setup Your Dispensary</h2>
            <span className="text-sm text-txt-secondary">Step {step + 1} of 6</span>
          </div>
          <div className="w-full bg-bg-alt rounded-full h-2">
            <div
              className="bg-brand-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className={`flex items-center gap-1 text-[10px] font-medium ${i <= step ? 'text-brand-500' : 'text-txt-muted'}`}>
                  <Icon size={12} />
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step content */}
        <div className="bg-surface rounded-xl border border-bdr p-6 mb-6">
          {step === 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-txt">Dispensary Info</h3>
              <p className="text-sm text-txt-secondary">Tell us about your dispensary.</p>
              <div>
                <label className="block text-sm font-medium text-txt mb-1">Dispensary Name</label>
                <input type="text" value={data.name} onChange={(e) => update('name', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-bdr bg-bg text-txt text-sm" placeholder="Green Leaf Dispensary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-txt mb-1">Address</label>
                <input type="text" value={data.address} onChange={(e) => update('address', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-bdr bg-bg text-txt text-sm" placeholder="123 Main St, Denver, CO 80202" />
              </div>
              <div>
                <label className="block text-sm font-medium text-txt mb-1">Phone</label>
                <input type="tel" value={data.phone} onChange={(e) => update('phone', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-bdr bg-bg text-txt text-sm" placeholder="(555) 123-4567" />
              </div>
              <div>
                <label className="block text-sm font-medium text-txt mb-1">Operating Hours</label>
                <input type="text" value={data.hours} onChange={(e) => update('hours', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-bdr bg-bg text-txt text-sm" placeholder="Mon-Sat 9am-9pm, Sun 10am-6pm" />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-txt">Products</h3>
              <p className="text-sm text-txt-secondary">Add your initial product catalog.</p>

              {/* CSV Upload */}
              <div className="border-2 border-dashed border-bdr rounded-lg p-6 text-center">
                <Upload size={24} className="mx-auto text-txt-muted mb-2" />
                <p className="text-sm text-txt-secondary mb-1">Import products via CSV</p>
                <label className="inline-block px-4 py-2 bg-brand-500 text-txt-inverse text-sm font-medium rounded-lg cursor-pointer hover:bg-brand-600 transition-colors">
                  Choose File
                  <input type="file" accept=".csv" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) console.log('[Onboarding] CSV selected:', file.name);
                  }} />
                </label>
              </div>

              <div className="text-center text-xs text-txt-muted">or add manually</div>

              {/* Manual add */}
              <div className="flex gap-2">
                <input type="text" placeholder="Product name" value={newProduct.name}
                  onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))}
                  className="flex-1 px-3 py-2 rounded-lg border border-bdr bg-bg text-txt text-sm" />
                <select value={newProduct.category}
                  onChange={(e) => setNewProduct((p) => ({ ...p, category: e.target.value }))}
                  className="px-3 py-2 rounded-lg border border-bdr bg-bg text-txt text-sm">
                  <option>Flower</option>
                  <option>Edible</option>
                  <option>Concentrate</option>
                  <option>Pre-Roll</option>
                  <option>Topical</option>
                  <option>Accessory</option>
                </select>
                <input type="text" placeholder="Price" value={newProduct.price}
                  onChange={(e) => setNewProduct((p) => ({ ...p, price: e.target.value }))}
                  className="w-24 px-3 py-2 rounded-lg border border-bdr bg-bg text-txt text-sm" />
                <button onClick={handleAddProduct}
                  className="px-3 py-2 bg-brand-500 text-txt-inverse rounded-lg hover:bg-brand-600 transition-colors">
                  <Plus size={16} />
                </button>
              </div>

              {data.products.length > 0 && (
                <div className="space-y-1">
                  {data.products.map((p, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 bg-bg-alt rounded-lg text-sm">
                      <span className="text-txt font-medium">{p.name}</span>
                      <span className="text-txt-secondary">{p.category} &mdash; ${p.price}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-txt">Compliance</h3>
              <p className="text-sm text-txt-secondary">Configure state compliance and tracking integrations.</p>
              <div>
                <label className="block text-sm font-medium text-txt mb-1">State</label>
                <select value={data.state} onChange={(e) => update('state', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-bdr bg-bg text-txt text-sm">
                  <option value="">Select state...</option>
                  {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-txt mb-1">License Number</label>
                <input type="text" value={data.licenseNumber} onChange={(e) => update('licenseNumber', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-bdr bg-bg text-txt text-sm" placeholder="403R-00123" />
              </div>
              <div>
                <label className="block text-sm font-medium text-txt mb-1">Metrc API Key (optional)</label>
                <input type="text" value={data.metrcKey} onChange={(e) => update('metrcKey', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-bdr bg-bg text-txt text-sm" placeholder="Enter Metrc API key" />
              </div>
              <div>
                <label className="block text-sm font-medium text-txt mb-1">BioTrack API Key (optional)</label>
                <input type="text" value={data.biotrackKey} onChange={(e) => update('biotrackKey', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-bdr bg-bg text-txt text-sm" placeholder="Enter BioTrack API key" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-txt">Payments</h3>
              <p className="text-sm text-txt-secondary">Enable payment methods for your store.</p>

              <div className="flex items-center justify-between p-4 bg-bg-alt rounded-lg">
                <div>
                  <div className="text-sm font-medium text-txt">Cash Payments</div>
                  <div className="text-xs text-txt-secondary">Accept cash at pickup</div>
                </div>
                <button onClick={() => update('cashEnabled', !data.cashEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors ${data.cashEnabled ? 'bg-brand-500' : 'bg-bg'} border border-bdr relative`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-transform ${data.cashEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>

              <div className="p-4 bg-bg-alt rounded-lg space-y-3">
                <div className="text-sm font-medium text-txt">Stripe Integration</div>
                <input type="text" value={data.stripeKey} onChange={(e) => update('stripeKey', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-bdr bg-bg text-txt text-sm" placeholder="sk_live_..." />
              </div>

              <div className="flex items-center justify-between p-4 bg-bg-alt rounded-lg">
                <div>
                  <div className="text-sm font-medium text-txt">CanPay</div>
                  <div className="text-xs text-txt-secondary">Cannabis-specific debit payments</div>
                </div>
                <button onClick={() => update('canPayEnabled', !data.canPayEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors ${data.canPayEnabled ? 'bg-brand-500' : 'bg-bg'} border border-bdr relative`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-transform ${data.canPayEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-txt">Choose a Theme</h3>
              <p className="text-sm text-txt-secondary">Select a visual style for your storefront.</p>
              <div className="grid grid-cols-2 gap-3">
                {Object.values(THEME_PRESETS).map((p) => {
                  const isSelected = data.themePreset === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => update('themePreset', p.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                        isSelected ? 'border-brand-500 ring-2 ring-brand-500/30 bg-surface-alt' : 'border-bdr hover:bg-bg-alt'
                      }`}
                    >
                      <div className="flex gap-0.5 shrink-0">
                        {p.swatches.map((c: string, i: number) => (
                          <div key={i} className="w-5 h-5 rounded" style={{ background: c, border: '1px solid rgba(0,0,0,0.08)' }} />
                        ))}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-txt flex items-center gap-1">
                          {p.label}
                          {isSelected && <Check size={14} className="text-brand-500" />}
                        </div>
                        <div className="text-[11px] text-txt-secondary truncate">{p.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="text-center space-y-6 py-4">
              <Rocket size={48} className="mx-auto text-brand-500" />
              <h3 className="text-2xl font-bold text-txt">You're All Set!</h3>
              <p className="text-sm text-txt-secondary max-w-md mx-auto">
                Review your setup below and launch your dispensary when ready.
              </p>

              <div className="text-left bg-bg-alt rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-txt-secondary">Dispensary</span><span className="text-txt font-medium">{data.name || '(not set)'}</span></div>
                <div className="flex justify-between"><span className="text-txt-secondary">Address</span><span className="text-txt font-medium">{data.address || '(not set)'}</span></div>
                <div className="flex justify-between"><span className="text-txt-secondary">Phone</span><span className="text-txt font-medium">{data.phone || '(not set)'}</span></div>
                <div className="flex justify-between"><span className="text-txt-secondary">Products</span><span className="text-txt font-medium">{data.products.length} added</span></div>
                <div className="flex justify-between"><span className="text-txt-secondary">State</span><span className="text-txt font-medium">{data.state || '(not set)'}</span></div>
                <div className="flex justify-between"><span className="text-txt-secondary">License</span><span className="text-txt font-medium">{data.licenseNumber || '(not set)'}</span></div>
                <div className="flex justify-between"><span className="text-txt-secondary">Payments</span><span className="text-txt font-medium">
                  {[data.cashEnabled && 'Cash', data.stripeKey && 'Stripe', data.canPayEnabled && 'CanPay'].filter(Boolean).join(', ') || 'None'}
                </span></div>
                <div className="flex justify-between"><span className="text-txt-secondary">Theme</span><span className="text-txt font-medium capitalize">{data.themePreset}</span></div>
              </div>

              <button
                onClick={handleLaunch}
                disabled={launching}
                className="px-8 py-3 bg-brand-500 text-txt-inverse font-bold rounded-xl hover:bg-brand-600 transition-colors text-lg"
              >
                {launching ? 'Launching...' : 'Launch Your Store'}
              </button>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        {step < 5 && (
          <div className="flex justify-between">
            <button
              onClick={back}
              disabled={step === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-txt-secondary hover:text-txt disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} /> Back
            </button>
            <button
              onClick={next}
              className="flex items-center gap-2 px-6 py-2 bg-brand-500 text-txt-inverse text-sm font-bold rounded-lg hover:bg-brand-600 transition-colors"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
        {step === 5 && (
          <div className="flex justify-start">
            <button
              onClick={back}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-txt-secondary hover:text-txt transition-colors"
            >
              <ChevronLeft size={16} /> Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
