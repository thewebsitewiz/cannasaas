import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthService } from '../../core/auth/auth.service';
import { ProductsPage } from './products-page';
import { ProductsService, type Product, type ProductVariant } from './products.service';

interface FakeArgs {
  readonly products?: readonly Product[];
  readonly search?: string;
  readonly loading?: boolean;
  readonly error?: unknown;
  readonly saving?: boolean;
  readonly savingPrice?: boolean;
  readonly deleting?: boolean;
  readonly setSearch?: ReturnType<typeof vi.fn>;
  readonly create?: ReturnType<typeof vi.fn>;
  readonly update?: ReturnType<typeof vi.fn>;
  readonly updateVariantPrice?: ReturnType<typeof vi.fn>;
  readonly deleteProduct?: ReturnType<typeof vi.fn>;
  readonly createVariant?: ReturnType<typeof vi.fn>;
  readonly updateVariant?: ReturnType<typeof vi.fn>;
  readonly deleteVariant?: ReturnType<typeof vi.fn>;
}

function makeSvc(args: FakeArgs): ProductsService {
  const products = args.products ?? [];
  const search = args.search ?? '';
  const filtered = search
    ? products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : products;
  return {
    allProducts: signal<readonly Product[]>(products).asReadonly(),
    filteredProducts: signal<readonly Product[]>(filtered).asReadonly(),
    isLoading: signal<boolean>(args.loading ?? false).asReadonly(),
    error: signal<unknown>(args.error ?? null).asReadonly(),
    saving: signal<boolean>(args.saving ?? false).asReadonly(),
    savingPrice: signal<boolean>(args.savingPrice ?? false).asReadonly(),
    deleting: signal<boolean>(args.deleting ?? false).asReadonly(),
    search: signal<string>(search).asReadonly(),
    setSearch: args.setSearch ?? vi.fn(),
    create: args.create ?? vi.fn().mockResolvedValue(undefined),
    update: args.update ?? vi.fn().mockResolvedValue(undefined),
    updateVariantPrice: args.updateVariantPrice ?? vi.fn().mockResolvedValue(undefined),
    deleteProduct: args.deleteProduct ?? vi.fn().mockResolvedValue(undefined),
    createVariant: args.createVariant ?? vi.fn().mockResolvedValue(undefined),
    updateVariant: args.updateVariant ?? vi.fn().mockResolvedValue(undefined),
    deleteVariant: args.deleteVariant ?? vi.fn().mockResolvedValue(undefined),
  } as unknown as ProductsService;
}

function makeAuth(): AuthService {
  return {
    user: () => ({
      id: 'u-1',
      email: 'a@a.com',
      role: 'dispensary_admin',
      dispensaryId: 'disp-1',
    }),
  } as unknown as AuthService;
}

function configure(args: FakeArgs = {}) {
  const svc = makeSvc(args);
  TestBed.configureTestingModule({
    imports: [ProductsPage],
    providers: [
      { provide: ProductsService, useValue: svc },
      { provide: AuthService, useValue: makeAuth() },
    ],
  });
  const fixture = TestBed.createComponent(ProductsPage);
  fixture.detectChanges();
  return { fixture, svc };
}

function variant(overrides: Partial<ProductVariant> = {}): ProductVariant {
  return {
    __typename: 'ProductVariant',
    variantId: 'v-1',
    name: '3.5g Jar',
    sku: 'BD-35',
    quantityPerUnit: 3.5,
    retailPrice: 45,
    stockQuantity: 12,
    stockStatus: 'in_stock',
    sortOrder: 0,
    isActive: true,
    ...overrides,
  } as ProductVariant;
}

function product(overrides: Partial<Product> = {}): Product {
  return {
    __typename: 'Product',
    id: 'p-1',
    name: 'Blue Dream',
    sku: 'BD',
    description: 'Hybrid flower',
    shortDescription: null,
    strainName: 'Blue Dream',
    strainType: 'hybrid',
    thcPercent: 22,
    cbdPercent: 0.5,
    effects: null,
    flavors: null,
    primaryCategoryId: null,
    productTypeId: null,
    brandId: null,
    isActive: true,
    isApproved: true,
    variants: [variant()],
    ...overrides,
  } as Product;
}

describe('ProductsPage', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('renders the count and an Add product button', () => {
    const { fixture } = configure({ products: [product(), product({ id: 'p-2' })] });
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Products (2)');
    const btns = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button'));
    expect(btns.find((b) => (b.textContent ?? '').trim() === '+ Add product')).toBeTruthy();
  });

  it('typing in the search box calls setSearch', () => {
    const setSearch = vi.fn();
    const { fixture } = configure({ setSearch });
    const input = (fixture.nativeElement as HTMLElement).querySelector(
      'input[aria-label="Search products"]',
    ) as HTMLInputElement;
    input.value = 'blue';
    input.dispatchEvent(new Event('input'));
    expect(setSearch).toHaveBeenCalledWith('blue');
  });

  it('renders loading state', () => {
    const { fixture } = configure({ loading: true });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Loading…');
  });

  it('renders error banner', () => {
    const { fixture } = configure({ error: new Error('boom') });
    const alert = (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('Failed to load products');
    expect(alert?.textContent).toContain('boom');
  });

  it('renders empty state', () => {
    const { fixture } = configure({ products: [], search: 'xyz' });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'No products match this search.',
    );
  });

  it('renders a product row with price, strain, stock, and status', () => {
    const { fixture } = configure({
      products: [product({ name: 'OG Kush', thcPercent: 25 })],
    });
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('OG Kush');
    expect(text).toContain('hybrid');
    expect(text).toContain('THC 25%');
    expect(text).toContain('$45.00');
    expect(text).toContain('In Stock');
    expect(text).toContain('Active');
  });

  it('clicking Add product opens the create form', () => {
    const { fixture } = configure({});
    const addBtn = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ).find((b) => (b.textContent ?? '').trim() === '+ Add product') as HTMLButtonElement;
    addBtn.click();
    fixture.detectChanges();
    const form = (fixture.nativeElement as HTMLElement).querySelector(
      'form[aria-label="Create product"]',
    );
    expect(form).not.toBeNull();
  });

  it('clicking a row opens the detail panel', () => {
    const { fixture } = configure({ products: [product({ id: 'p-77' })] });
    const row = (fixture.nativeElement as HTMLElement).querySelector(
      'tbody tr',
    ) as HTMLTableRowElement;
    row.click();
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Product details');
    expect(text).toContain('Blue Dream');
  });

  it('Edit button on detail panel switches to edit mode', () => {
    const { fixture } = configure({ products: [product()] });
    const row = (fixture.nativeElement as HTMLElement).querySelector(
      'tbody tr',
    ) as HTMLTableRowElement;
    row.click();
    fixture.detectChanges();
    const editBtn = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ).find((b) => (b.textContent ?? '').trim() === 'Edit') as HTMLButtonElement;
    editBtn.click();
    fixture.detectChanges();
    const form = (fixture.nativeElement as HTMLElement).querySelector(
      'form[aria-label="Edit product"]',
    );
    expect(form).not.toBeNull();
  });

  it('create submit calls svc.create with the form payload', async () => {
    const create = vi.fn().mockResolvedValue(undefined);
    const { fixture } = configure({ create });
    // open create panel
    const addBtn = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ).find((b) => (b.textContent ?? '').trim() === '+ Add product') as HTMLButtonElement;
    addBtn.click();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const nameInput = root.querySelector('input[formcontrolname="name"]') as HTMLInputElement;
    nameInput.value = 'New Strain';
    nameInput.dispatchEvent(new Event('input'));
    const priceInput = root.querySelector(
      'input[formcontrolname="retailPrice"]',
    ) as HTMLInputElement;
    priceInput.value = '50';
    priceInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const form = root.querySelector('form[aria-label="Create product"]') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'New Strain',
        dispensaryId: 'disp-1',
        retailPrice: 50,
      }),
    );
  });

  it('inline price edit calls svc.updateVariantPrice with new price', async () => {
    const updateVariantPrice = vi.fn().mockResolvedValue(undefined);
    const { fixture } = configure({
      products: [product({ variants: [variant({ variantId: 'v-42', retailPrice: 45 })] })],
      updateVariantPrice,
    });
    const row = (fixture.nativeElement as HTMLElement).querySelector(
      'tbody tr',
    ) as HTMLTableRowElement;
    row.click();
    fixture.detectChanges();
    const priceInput = (fixture.nativeElement as HTMLElement).querySelector(
      'input[aria-label^="Price for"]',
    ) as HTMLInputElement;
    priceInput.value = '49.99';
    priceInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    const saveBtn = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label^="Save price"]',
    ) as HTMLButtonElement;
    saveBtn.click();
    await fixture.whenStable();
    expect(updateVariantPrice).toHaveBeenCalledWith({
      variantId: 'v-42',
      dispensaryId: 'disp-1',
      price: 49.99,
    });
  });

  it('delete flow: open confirm, click confirm, calls svc.deleteProduct', async () => {
    const deleteProduct = vi.fn().mockResolvedValue(undefined);
    const { fixture } = configure({
      products: [product({ id: 'p-99' })],
      deleteProduct,
    });
    const row = (fixture.nativeElement as HTMLElement).querySelector(
      'tbody tr',
    ) as HTMLTableRowElement;
    row.click();
    fixture.detectChanges();
    const deleteBtn = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ).find((b) => (b.textContent ?? '').trim() === 'Delete') as HTMLButtonElement;
    deleteBtn.click();
    fixture.detectChanges();
    const confirmBtn = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label^="Confirm delete"]',
    ) as HTMLButtonElement;
    confirmBtn.click();
    await fixture.whenStable();
    expect(deleteProduct).toHaveBeenCalledWith('p-99', 'disp-1');
  });

  it('No button cancels the delete confirmation', () => {
    const { fixture } = configure({ products: [product()] });
    const row = (fixture.nativeElement as HTMLElement).querySelector(
      'tbody tr',
    ) as HTMLTableRowElement;
    row.click();
    fixture.detectChanges();
    const deleteBtn = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ).find((b) => (b.textContent ?? '').trim() === 'Delete') as HTMLButtonElement;
    deleteBtn.click();
    fixture.detectChanges();
    const noBtn = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ).find((b) => (b.textContent ?? '').trim() === 'No') as HTMLButtonElement;
    noBtn.click();
    fixture.detectChanges();
    const confirmBtn = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label^="Confirm delete"]',
    );
    expect(confirmBtn).toBeNull();
  });

  // ── Variant CRUD (sc-682a) ────────────────────────────────────────────

  it('detail panel renders the Variants section header + add-variant button', () => {
    const { fixture } = configure({ products: [product()] });
    const row = (fixture.nativeElement as HTMLElement).querySelector(
      'tbody tr',
    ) as HTMLTableRowElement;
    row.click();
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Variants (1)');
    const addBtn = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label="Add variant"]',
    );
    expect(addBtn).not.toBeNull();
  });

  it('clicking Add variant opens the inline form', () => {
    const { fixture } = configure({ products: [product()] });
    const row = (fixture.nativeElement as HTMLElement).querySelector(
      'tbody tr',
    ) as HTMLTableRowElement;
    row.click();
    fixture.detectChanges();
    const addBtn = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label="Add variant"]',
    ) as HTMLButtonElement;
    addBtn.click();
    fixture.detectChanges();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('input[aria-label="New variant name"]'),
    ).not.toBeNull();
  });

  it('submitting Add variant calls svc.createVariant with parsed numbers', async () => {
    const createVariant = vi.fn().mockResolvedValue(undefined);
    const { fixture } = configure({
      products: [product({ id: 'p-42' })],
      createVariant,
    });
    const row = (fixture.nativeElement as HTMLElement).querySelector(
      'tbody tr',
    ) as HTMLTableRowElement;
    row.click();
    fixture.detectChanges();
    const addBtn = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label="Add variant"]',
    ) as HTMLButtonElement;
    addBtn.click();
    fixture.detectChanges();

    const nameInput = (fixture.nativeElement as HTMLElement).querySelector(
      'input[aria-label="New variant name"]',
    ) as HTMLInputElement;
    nameInput.value = '7g';
    nameInput.dispatchEvent(new Event('input'));
    const weightInput = (fixture.nativeElement as HTMLElement).querySelector(
      'input[aria-label="New variant weight"]',
    ) as HTMLInputElement;
    weightInput.value = '7';
    weightInput.dispatchEvent(new Event('input'));
    const priceInput = (fixture.nativeElement as HTMLElement).querySelector(
      'input[aria-label="New variant price"]',
    ) as HTMLInputElement;
    priceInput.value = '80';
    priceInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const form = (fixture.nativeElement as HTMLElement).querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    expect(createVariant).toHaveBeenCalledWith({
      productId: 'p-42',
      dispensaryId: 'disp-1',
      name: '7g',
      quantityPerUnit: 7,
      retailPrice: 80,
    });
  });

  it('submitting Add variant skips the mutation when name is empty', async () => {
    const createVariant = vi.fn().mockResolvedValue(undefined);
    const { fixture } = configure({ products: [product()], createVariant });
    const row = (fixture.nativeElement as HTMLElement).querySelector(
      'tbody tr',
    ) as HTMLTableRowElement;
    row.click();
    fixture.detectChanges();
    const addBtn = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label="Add variant"]',
    ) as HTMLButtonElement;
    addBtn.click();
    fixture.detectChanges();
    const submitBtn = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ).find((b) => (b.textContent ?? '').trim() === 'Add variant') as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(true);
    submitBtn.click();
    await fixture.whenStable();
    expect(createVariant).not.toHaveBeenCalled();
  });

  it('Cancel closes the Add variant form', () => {
    const { fixture } = configure({ products: [product()] });
    const row = (fixture.nativeElement as HTMLElement).querySelector(
      'tbody tr',
    ) as HTMLTableRowElement;
    row.click();
    fixture.detectChanges();
    const addBtn = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label="Add variant"]',
    ) as HTMLButtonElement;
    addBtn.click();
    fixture.detectChanges();
    const cancelBtn = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ).find((b) => (b.textContent ?? '').trim() === 'Cancel') as HTMLButtonElement;
    cancelBtn.click();
    fixture.detectChanges();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('input[aria-label="New variant name"]'),
    ).toBeNull();
  });

  it('variant delete: ✕ asks for confirm, Delete calls svc.deleteVariant', async () => {
    const deleteVariant = vi.fn().mockResolvedValue(undefined);
    const { fixture } = configure({ products: [product()], deleteVariant });
    const row = (fixture.nativeElement as HTMLElement).querySelector(
      'tbody tr',
    ) as HTMLTableRowElement;
    row.click();
    fixture.detectChanges();
    const xBtn = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label="Delete variant 3.5g Jar"]',
    ) as HTMLButtonElement;
    xBtn.click();
    fixture.detectChanges();
    const confirmBtn = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label="Confirm delete variant 3.5g Jar"]',
    ) as HTMLButtonElement;
    confirmBtn.click();
    await fixture.whenStable();
    expect(deleteVariant).toHaveBeenCalledWith('v-1', 'disp-1');
  });

  it('variant delete: No cancels the confirm without calling deleteVariant', () => {
    const deleteVariant = vi.fn().mockResolvedValue(undefined);
    const { fixture } = configure({ products: [product()], deleteVariant });
    const row = (fixture.nativeElement as HTMLElement).querySelector(
      'tbody tr',
    ) as HTMLTableRowElement;
    row.click();
    fixture.detectChanges();
    const xBtn = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label="Delete variant 3.5g Jar"]',
    ) as HTMLButtonElement;
    xBtn.click();
    fixture.detectChanges();
    const noBtn = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ).find((b) => (b.textContent ?? '').trim() === 'No') as HTMLButtonElement;
    noBtn.click();
    fixture.detectChanges();
    expect(deleteVariant).not.toHaveBeenCalled();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        'button[aria-label="Confirm delete variant 3.5g Jar"]',
      ),
    ).toBeNull();
  });
});
