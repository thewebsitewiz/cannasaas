import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';

export interface CsvDownloadOptions {
  /** Path under the API origin, e.g. `/reports/sales/csv`. */
  readonly path: string;
  /** Query string params; falsy values are dropped. */
  readonly params?: Readonly<Record<string, string | number | null | undefined>>;
  /** Filename suggested to the browser. The actual server filename (from
   *  Content-Disposition) takes precedence when present. */
  readonly suggestedFilename: string;
}

/**
 * Small helper around HttpClient that:
 *  - attaches the admin's JWT bearer
 *  - fetches the response as a `Blob`
 *  - triggers a browser download by anchor + revoke
 *
 * Used by `/timeclock` and `/reports/*` for CSV exports. Centralised
 * so per-page services don't each re-implement blob plumbing.
 */
@Injectable({ providedIn: 'root' })
export class CsvDownloadService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  /** Optional global busy signal — callers can show "Downloading…" UI. */
  private readonly _downloading = signal<string | null>(null);
  readonly downloading = this._downloading.asReadonly();

  async download(opts: CsvDownloadOptions): Promise<void> {
    const token = this.auth.accessToken();
    let headers = new HttpHeaders({ Accept: 'text/csv' });
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);

    let params = new HttpParams();
    for (const [key, value] of Object.entries(opts.params ?? {})) {
      if (value == null || value === '') continue;
      params = params.set(key, String(value));
    }

    this._downloading.set(opts.path);
    try {
      const response = await firstValueFrom(
        this.http.get(`${environment.apiUrl}${opts.path}`, {
          headers,
          params,
          responseType: 'blob',
          observe: 'response',
        }),
      );
      const blob = response.body;
      if (!blob) throw new Error('Empty CSV response.');
      const filename =
        parseFilenameFromContentDisposition(response.headers.get('Content-Disposition')) ??
        opts.suggestedFilename;
      triggerDownload(blob, filename);
    } finally {
      this._downloading.set(null);
    }
  }
}

function parseFilenameFromContentDisposition(header: string | null): string | null {
  if (!header) return null;
  const match = /filename\s*=\s*"?([^";]+)"?/i.exec(header);
  return match ? match[1] : null;
}

function triggerDownload(blob: Blob, filename: string): void {
  if (typeof document === 'undefined' || typeof URL === 'undefined') return;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
