import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { AppThemeService } from './core/theme/app-theme.service';
import { DispensaryContextService } from './core/tenant/dispensary-context.service';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        {
          provide: AppThemeService,
          useValue: { applyForCurrentTenant: () => Promise.resolve() },
        },
        {
          provide: DispensaryContextService,
          useValue: { current: () => null },
        },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
