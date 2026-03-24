import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up
    { duration: '1m', target: 50 },   // Sustained load
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests < 500ms
    http_req_failed: ['rate<0.01'],    // <1% failure rate
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3000';

export default function () {
  // Health check
  const health = http.get(`${BASE_URL}/health`);
  check(health, { 'health ok': (r) => r.status === 200 });

  // GraphQL products query
  const productsRes = http.post(`${BASE_URL}/graphql`, JSON.stringify({
    query: '{ products(dispensaryId: "c0000000-0000-0000-0000-000000000001", limit: 10) { productId name } }',
  }), { headers: { 'Content-Type': 'application/json' } });
  check(productsRes, { 'products ok': (r) => r.status === 200 });

  sleep(1);
}
