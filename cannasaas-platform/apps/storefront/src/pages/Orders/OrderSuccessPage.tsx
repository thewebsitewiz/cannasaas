// apps/storefront/src/pages/Orders/OrderSuccessPage.tsx
import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { Button } from '@cannasaas/ui';

export default function OrderSuccessPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <CheckCircle className="w-16 h-16 text-[var(--color-success)] mx-auto mb-6" aria-hidden="true" />
      <h1 className="text-[var(--p-text-3xl)] font-bold text-[var(--color-text)] mb-3">Order Confirmed!</h1>
      <p className="text-[var(--color-text-secondary)] mb-8">Your order has been placed successfully.</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button variant="primary" as={Link} to={`/orders/${id}/track`}>Track Order</Button>
        <Button variant="outline" as={Link} to="/">Continue Shopping</Button>
      </div>
    </div>
  );
}
