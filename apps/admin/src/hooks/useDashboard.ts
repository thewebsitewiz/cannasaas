import { useQuery } from '@tanstack/react-query';
import { gqlRequest } from '../lib/graphql-client';
import { useAuthStore } from '../stores/auth.store';

const DASHBOARD_QUERY = `
  query Dashboard($dispensaryId: ID, $days: Int) {
    dashboard(dispensaryId: $dispensaryId, days: $days) {
      sales { totalRevenue totalOrders averageOrderValue totalTax completedOrders pendingOrders cancelledOrders }
      salesTrend { period revenue orders averageOrderValue }
      topProducts { productId productName strainType unitsSold revenue }
      categoryBreakdown { category productCount unitsSold revenue }
      inventory { totalVariants totalUnitsOnHand totalUnitsAvailable estimatedInventoryValue lowStockCount outOfStockCount }
      lowStockItems { variantId productName variantName quantityOnHand quantityAvailable }
      metrcSync { totalSyncs successCount failedCount pendingCount successRate ordersAwaitingSync lastSyncAt }
      compliance { totalProducts compliantProducts missingUid missingCategory missingPackageLabel compliancePercent }
    }
  }
`;

export function useDashboard(days = 30) {
  const dispensaryId = useAuthStore((s) => s.user?.dispensaryId);

  return useQuery({
    queryKey: ['dashboard', dispensaryId, days],
    queryFn: () => gqlRequest<{ dashboard: any }>(DASHBOARD_QUERY, { dispensaryId, days }),
    select: (data) => data.dashboard,
    enabled: !!dispensaryId,
  });
}
