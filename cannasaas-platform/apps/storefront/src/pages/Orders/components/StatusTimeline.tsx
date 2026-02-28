// apps/storefront/src/pages/Orders/components/StatusTimeline.tsx
import React from 'react';
import type { OrderStatus, FulfillmentType } from '@cannasaas/types';
import { cn } from '@cannasaas/utils';

interface StatusTimelineProps { currentStatus: OrderStatus; fulfillmentType: FulfillmentType; className?: string; }

const PICKUP_STEPS:   { status: OrderStatus; label: string }[] = [
  { status: 'pending',          label: 'Order Placed'    },
  { status: 'confirmed',        label: 'Confirmed'       },
  { status: 'preparing',        label: 'Preparing'       },
  { status: 'ready_for_pickup', label: 'Ready'           },
  { status: 'completed',        label: 'Picked Up'       },
];
const DELIVERY_STEPS: { status: OrderStatus; label: string }[] = [
  { status: 'pending',          label: 'Order Placed'    },
  { status: 'confirmed',        label: 'Confirmed'       },
  { status: 'preparing',        label: 'Preparing'       },
  { status: 'out_for_delivery', label: 'On the Way'      },
  { status: 'delivered',        label: 'Delivered'       },
];

export function StatusTimeline({ currentStatus, fulfillmentType, className }: StatusTimelineProps) {
  const steps = fulfillmentType === 'delivery' ? DELIVERY_STEPS : PICKUP_STEPS;
  const currentIndex = steps.findIndex((s) => s.status === currentStatus);
  return (
    <ol className={cn('flex items-start', className)} aria-label="Order status">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent   = index === currentIndex;
        return (
          <li key={step.status} className="flex items-center flex-1" aria-current={isCurrent ? 'step' : undefined}>
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={cn('w-4 h-4 rounded-full border-2',
                isCompleted ? 'bg-[var(--color-success)] border-[var(--color-success)]'
                : isCurrent ? 'bg-[var(--color-brand)] border-[var(--color-brand)]'
                : 'bg-transparent border-[var(--color-border)]'
              )} aria-label={`${step.label}: ${isCompleted ? 'completed' : isCurrent ? 'current' : 'upcoming'}`} />
              <span className={cn('text-[10px] mt-1 font-semibold text-center leading-tight max-w-[60px]',
                isCurrent ? 'text-[var(--color-brand)]'
                : isCompleted ? 'text-[var(--color-success)]'
                : 'text-[var(--color-text-disabled)]'
              )}>{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <div className={cn('flex-1 h-0.5 mx-1 -mt-4',
                isCompleted ? 'bg-[var(--color-success)]' : 'bg-[var(--color-border)]'
              )} aria-hidden="true" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
