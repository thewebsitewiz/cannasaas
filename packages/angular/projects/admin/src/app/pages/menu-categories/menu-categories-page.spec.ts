import type { CdkDragDrop } from '@angular/cdk/drag-drop';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthService } from '../../core/auth/auth.service';
import { MenuCategoriesPage } from './menu-categories-page';
import { MenuCategoriesService, type ProductTypeConfig } from './menu-categories.service';

interface FakeArgs {
  readonly types?: readonly ProductTypeConfig[];
  readonly loading?: boolean;
  readonly error?: unknown;
  readonly saving?: boolean;
  readonly save?: ReturnType<typeof vi.fn>;
}

function makeSvc(args: FakeArgs): MenuCategoriesService {
  return {
    types: signal<readonly ProductTypeConfig[]>(args.types ?? []).asReadonly(),
    isLoading: signal<boolean>(args.loading ?? false).asReadonly(),
    error: signal<unknown>(args.error ?? null).asReadonly(),
    saving: signal<boolean>(args.saving ?? false).asReadonly(),
    save: args.save ?? vi.fn().mockResolvedValue(undefined),
  } as unknown as MenuCategoriesService;
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
    imports: [MenuCategoriesPage],
    providers: [
      { provide: MenuCategoriesService, useValue: svc },
      { provide: AuthService, useValue: makeAuth() },
    ],
  });
  const f = TestBed.createComponent(MenuCategoriesPage);
  f.detectChanges();
  return { fixture: f, svc };
}

function row(overrides: Partial<ProductTypeConfig> = {}): ProductTypeConfig {
  return {
    __typename: 'DispensaryProductType',
    productTypeId: 1,
    code: 'FLOWER',
    name: 'Flower',
    isEnabled: true,
    sortOrder: 0,
    ...overrides,
  } as ProductTypeConfig;
}

describe('MenuCategoriesPage', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('renders loading state', () => {
    const { fixture } = configure({ loading: true });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Loading menu categories…',
    );
  });

  it('renders error banner', () => {
    const { fixture } = configure({ error: new Error('boom') });
    const alert = (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('Failed to load menu categories');
    expect(alert?.textContent).toContain('boom');
  });

  it('seeds items from server snapshot and shows enabled count', () => {
    const { fixture } = configure({
      types: [
        row({ productTypeId: 1, name: 'Flower', isEnabled: true, sortOrder: 0 }),
        row({ productTypeId: 2, name: 'Edibles', isEnabled: false, sortOrder: 1 }),
        row({ productTypeId: 3, name: 'Pre-rolls', isEnabled: true, sortOrder: 2 }),
      ],
    });
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Menu categories');
    expect(text).toContain('Flower');
    expect(text).toContain('Edibles');
    expect(text).toContain('Pre-rolls');
    expect(text).toContain('2 of 3 categories visible');
  });

  it('Save is disabled when local matches server', () => {
    const { fixture } = configure({ types: [row()] });
    const btn = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button')).find(
      (b) => (b.textContent ?? '').trim() === 'Save order',
    ) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Unsaved changes');
  });

  it('toggling an item enables Save and shows unsaved-changes hint', () => {
    const { fixture } = configure({ types: [row()] });
    const toggleBtn = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label^="Hide "]',
    ) as HTMLButtonElement;
    toggleBtn.click();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Unsaved changes');
    const saveBtn = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ).find((b) => (b.textContent ?? '').trim() === 'Save order') as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(false);
  });

  it('Reset restores the server snapshot and clears dirty', () => {
    const { fixture } = configure({ types: [row()] });
    const toggleBtn = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label^="Hide "]',
    ) as HTMLButtonElement;
    toggleBtn.click();
    fixture.detectChanges();
    const resetBtn = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label="Reset to saved order"]',
    ) as HTMLButtonElement;
    resetBtn.click();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Unsaved changes');
  });

  it('Save sends current items as { productTypeId, isEnabled, sortOrder: i }', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const { fixture } = configure({
      types: [
        row({ productTypeId: 1, name: 'Flower', isEnabled: true, sortOrder: 0 }),
        row({ productTypeId: 2, name: 'Edibles', isEnabled: true, sortOrder: 1 }),
      ],
      save,
    });
    // Toggle Edibles off
    const root = fixture.nativeElement as HTMLElement;
    const toggleBtn = root.querySelector('button[aria-label="Hide Edibles"]') as HTMLButtonElement;
    toggleBtn.click();
    fixture.detectChanges();
    const saveBtn = Array.from(root.querySelectorAll('button')).find(
      (b) => (b.textContent ?? '').trim() === 'Save order',
    ) as HTMLButtonElement;
    saveBtn.click();
    await fixture.whenStable();
    expect(save).toHaveBeenCalledWith([
      { productTypeId: 1, isEnabled: true, sortOrder: 0 },
      { productTypeId: 2, isEnabled: false, sortOrder: 1 },
    ]);
  });

  it('onDrop reorders items and dirties the form', () => {
    const { fixture } = configure({
      types: [
        row({ productTypeId: 1, name: 'Flower', sortOrder: 0 }),
        row({ productTypeId: 2, name: 'Edibles', sortOrder: 1 }),
        row({ productTypeId: 3, name: 'Pre-rolls', sortOrder: 2 }),
      ],
    });
    const cmp = fixture.componentInstance as unknown as {
      onDrop(event: CdkDragDrop<readonly ProductTypeConfig[]>): void;
    };
    cmp.onDrop({
      previousIndex: 2,
      currentIndex: 0,
    } as CdkDragDrop<readonly ProductTypeConfig[]>);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Unsaved changes');
    const rows = (fixture.nativeElement as HTMLElement).querySelectorAll('ul li');
    const first = rows[0].textContent ?? '';
    expect(first).toContain('Pre-rolls');
  });

  it('onDrop with previousIndex === currentIndex does nothing', () => {
    const { fixture } = configure({
      types: [row({ productTypeId: 1, name: 'Flower' })],
    });
    const cmp = fixture.componentInstance as unknown as {
      onDrop(event: CdkDragDrop<readonly ProductTypeConfig[]>): void;
    };
    cmp.onDrop({
      previousIndex: 0,
      currentIndex: 0,
    } as CdkDragDrop<readonly ProductTypeConfig[]>);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Unsaved changes');
  });
});
