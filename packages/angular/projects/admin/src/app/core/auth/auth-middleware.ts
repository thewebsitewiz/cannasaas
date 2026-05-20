import { HttpHeaders } from '@angular/common/http';
import { ApolloLink } from '@apollo/client';
import { AuthService } from './auth.service';

/**
 * Apollo link that attaches `Authorization: Bearer <token>` to every
 * outgoing GraphQL operation when the admin user is signed in. Reads
 * the token through the signal each request, so logout / re-login
 * lands on the next request without recreating the link.
 */
export function createAuthMiddleware(auth: AuthService): ApolloLink {
  return new ApolloLink((operation, forward) => {
    const token = auth.accessToken();
    if (token) {
      operation.setContext({
        headers: new HttpHeaders({ Authorization: `Bearer ${token}` }),
      });
    }
    return forward(operation);
  });
}
