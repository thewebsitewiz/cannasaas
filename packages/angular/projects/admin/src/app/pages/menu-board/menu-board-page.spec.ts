import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { MenuBoardPage } from './menu-board-page';
import {
  MenuBoardService,
  type ActivePromotion,
  type MenuBoardProduct,
} from './menu-board.service';

interface FakeArgs {
  readonly products?: readonly MenuBoardProduct[];
  readonly promotions?: readonly ActivePromotion[];
}

function makeSvc(args: FakeArgs): MenuBoardService {
  return {
    products: signal<readonly MenuBoardProduct[]>(args.products ?? []).asReadonly(),
    promotions: signal<readonly ActivePromotion[]>(args.promotions ?? []).asReadonly(),
    isLoading: signal<boolean>(false).asReadonly(),
    error: signal<unknown>(null).asReadonly(),
  } as unknown as MenuBoardService;
}

function configure(args: FakeArgs = {}) {
  TestBed.configureTestingModule({
    imports: [MenuBoardPage],
    providers: [{ provide: MenuBoardService, useValue: makeSvc(args) }],
  });
  const f = TestBed.createComponent(MenuBoardPage);
  f.detectChanges();
  return f;
}

function product(overrides: Partial<MenuBoardProduct> = {}): MenuBoardProduct {
  return {
    __typename: 'Product',
    id: 'p-1',
    name: 'Blue Dream',
    strainType: 'hybrid',
    thcPercent: 22,
    cbdPercent: 0.5,
    variants: [
      {
        __typename: 'ProductVariant',
        variantId: 'v-1',
        name: '3.5g Jar',
        retailPrice: 45,
      },
    ],
    ...overrides,
  } as MenuBoardProduct;
}

function promo(overrides: Partial<ActivePromotion> = {}): ActivePromotion {
  return {
    __typename: 'PromotionListItem',
    promoId: 'pr-1',
    name: '10% Off Flower',
    description: 'All week long',
    discountValue: 10,
    type: 'percent',
    isActive: true,
    ...overrides,
  } as ActivePromotion;
}

describe('MenuBoardPage', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('renders title + clock + fullscreen toggle', () => {
    const f = configure();
    const root = f.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Menu Board');
    const clock = root.querySelector('[aria-label="Current time"]');
    expect(clock).not.toBeNull();
    const fsBtn = root.querySelector(
      'button[aria-label="Enter fullscreen"], button[aria-label="Exit fullscreen"]',
    );
    expect(fsBtn).not.toBeNull();
  });

  it('renders all 7 category tabs', () => {
    const f = configure();
    const tabs = (f.nativeElement as HTMLElement).querySelectorAll('[role="tab"]');
    const labels = Array.from(tabs).map((t) => (t.textContent ?? '').trim());
    expect(labels).toEqual([
      'Flower',
      'Edible',
      'Vape',
      'Pre-Roll',
      'Concentrate',
      'Topical',
      'Tincture',
    ]);
  });

  it('clicking a category tab marks it active', () => {
    const f = configure();
    const tabs = (f.nativeElement as HTMLElement).querySelectorAll('[role="tab"]');
    (tabs[3] as HTMLButtonElement).click();
    f.detectChanges();
    const refreshed = (f.nativeElement as HTMLElement).querySelectorAll('[role="tab"]');
    const selected = Array.from(refreshed).filter(
      (t) => t.getAttribute('aria-selected') === 'true',
    );
    expect(selected.length).toBe(1);
    expect((selected[0].textContent ?? '').trim()).toBe('Pre-Roll');
  });

  it('shows empty state when no products', () => {
    const f = configure({ products: [] });
    expect((f.nativeElement as HTMLElement).textContent).toContain('No products to display.');
  });

  it('renders a product card with strain badge + THC + price', () => {
    const f = configure({
      products: [product({ name: 'OG Kush', strainType: 'indica', thcPercent: 24 })],
    });
    const text = (f.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('OG Kush');
    expect(text).toContain('indica');
    expect(text).toContain('THC 24%');
    expect(text).toContain('$45.00');
  });

  it('renders the promotions banner when there are active promos', () => {
    const f = configure({
      products: [product()],
      promotions: [promo({ name: '20% Off Edibles', discountValue: 20 })],
    });
    const root = f.nativeElement as HTMLElement;
    const banner = root.querySelector('[aria-label="Daily specials"]');
    expect(banner).not.toBeNull();
    expect(banner?.textContent).toContain('20% Off Edibles');
    expect(banner?.textContent).toContain('20% OFF');
  });

  it('hides the promotions banner when no promos', () => {
    const f = configure({ products: [product()] });
    const banner = (f.nativeElement as HTMLElement).querySelector('[aria-label="Daily specials"]');
    expect(banner).toBeNull();
  });

  it('formats fixed-amount discounts as $X.XX OFF', () => {
    const f = configure({
      products: [product()],
      promotions: [promo({ name: '$5 off', discountValue: 5, type: 'fixed' })],
    });
    expect((f.nativeElement as HTMLElement).textContent).toContain('$5.00 OFF');
  });
});
