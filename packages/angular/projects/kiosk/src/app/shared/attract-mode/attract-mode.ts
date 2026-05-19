import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';

interface Slide {
  readonly title: string;
  readonly subtitle: string;
  readonly bg: string;
}

const SLIDES: readonly Slide[] = [
  {
    title: 'Premium Cannabis',
    subtitle: 'Curated for you',
    bg: 'from-emerald-900 via-emerald-700 to-teal-900',
  },
  {
    title: 'Tap to begin',
    subtitle: 'Browse the menu, build a cart, pay at the counter',
    bg: 'from-violet-900 via-purple-800 to-indigo-900',
  },
  {
    title: 'Locally grown',
    subtitle: 'Compliance you can trust',
    bg: 'from-amber-900 via-orange-800 to-yellow-900',
  },
] as const;

const SLIDE_INTERVAL_MS = 5000;

@Component({
  selector: 'cs-attract-mode',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'fixed inset-0 z-100',
    role: 'button',
    tabindex: '0',
    '(click)': 'exit.emit()',
    '(touchstart)': 'exit.emit()',
    'aria-label': 'Tap to wake kiosk',
  },
  template: `
    @let slide = currentSlide();
    <div
      class="absolute inset-0 bg-linear-to-br transition-[background] duration-1000 ease-out"
      [class]="slide.bg"
    >
      <div class="absolute inset-0 bg-black/30"></div>
      <div
        class="absolute inset-0 flex flex-col items-center justify-center px-12 text-center text-white"
      >
        <h1
          class="text-6xl leading-tight font-light tracking-tight lg:text-8xl"
          style="font-family: 'Playfair Display', Georgia, serif;"
        >
          {{ slide.title }}
        </h1>
        <p class="mt-6 max-w-3xl text-2xl text-white/80 lg:text-3xl">
          {{ slide.subtitle }}
        </p>
      </div>

      <div class="absolute right-0 bottom-12 left-0 flex flex-col items-center gap-6">
        <div class="flex gap-3">
          @for (s of slides; track $index; let i = $index) {
            <span
              class="h-2 w-12 rounded-full transition-colors duration-500"
              [class.bg-white]="index() === i"
              [class.bg-white\\/30]="index() !== i"
            ></span>
          }
        </div>
        <p class="text-lg font-medium tracking-[0.3em] text-white/70 uppercase">
          Tap anywhere to begin
        </p>
      </div>
    </div>
  `,
})
export class AttractMode {
  readonly exit = output<void>();

  protected readonly slides = SLIDES;
  protected readonly index = signal(0);
  protected readonly currentSlide = computed<Slide>(
    () => SLIDES[this.index() % SLIDES.length] ?? SLIDES[0],
  );

  constructor() {
    const id = setInterval(() => {
      this.index.update((i) => (i + 1) % SLIDES.length);
    }, SLIDE_INTERVAL_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(id));
  }
}
