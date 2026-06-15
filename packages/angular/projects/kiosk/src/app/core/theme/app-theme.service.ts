import { Injectable, inject } from '@angular/core';
import { ThemeService } from '@cannasaas/ui-ng';

import { environment } from '../../../environments/environment';

/**
 * Kiosks are provisioned for a single dispensary at install time
 * (`environment.dispensaryId`), so the per-dispensary CSS link is
 * one-shot — no auth-state effect needed. Called from
 * `provideAppInitializer` in app.config.ts (sc-637 follow-on).
 */
@Injectable({ providedIn: 'root' })
export class AppThemeService {
  private readonly theme = inject(ThemeService);

  apply(): void {
    this.theme.setDispensaryCss(
      environment.apiUrl,
      environment.dispensaryId ?? null,
    );
  }
}
