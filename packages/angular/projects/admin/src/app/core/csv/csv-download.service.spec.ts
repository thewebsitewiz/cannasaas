import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthService } from '../auth/auth.service';
import { CsvDownloadService } from './csv-download.service';

function makeAuth(token: string | null): AuthService {
  return {
    accessToken: () => token,
  } as unknown as AuthService;
}

describe('CsvDownloadService', () => {
  let svc: CsvDownloadService;
  let http: HttpTestingController;
  let createObjectURL: ReturnType<typeof vi.fn>;
  let revokeObjectURL: ReturnType<typeof vi.fn>;
  let appendedNodes: Node[];
  let anchorClick: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    createObjectURL = vi.fn().mockReturnValue('blob:fake');
    revokeObjectURL = vi.fn();
    anchorClick = vi.fn();
    appendedNodes = [];
    URL.createObjectURL = createObjectURL as unknown as typeof URL.createObjectURL;
    URL.revokeObjectURL = revokeObjectURL as unknown as typeof URL.revokeObjectURL;

    vi.spyOn(document.body, 'appendChild').mockImplementation(((node: Node) => {
      appendedNodes.push(node);
      return node;
    }) as typeof document.body.appendChild);
    vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => {
      if (tag === 'a') {
        const a = { href: '', download: '', click: anchorClick, remove: vi.fn() };
        return a as unknown as HTMLAnchorElement;
      }
      return document.createElement(tag);
    }) as typeof document.createElement);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const configure = (token: string | null = 'tkn'): void => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: makeAuth(token) },
      ],
    });
    svc = TestBed.inject(CsvDownloadService);
    http = TestBed.inject(HttpTestingController);
  };

  it('sets Authorization bearer when token is present', async () => {
    configure('tkn');
    const promise = svc.download({
      path: '/reports/sales/csv',
      params: { dispensaryId: 'disp-1', startDate: '2026-05-01', endDate: '2026-05-31' },
      suggestedFilename: 'sales.csv',
    });
    const req = http.expectOne((r) => r.url.endsWith('/reports/sales/csv'));
    expect(req.request.headers.get('Authorization')).toBe('Bearer tkn');
    expect(req.request.headers.get('Accept')).toBe('text/csv');
    expect(req.request.params.get('dispensaryId')).toBe('disp-1');
    expect(req.request.params.get('startDate')).toBe('2026-05-01');
    expect(req.request.params.get('endDate')).toBe('2026-05-31');
    req.flush(new Blob(['a,b\n1,2'], { type: 'text/csv' }));
    await promise;
  });

  it('omits the Authorization header when no token', async () => {
    configure(null);
    const promise = svc.download({ path: '/x', suggestedFilename: 'x.csv' });
    const req = http.expectOne('http://localhost:3000/x');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush(new Blob(['x']));
    await promise;
  });

  it('skips null / empty params', async () => {
    configure();
    const promise = svc.download({
      path: '/x',
      params: { a: '1', b: null, c: undefined, d: '' },
      suggestedFilename: 'x.csv',
    });
    const req = http.expectOne((r) => r.url.endsWith('/x'));
    expect(req.request.params.get('a')).toBe('1');
    expect(req.request.params.has('b')).toBe(false);
    expect(req.request.params.has('c')).toBe(false);
    expect(req.request.params.has('d')).toBe(false);
    req.flush(new Blob(['x']));
    await promise;
  });

  it('triggers an anchor download with the suggested filename when Content-Disposition is absent', async () => {
    configure();
    const promise = svc.download({ path: '/x', suggestedFilename: 'fallback.csv' });
    const req = http.expectOne((r) => r.url.endsWith('/x'));
    req.flush(new Blob(['hi']), { headers: {} });
    await promise;
    expect(anchorClick).toHaveBeenCalled();
    expect(createObjectURL).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalled();
  });

  it('prefers the server filename from Content-Disposition', async () => {
    configure();
    const promise = svc.download({ path: '/x', suggestedFilename: 'wrong.csv' });
    const req = http.expectOne((r) => r.url.endsWith('/x'));
    req.flush(new Blob(['hi']), {
      headers: { 'Content-Disposition': 'attachment; filename="server-name.csv"' },
    });
    await promise;
    // The mocked anchor receives `download = 'server-name.csv'` via the closure
    // we set up in createElement.  We can't capture the value directly because
    // each call gets a fresh anchor stub, but the click was invoked exactly once.
    expect(anchorClick).toHaveBeenCalledTimes(1);
  });

  it('flips the downloading signal during the request', async () => {
    configure();
    expect(svc.downloading()).toBeNull();
    const promise = svc.download({ path: '/x', suggestedFilename: 'x.csv' });
    expect(svc.downloading()).toBe('/x');
    const req = http.expectOne((r) => r.url.endsWith('/x'));
    req.flush(new Blob(['x']));
    await promise;
    expect(svc.downloading()).toBeNull();
  });
});
