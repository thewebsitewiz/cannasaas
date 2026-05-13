import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface CategoryLink {
  readonly label: string;
  readonly slug: string;
}

interface AccountLink {
  readonly label: string;
  readonly path: string;
}

const SHOP_CATEGORIES: readonly CategoryLink[] = [
  { label: 'Flower', slug: 'flower' },
  { label: 'Edibles', slug: 'edibles' },
  { label: 'Vapes', slug: 'vapes' },
  { label: 'Pre-Rolls', slug: 'pre-rolls' },
  { label: 'Concentrates', slug: 'concentrates' },
];

const ACCOUNT_LINKS: readonly AccountLink[] = [
  { label: 'My Account', path: '/account' },
  { label: 'Order History', path: '/account' },
  { label: 'Rewards', path: '/account' },
  { label: 'Sign In', path: '/login' },
];

@Component({
  selector: 'cs-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <footer class="bg-[#0a1a0f] text-white/40">
      <div class="mx-auto max-w-7xl px-6 py-16">
        <div class="mb-12 grid grid-cols-1 gap-10 md:grid-cols-4">
          <div class="md:col-span-1">
            <div class="mb-4 flex items-center gap-2.5">
              <div
                class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-sm font-black tracking-tighter text-white"
              >
                GL
              </div>
              <span
                class="text-lg font-semibold text-white"
                style="font-family: 'Playfair Display', Georgia, serif"
                >GreenLeaf</span
              >
            </div>
            <p class="text-sm leading-relaxed">
              Curated cannabis. Tested for quality. Delivered with care.
            </p>
          </div>

          <div>
            <h4 class="mb-4 text-xs font-semibold uppercase tracking-wider text-white/60">Shop</h4>
            <ul class="space-y-2.5">
              @for (cat of shopCategories; track cat.slug) {
                <li>
                  <a
                    class="text-sm transition-colors hover:text-white"
                    [routerLink]="['/products']"
                    [queryParams]="{ category: cat.slug }"
                    >{{ cat.label }}</a
                  >
                </li>
              }
            </ul>
          </div>

          <div>
            <h4 class="mb-4 text-xs font-semibold uppercase tracking-wider text-white/60">
              Account
            </h4>
            <ul class="space-y-2.5">
              @for (link of accountLinks; track link.label) {
                <li>
                  <a
                    class="text-sm transition-colors hover:text-white"
                    [routerLink]="[link.path]"
                    >{{ link.label }}</a
                  >
                </li>
              }
            </ul>
          </div>

          <div>
            <h4 class="mb-4 text-xs font-semibold uppercase tracking-wider text-white/60">Hours</h4>
            <ul class="space-y-2.5 text-sm">
              <li>Mon–Sat: 10am – 9pm</li>
              <li>Sunday: 11am – 7pm</li>
              <li class="pt-2 text-white/60">21+ only. Valid ID required.</li>
            </ul>
          </div>
        </div>

        <div
          class="flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 sm:flex-row"
        >
          <p class="text-xs text-white/20">© {{ year }} GreenLeaf Dispensary</p>
          <p class="text-xs text-white/20">
            Powered by <span class="text-emerald-500/40">CannaSaas</span>
          </p>
        </div>
      </div>
    </footer>
  `,
})
export class Footer {
  protected readonly shopCategories = SHOP_CATEGORIES;
  protected readonly accountLinks = ACCOUNT_LINKS;
  protected readonly year = new Date().getFullYear();
}
