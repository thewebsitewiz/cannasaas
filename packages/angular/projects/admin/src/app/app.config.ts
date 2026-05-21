import { ApplicationConfig, inject, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideApollo } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { ApolloClient, ApolloLink, InMemoryCache } from '@apollo/client';

import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { AuthService } from './core/auth/auth.service';
import { createAuthMiddleware } from './core/auth/auth-middleware';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // ngx-charts (sc-624 chart lib) emits `@animationState` synthetic
    // props even when [animations]="false" — register the noop runtime
    // so the dashboard renders without pulling in @angular/animations.
    provideNoopAnimations(),
    provideHttpClient(withFetch()),
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
    provideApollo((): ApolloClient.Options => {
      const httpLink = inject(HttpLink);
      const auth = inject(AuthService);
      return {
        cache: new InMemoryCache(),
        link: ApolloLink.from([
          createAuthMiddleware(auth),
          httpLink.create({ uri: environment.graphqlUrl }),
        ]),
        defaultOptions: {
          watchQuery: { fetchPolicy: 'cache-and-network', errorPolicy: 'all' },
          query: { fetchPolicy: 'network-only', errorPolicy: 'all' },
        },
      };
    }),
  ],
};
