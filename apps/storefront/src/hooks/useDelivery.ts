'use client';

import { useQuery } from '@tanstack/react-query';
import { gql, DEFAULT_DISPENSARY_ID } from '@/lib/graphql';

const DELIVERY_CHECK_QUERY = `
  query CheckDelivery($dispensaryId: ID!, $lat: Float!, $lng: Float!, $subtotal: Float) {
    checkDeliveryEligibility(dispensaryId: $dispensaryId, latitude: $lat, longitude: $lng, orderSubtotal: $subtotal) {
      eligible distance
      zone { name deliveryFee estimatedMinutesMin estimatedMinutesMax }
      reason
    }
  }
`;

const ZONES_QUERY = `
  query Zones($dispensaryId: ID!) {
    deliveryZones(dispensaryId: $dispensaryId) {
      zoneId name radiusMiles deliveryFee minOrderAmount freeDeliveryThreshold
    }
  }
`;

const SLOTS_QUERY = `
  query Slots($dispensaryId: ID!, $type: String!, $date: String!) {
    availableTimeSlots(dispensaryId: $dispensaryId, slotType: $type, date: $date) {
      slotId startTime endTime spotsRemaining
    }
  }
`;

export function useDeliveryCheck(lat?: number, lng?: number, subtotal?: number) {
  return useQuery({
    queryKey: ['deliveryCheck', lat, lng, subtotal],
    queryFn: () =>
      gql<{ checkDeliveryEligibility: any }>(DELIVERY_CHECK_QUERY, {
        dispensaryId: DEFAULT_DISPENSARY_ID, lat, lng, subtotal,
      }),
    select: (d) => d.checkDeliveryEligibility,
    enabled: !!lat && !!lng,
  });
}

export function useDeliveryZones() {
  return useQuery({
    queryKey: ['deliveryZones'],
    queryFn: () =>
      gql<{ deliveryZones: any[] }>(ZONES_QUERY, { dispensaryId: DEFAULT_DISPENSARY_ID }),
    select: (d) => d.deliveryZones,
  });
}

export function useTimeSlots(type: 'delivery' | 'pickup', date: string) {
  return useQuery({
    queryKey: ['timeSlots', type, date],
    queryFn: () =>
      gql<{ availableTimeSlots: any[] }>(SLOTS_QUERY, {
        dispensaryId: DEFAULT_DISPENSARY_ID, type, date,
      }),
    select: (d) => d.availableTimeSlots,
    enabled: !!date,
  });
}
