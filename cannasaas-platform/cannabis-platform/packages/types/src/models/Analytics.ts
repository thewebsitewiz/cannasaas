export type TimeRange = 'today' | '7d' | '30d' | '90d' | 'ytd' | 'custom';

export interface DailyRevenue {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  productId: string;
  name: string;
  revenue: number;
  quantity: number;
}

export interface AnalyticsDashboard {
  revenue: {
    total: number;
    change: number; // % vs previous period
    byDay: DailyRevenue[];
  };
  orders: {
    total: number;
    change: number;
  };
  customers: {
    total: number;
    new: number;
    returning: number;
  };
  avgOrderValue: {
    value: number;
    change: number;
  };
  topProducts: TopProduct[];
}
