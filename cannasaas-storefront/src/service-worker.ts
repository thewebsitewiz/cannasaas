// cannasaas-storefront/src/service-worker.ts
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

// Precache app shell
precacheAndRoute(self.__WB_MANIFEST);

// Cache product/category API responses (stale-while-revalidate, 5 min)
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/v1/products')
    || url.pathname.startsWith('/api/v1/categories'),
  new StaleWhileRevalidate({
    cacheName: 'api-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 300 })],
  })
);

// Cache images aggressively (cache-first, 7 days)
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'image-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 604800 })],
  })
);

// Network-first for cart and auth (always fresh)
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/v1/cart')
    || url.pathname.startsWith('/api/v1/auth'),
  new NetworkFirst({ cacheName: 'auth-cache' })
);
