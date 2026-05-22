import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TaxManagementPage } from './tax-management-page';
import { TaxRulesService, type TaxRule } from './tax-rules.service';

interface FakeArgs {
  readonly rules?: readonly TaxRule[];
  readonly loading?: boolean;
  readonly error?: unknown;
  readonly saving?: boolean;
  readonly add?: ReturnType<typeof vi.fn>;
  readonly update?: ReturnType<typeof vi.fn>;
}

function makeSvc(args: FakeArgs): TaxRulesService {
  return {
    rules: signal<readonly TaxRule[]>(args.rules ?? []).asReadonly(),
    isLoading: signal<boolean>(args.loading ?? false).asReadonly(),
    error: signal<unknown>(args.error ?? null).asReadonly(),
    saving: signal<boolean>(args.saving ?? false).asReadonly(),
    add: args.add ?? vi.fn().mockResolvedValue(undefined),
    update: args.update ?? vi.fn().mockResolvedValue(undefined),
  } as unknown as TaxRulesService;
}

function configure(args: FakeArgs = {}) {
  const svc = makeSvc(args);
  TestBed.configureTestingModule({
    imports: [TaxManagementPage],
    providers: [{ provide: TaxRulesService, useValue: svc }],
  });
  const f = TestBed.createComponent(TaxManagementPage);
  f.detectChanges();
  return { fixture: f, svc };
}

function rule(overrides: Partial<TaxRule> = {}): TaxRule {
  return {
    __typename: 'TaxRule',
    tax_category_id: 1,
    state: 'NY',
    code: 'NY_RETAIL',
    name: 'NY Retail Cannabis Excise',
    rate: 0.09,
    tax_basis: 'retail_price',
    statutory_reference: null,
    is_active: true,
    ...overrides,
  } as TaxRule;
}

describe('TaxManagementPage', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('renders loading state', () => {
    const { fixture } = configure({ loading: true });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Loading tax rules…');
  });

  it('renders error banner', () => {
    const { fixture } = configure({ error: new Error('boom') });
    const alert = (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('Failed to load tax rules');
    expect(alert?.textContent).toContain('boom');
  });

  it('renders empty state when no rules', () => {
    const { fixture } = configure({ rules: [] });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No tax rules found');
  });

  it('groups rules by state and renders formatted rates', () => {
    const { fixture } = configure({
      rules: [
        rule({ tax_category_id: 1, state: 'NY', code: 'NY_RETAIL', rate: 0.09 }),
        rule({
          tax_category_id: 2,
          state: 'NY',
          code: 'NY_THC',
          rate: 0.005,
          tax_basis: 'per_mg_thc',
        }),
        rule({ tax_category_id: 3, state: 'NJ', code: 'NJ_RETAIL', rate: 0.0625 }),
      ],
    });
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('NY');
    expect(text).toContain('NJ');
    expect(text).toContain('9%');
    expect(text).toContain('$0.005/mg');
    expect(text).toContain('6.250%');
  });

  it('header counts rules + unique states', () => {
    const { fixture } = configure({
      rules: [
        rule({ tax_category_id: 1, state: 'NY' }),
        rule({ tax_category_id: 2, state: 'NJ' }),
        rule({ tax_category_id: 3, state: 'NY' }),
      ],
    });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('3 rules across 2 states');
  });

  it('state filter restricts the visible group', () => {
    const { fixture } = configure({
      rules: [rule({ tax_category_id: 1, state: 'NY' }), rule({ tax_category_id: 2, state: 'NJ' })],
    });
    const select = (fixture.nativeElement as HTMLElement).querySelector(
      'select[aria-label="Filter by state"]',
    ) as HTMLSelectElement;
    select.value = 'NJ';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    // The group header for NJ is visible, NY's group header is not.
    const groups = (fixture.nativeElement as HTMLElement).querySelectorAll(
      'h2.text-lg.font-semibold',
    );
    const groupTitles = Array.from(groups).map((g) => (g.textContent ?? '').trim());
    expect(groupTitles).toEqual(['NJ']);
    expect(text).toContain('Clear filter');
  });

  it('Add tax rule button toggles the form', () => {
    const { fixture } = configure({});
    const root = fixture.nativeElement as HTMLElement;
    const addBtn = Array.from(root.querySelectorAll('button')).find((b) =>
      (b.textContent ?? '').trim().includes('+ Add tax rule'),
    ) as HTMLButtonElement;
    addBtn.click();
    fixture.detectChanges();
    const form = root.querySelector('form[aria-label="Add tax rule"]');
    expect(form).not.toBeNull();
  });

  it('submitting the add form calls svc.add with normalized values', async () => {
    const add = vi.fn().mockResolvedValue(undefined);
    const { fixture } = configure({ add });
    const root = fixture.nativeElement as HTMLElement;
    const addBtn = Array.from(root.querySelectorAll('button')).find((b) =>
      (b.textContent ?? '').trim().includes('+ Add tax rule'),
    ) as HTMLButtonElement;
    addBtn.click();
    fixture.detectChanges();

    function setField(name: string, value: string) {
      const input = root.querySelector(`[formcontrolname="${name}"]`) as
        | HTMLInputElement
        | HTMLSelectElement;
      input.value = value;
      input.dispatchEvent(new Event('input'));
      input.dispatchEvent(new Event('change'));
    }
    setField('state', 'ny');
    setField('code', 'ny_retail_excise');
    setField('name', 'NY Retail Excise');
    setField('rate', '0.09');
    setField('taxBasis', 'retail_price');
    fixture.detectChanges();

    const form = root.querySelector('form[aria-label="Add tax rule"]') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(add).toHaveBeenCalledWith({
      state: 'NY',
      code: 'NY_RETAIL_EXCISE',
      name: 'NY Retail Excise',
      rate: 0.09,
      taxBasis: 'retail_price',
      statutoryReference: null,
    });
  });

  it('toggle button calls svc.update with the negated is_active', async () => {
    const update = vi.fn().mockResolvedValue(undefined);
    const { fixture } = configure({
      rules: [rule({ tax_category_id: 42, code: 'X', is_active: true })],
      update,
    });
    const toggleBtn = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label="Deactivate X"]',
    ) as HTMLButtonElement;
    toggleBtn.click();
    await fixture.whenStable();
    expect(update).toHaveBeenCalledWith({ taxCategoryId: 42, isActive: false });
  });

  it('edit flow: opens inline editor, saves name + rate diff', async () => {
    const update = vi.fn().mockResolvedValue(undefined);
    const { fixture } = configure({
      rules: [rule({ tax_category_id: 7, code: 'A', name: 'Old', rate: 0.05 })],
      update,
    });
    const root = fixture.nativeElement as HTMLElement;
    const editBtn = root.querySelector('button[aria-label="Edit A"]') as HTMLButtonElement;
    editBtn.click();
    fixture.detectChanges();

    const nameInput = root.querySelector('input[aria-label="Edit name for A"]') as HTMLInputElement;
    nameInput.value = 'New name';
    nameInput.dispatchEvent(new Event('input'));
    const rateInput = root.querySelector('input[aria-label="Edit rate for A"]') as HTMLInputElement;
    rateInput.value = '0.07';
    rateInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const saveBtn = root.querySelector(
      'button[aria-label="Save edits for A"]',
    ) as HTMLButtonElement;
    saveBtn.click();
    await fixture.whenStable();
    expect(update).toHaveBeenCalledWith({
      taxCategoryId: 7,
      name: 'New name',
      rate: 0.07,
    });
  });
});
