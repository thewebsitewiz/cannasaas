import { ApplicationConfig, inject, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideApollo } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { ApolloClient, InMemoryCache } from '@apollo/client';

import { routes } from './app.routes';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withFetch()),
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
    provideApollo((): ApolloClient.Options => {
      const httpLink = inject(HttpLink);
      return {
        cache: new InMemoryCache(),
        link: httpLink.create({ uri: environment.graphqlUrl }),
        defaultOptions: {
          watchQuery: { fetchPolicy: 'cache-and-network', errorPolicy: 'all' },
          query: { fetchPolicy: 'network-only', errorPolicy: 'all' },
        },
      };
    }),
  ],
};
