import { supabase } from './supabase';
import {
  startOfWeek,
  startOfMonth,
  format,
  subWeeks,
  subMonths,
  subYears,
  startOfYear,
  addMonths,
} from 'date-fns';
import type {
  DashboardMetrics,
  TrendData,
  StatusData,
  ItemData,
  CategoryData,
  RetailerStats,
} from '../types/dashboard';

export type TrendPeriod = 'weekly' | 'monthly' | 'yearly';

/**
 * Key metrics for top KPI cards
 */
export async function getKeyMetrics(): Promise<DashboardMetrics> {
  const [ordersRes, retailersRes, ordersByStatusRes] = await Promise.all([
    supabase
      .from('orders')
      .select('grand_total, status')
      .in('status', ['placed', 'processing', 'partially_shipped', 'shipped']),
    supabase.from('retailers').select('status'),
    supabase.from('orders').select('status'),
  ]);

  const orders = ordersRes.data ?? [];
  const allOrders = ordersByStatusRes.data ?? [];
  const retailers = retailersRes.data ?? [];

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.grand_total ?? 0), 0);
  const totalOrders = orders.length;
  const totalAllOrders = allOrders.length;

  const approved = retailers.filter((r) => r.status === 'approved').length;
  const pending = retailers.filter((r) => r.status === 'pending').length;

  const shippedCount = allOrders.filter(
    (o) => o.status === 'shipped' || o.status === 'partially_shipped'
  ).length;
  const cancelledCount = allOrders.filter((o) => o.status === 'cancelled').length;

  const fulfillmentRate =
    totalAllOrders > 0 ? Math.round((shippedCount / totalAllOrders) * 100) : 0;
  const cancellationRate =
    totalAllOrders > 0 ? Math.round((cancelledCount / totalAllOrders) * 100) : 0;
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  // Revenue growth: compare last 15 days vs previous 15 days
  const now = new Date();
  const fifteenDaysAgo = new Date(now);
  fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: recentOrders } = await supabase
    .from('orders')
    .select('grand_total')
    .in('status', ['placed', 'processing', 'partially_shipped', 'shipped'])
    .gte('created_at', fifteenDaysAgo.toISOString())
    .lt('created_at', now.toISOString());

  const { data: previousOrders } = await supabase
    .from('orders')
    .select('grand_total')
    .in('status', ['placed', 'processing', 'partially_shipped', 'shipped'])
    .gte('created_at', thirtyDaysAgo.toISOString())
    .lt('created_at', fifteenDaysAgo.toISOString());

  const recentRevenue = recentOrders?.reduce((s, o) => s + Number(o.grand_total ?? 0), 0) ?? 0;
  const previousRevenue =
    previousOrders?.reduce((s, o) => s + Number(o.grand_total ?? 0), 0) ?? 0;
  const revenueGrowth =
    previousRevenue > 0
      ? Math.round(((recentRevenue - previousRevenue) / previousRevenue) * 100)
      : recentRevenue > 0 ? 100 : 0;

  return {
    totalRevenue,
    totalOrders,
    activeRetailers: approved,
    pendingApprovals: pending,
    avgOrderValue,
    fulfillmentRate,
    cancellationRate,
    revenueGrowth,
  };
}

/**
 * Revenue trend aggregated by period: weekly (current + 4 weeks), monthly (current + 6 months), yearly (e.g. 2022–2026)
 */
export async function getRevenueTrend(period: TrendPeriod): Promise<TrendData[]> {
  const now = new Date();
  const buckets: { key: string; label: string; sortKey: string }[] = [];

  if (period === 'weekly') {
    // Current week + last 4 weeks = 5 buckets (Monday start)
    for (let i = 4; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
      buckets.push({
        key: weekStart.toISOString().slice(0, 10),
        label: format(weekStart, 'd MMM'),
        sortKey: weekStart.toISOString(),
      });
    }
  } else if (period === 'monthly') {
    // From last year Dec through current month only
    const decLastYear = startOfMonth(new Date(now.getFullYear() - 1, 11, 1));
    const currentMonthStart = startOfMonth(now);
    let monthStart = decLastYear;
    while (monthStart <= currentMonthStart) {
      buckets.push({
        key: format(monthStart, 'yyyy-MM'),
        label: format(monthStart, "MMM''yy"),
        sortKey: monthStart.toISOString(),
      });
      monthStart = addMonths(monthStart, 1);
    }
  } else {
    // Yearly: current year only (e.g. 2026 → 1 bar)
    const currentYear = now.getFullYear();
    buckets.push({
      key: String(currentYear),
      label: String(currentYear),
      sortKey: String(currentYear),
    });
  }

  const fromDate =
    period === 'yearly'
      ? startOfYear(now).toISOString()
      : period === 'monthly'
        ? startOfMonth(new Date(now.getFullYear() - 1, 11, 1)).toISOString()
        : startOfWeek(subWeeks(now, 4), { weekStartsOn: 1 }).toISOString();

  const { data, error } = await supabase
    .from('orders')
    .select('created_at, grand_total')
    .neq('status', 'cancelled')
    .gte('created_at', fromDate);

  if (error) throw error;

  const agg: Record<string, number> = {};
  buckets.forEach((b) => (agg[b.key] = 0));

  for (const row of data ?? []) {
    const d = new Date(row.created_at);
    let key: string;
    if (period === 'weekly') {
      const weekStart = startOfWeek(d, { weekStartsOn: 1 });
      key = weekStart.toISOString().slice(0, 10);
    } else if (period === 'monthly') {
      key = format(startOfMonth(d), 'yyyy-MM');
    } else {
      key = String(d.getFullYear());
    }
    if (agg[key] !== undefined) agg[key] += Number(row.grand_total ?? 0);
  }

  return buckets.map((b) => ({
    date: b.sortKey,
    value: agg[b.key] ?? 0,
    label: b.label,
  }));
}

/**
 * Order count trend aggregated by period (same buckets as revenue)
 */
export async function getOrderTrend(period: TrendPeriod): Promise<TrendData[]> {
  const now = new Date();
  const buckets: { key: string; label: string; sortKey: string }[] = [];

  if (period === 'weekly') {
    for (let i = 4; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
      buckets.push({
        key: weekStart.toISOString().slice(0, 10),
        label: format(weekStart, 'd MMM'),
        sortKey: weekStart.toISOString(),
      });
    }
  } else if (period === 'monthly') {
    const decLastYear = startOfMonth(new Date(now.getFullYear() - 1, 11, 1));
    const currentMonthStart = startOfMonth(now);
    let monthStart = decLastYear;
    while (monthStart <= currentMonthStart) {
      buckets.push({
        key: format(monthStart, 'yyyy-MM'),
        label: format(monthStart, "MMM''yy"),
        sortKey: monthStart.toISOString(),
      });
      monthStart = addMonths(monthStart, 1);
    }
  } else {
    const currentYear = now.getFullYear();
    buckets.push({
      key: String(currentYear),
      label: String(currentYear),
      sortKey: String(currentYear),
    });
  }

  const fromDate =
    period === 'yearly'
      ? startOfYear(now).toISOString()
      : period === 'monthly'
        ? startOfMonth(new Date(now.getFullYear() - 1, 11, 1)).toISOString()
        : startOfWeek(subWeeks(now, 4), { weekStartsOn: 1 }).toISOString();

  const { data, error } = await supabase
    .from('orders')
    .select('created_at')
    .neq('status', 'cancelled')
    .gte('created_at', fromDate);

  if (error) throw error;

  const agg: Record<string, number> = {};
  buckets.forEach((b) => (agg[b.key] = 0));

  for (const row of data ?? []) {
    const d = new Date(row.created_at);
    let key: string;
    if (period === 'weekly') {
      const weekStart = startOfWeek(d, { weekStartsOn: 1 });
      key = weekStart.toISOString().slice(0, 10);
    } else if (period === 'monthly') {
      key = format(startOfMonth(d), 'yyyy-MM');
    } else {
      key = String(d.getFullYear());
    }
    if (agg[key] !== undefined) agg[key] += 1;
  }

  return buckets.map((b) => ({
    date: b.sortKey,
    value: agg[b.key] ?? 0,
    label: b.label,
  }));
}

/**
 * Order count and revenue by status (for donut chart)
 */
export async function getOrderStatusBreakdown(): Promise<StatusData[]> {
  const { data, error } = await supabase.from('orders').select('status, grand_total');

  if (error) throw error;

  const byStatus: Record<string, { count: number; revenue: number }> = {};
  for (const row of data ?? []) {
    const s = row.status ?? 'unknown';
    if (!byStatus[s]) byStatus[s] = { count: 0, revenue: 0 };
    byStatus[s].count += 1;
    byStatus[s].revenue += Number(row.grand_total ?? 0);
  }

  return Object.entries(byStatus).map(([status, { count, revenue }]) => ({
    status,
    count,
    revenue,
  }));
}

/**
 * Top selling items by revenue (for horizontal bar chart)
 */
export async function getTopSellingItems(limit: number): Promise<ItemData[]> {
  const { data: validOrders, error: ordError } = await supabase
    .from('orders')
    .select('id')
    .neq('status', 'cancelled');

  if (ordError) throw ordError;
  const validOrderIds = new Set((validOrders ?? []).map((o) => o.id));
  if (validOrderIds.size === 0) return [];

  const { data: orderItems, error: oiError } = await supabase
    .from('order_items')
    .select('order_id, item_id, quantity, line_total');

  if (oiError) throw oiError;

  const filtered = (orderItems ?? []).filter((oi) => validOrderIds.has(oi.order_id));
  const itemIds = [...new Set(filtered.map((oi) => oi.item_id))];
  if (itemIds.length === 0) return [];

  const { data: items, error: itemsError } = await supabase
    .from('items')
    .select('id, name, category_id')
    .in('id', itemIds);

  if (itemsError) throw itemsError;

  const categoryIds = [...new Set((items ?? []).map((i) => i.category_id))];
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .in('id', categoryIds);
  const categoryMap = new Map((categories ?? []).map((c) => [c.id, c.name]));
  const itemMap = new Map((items ?? []).map((i) => [i.id, i]));

  const agg: Record<
    string,
    { name: string; category: string; quantity: number; revenue: number }
  > = {};

  for (const oi of filtered) {
    const item = itemMap.get(oi.item_id);
    if (!item) continue;
    const key = item.id;
    if (!agg[key]) {
      agg[key] = {
        name: item.name,
        category: categoryMap.get(item.category_id) ?? 'Other',
        quantity: 0,
        revenue: 0,
      };
    }
    agg[key].quantity += oi.quantity ?? 0;
    agg[key].revenue += Number(oi.line_total ?? 0);
  }

  return Object.values(agg)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)
    .map((o) => ({ name: o.name, category: o.category, quantity: o.quantity, revenue: o.revenue }));
}

/**
 * Revenue and order count by category (for vertical bar chart)
 */
export async function getCategoryPerformance(): Promise<CategoryData[]> {
  const { data: validOrders, error: ordError } = await supabase
    .from('orders')
    .select('id')
    .neq('status', 'cancelled');

  if (ordError) throw ordError;
  const validOrderIds = new Set((validOrders ?? []).map((o) => o.id));
  if (validOrderIds.size === 0) return [];

  const { data: orderItems, error: oiError } = await supabase
    .from('order_items')
    .select('order_id, item_id, line_total');

  if (oiError) throw oiError;

  const filtered = (orderItems ?? []).filter((oi) => validOrderIds.has(oi.order_id));
  const itemIds = [...new Set(filtered.map((oi) => oi.item_id))];
  if (itemIds.length === 0) return [];

  const { data: items } = await supabase
    .from('items')
    .select('id, category_id')
    .in('id', itemIds);

  const categoryIds = [...new Set((items ?? []).map((i) => i.category_id))];
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .in('id', categoryIds);
  const categoryMap = new Map((categories ?? []).map((c) => [c.id, c.name]));
  const itemToCategory = new Map((items ?? []).map((i) => [i.id, i.category_id]));

  const agg: Record<string, { revenue: number; orderCount: number }> = {};
  const orderCountByCategory: Record<string, Set<string>> = {};

  for (const oi of filtered) {
    const catId = itemToCategory.get(oi.item_id);
    if (!catId) continue;
    const name = categoryMap.get(catId) ?? 'Other';
    if (!agg[name]) {
      agg[name] = { revenue: 0, orderCount: 0 };
      orderCountByCategory[name] = new Set();
    }
    agg[name].revenue += Number(oi.line_total ?? 0);
    orderCountByCategory[name].add(oi.order_id);
  }

  return Object.entries(agg).map(([name, { revenue }]) => ({
    name,
    revenue,
    orderCount: orderCountByCategory[name]?.size ?? 0,
  }));
}

/**
 * Retailer counts by status (for pie chart)
 */
export async function getRetailerStats(): Promise<RetailerStats> {
  const { data, error } = await supabase.from('retailers').select('status');

  if (error) throw error;

  const approved = (data ?? []).filter((r) => r.status === 'approved').length;
  const pending = (data ?? []).filter((r) => r.status === 'pending').length;
  const rejected = (data ?? []).filter((r) => r.status === 'rejected').length;

  return {
    approved,
    pending,
    rejected,
    total: (data ?? []).length,
  };
}