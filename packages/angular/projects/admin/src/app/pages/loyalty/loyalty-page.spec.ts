import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LoyaltyPage } from './loyalty-page';
import { LoyaltyService, type LoyaltyReward, type LoyaltyStats } from './loyalty.service';

interface FakeArgs {
  readonly stats?: LoyaltyStats | null;
  readonly rewards?: readonly LoyaltyReward[];
  readonly loading?: boolean;
  readonly error?: unknown;
  readonly saving?: boolean;
  readonly createReward?: ReturnType<typeof vi.fn>;
}

function makeSvc(args: FakeArgs): LoyaltyService {
  return {
    stats: signal<LoyaltyStats | null>(args.stats ?? null).asReadonly(),
    rewards: signal<readonly LoyaltyReward[]>(args.rewards ?? []).asReadonly(),
    isLoading: signal<boolean>(args.loading ?? false).asReadonly(),
    error: signal<unknown>(args.error ?? null).asReadonly(),
    saving: signal<boolean>(args.saving ?? false).asReadonly(),
    createReward: args.createReward ?? vi.fn().mockResolvedValue(undefined),
  } as unknown as LoyaltyService;
}

function configure(args: FakeArgs = {}) {
  const svc = makeSvc(args);
  TestBed.configureTestingModule({
    imports: [LoyaltyPage],
    providers: [{ provide: LoyaltyService, useValue: svc }],
  });
  const f = TestBed.createComponent(LoyaltyPage);
  f.detectChanges();
  return { fixture: f, svc };
}

function reward(overrides: Partial<LoyaltyReward> = {}): LoyaltyReward {
  return {
    __typename: 'LoyaltyReward',
    rewardId: 'r-1',
    name: '10% Off Flower',
    description: 'Single-use discount',
    pointsCost: 500,
    rewardType: 'discount_percent',
    rewardValue: 10,
    ...overrides,
  } as LoyaltyReward;
}

function stats(overrides: Partial<LoyaltyStats> = {}): LoyaltyStats {
  return {
    __typename: 'LoyaltyStats',
    activeMembers: 250,
    totalEarned: 100_000,
    totalRedeemed: 30_000,
    redemptionCount: 45,
    birthdayClaims: 12,
    tierBreakdown: [
      { __typename: 'TierCount', tier: 'bronze', count: 150 },
      { __typename: 'TierCount', tier: 'silver', count: 70 },
      { __typename: 'TierCount', tier: 'gold', count: 25 },
      { __typename: 'TierCount', tier: 'platinum', count: 5 },
    ],
    ...overrides,
  } as LoyaltyStats;
}

describe('LoyaltyPage', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('renders loading state', () => {
    const { fixture } = configure({ loading: true });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Loading loyalty…');
  });

  it('renders error banner', () => {
    const { fixture } = configure({ error: new Error('boom') });
    const alert = (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('Failed to load loyalty');
    expect(alert?.textContent).toContain('boom');
  });

  it('renders 5 KPI cards from stats', () => {
    const { fixture } = configure({ stats: stats() });
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Active members');
    expect(text).toContain('250');
    expect(text).toContain('Points earned');
    expect(text).toContain('100,000');
    expect(text).toContain('Points redeemed');
    expect(text).toContain('30,000');
    expect(text).toContain('Redemptions');
    expect(text).toContain('45');
    expect(text).toContain('Birthday claims');
    expect(text).toContain('12');
  });

  it('renders the tier breakdown grid', () => {
    const { fixture } = configure({ stats: stats() });
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Member tiers');
    expect(text).toContain('bronze');
    expect(text).toContain('150');
    expect(text).toContain('silver');
    expect(text).toContain('70');
    expect(text).toContain('gold');
    expect(text).toContain('25');
    expect(text).toContain('platinum');
    expect(text).toContain('5');
  });

  it('renders the empty rewards-catalog message when no rewards', () => {
    const { fixture } = configure({ stats: stats(), rewards: [] });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No rewards yet.');
  });

  it('renders a reward row with formatted percent value', () => {
    const { fixture } = configure({
      stats: stats(),
      rewards: [reward({ rewardType: 'discount_percent', rewardValue: 15, pointsCost: 800 })],
    });
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('10% Off Flower');
    expect(text).toContain('800 pts');
    expect(text).toContain('discount percent');
    expect(text).toContain('15%');
  });

  it('formats fixed-dollar rewards as $X.XX', () => {
    const { fixture } = configure({
      stats: stats(),
      rewards: [reward({ name: '$5 off', rewardType: 'discount_fixed', rewardValue: 5 })],
    });
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('$5.00');
  });

  it('clicking New reward toggles the form', () => {
    const { fixture } = configure({ stats: stats() });
    const newBtn = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ).find((b) => (b.textContent ?? '').trim() === '+ New reward') as HTMLButtonElement;
    newBtn.click();
    fixture.detectChanges();
    const form = (fixture.nativeElement as HTMLElement).querySelector(
      'form[aria-label="Create reward"]',
    );
    expect(form).not.toBeNull();
  });

  it('submit calls svc.createReward with parsed numeric values', async () => {
    const createReward = vi.fn().mockResolvedValue(undefined);
    const { fixture } = configure({ stats: stats(), createReward });

    const newBtn = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ).find((b) => (b.textContent ?? '').trim() === '+ New reward') as HTMLButtonElement;
    newBtn.click();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const set = (label: string, value: string) => {
      const input = root.querySelector(`[aria-label="${label}"]`) as
        | HTMLInputElement
        | HTMLSelectElement;
      input.value = value;
      input.dispatchEvent(new Event('input'));
      input.dispatchEvent(new Event('change'));
    };
    set('Reward name', 'Free joint');
    set('Points cost', '500');
    set('Reward value', '1');
    set('Reward type', 'free_item');
    set('Description', 'For new members');
    fixture.detectChanges();

    const form = root.querySelector('form[aria-label="Create reward"]') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(createReward).toHaveBeenCalledWith({
      name: 'Free joint',
      pointsCost: 500,
      rewardType: 'free_item',
      rewardValue: 1,
      description: 'For new members',
    });
  });
});
