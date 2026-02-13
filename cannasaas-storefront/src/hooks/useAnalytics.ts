// cannasaas-storefront/src/hooks/useAnalytics.ts
import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { nanoid } from 'nanoid';

const SESSION_KEY = 'cs_session_id';
function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) { id = nanoid(); sessionStorage.setItem(SESSION_KEY, id); }
  return id;
}

export function useAnalytics() {
  const location = useLocation();
  const sessionId = useRef(getSessionId());

  const track = useCallback((eventType: string, data?: Record<string, any>) => {
    fetch('/api/v1/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType, sessionId: sessionId.current, data,
        context: { url: window.location.href, referrer: document.referrer },
      }),
    }).catch(() => {}); // Fire-and-forget
  }, []);

  useEffect(() => {
    track('page_view', { path: location.pathname });
  }, [location.pathname, track]);

  return {
    track,
    trackProductView: (id: string, name: string) =>
      track('product_view', { productId: id, productName: name }),
    trackAddToCart: (productId: string, qty: number, price: number) =>
      track('add_to_cart', { productId, quantity: qty, price }),
    trackPurchase: (orderId: string, total: number, items: number) =>
      track('purchase', { orderId, total, itemCount: items }),
    trackSearch: (query: string, results: number) =>
      track('search', { query, resultCount: results }),
  };
}
