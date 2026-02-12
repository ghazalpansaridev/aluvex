export interface DashboardMetrics {
  totalRevenue: number;
  totalOrders: number;
  activeRetailers: number;
  pendingApprovals: number;
  avgOrderValue: number;
  fulfillmentRate: number;
  cancellationRate: number;
  revenueGrowth: number;
}

export interface TrendData {
  date: string;
  value: number;
  /** Display label for x-axis (e.g. "Jan 2025", "Week 6 Jan", "2024") */
  label?: string;
}

export interface StatusData {
  status: string;
  count: number;
  revenue: number;
}

export interface ItemData {
  name: string;
  category: string;
  quantity: number;
  revenue: number;
  image_url?: string;
}

export interface CategoryData {
  name: string;
  revenue: number;
  orderCount: number;
}

export interface RetailerStats {
  approved: number;
  pending: number;
  rejected: number;
  total: number;
}
