import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {
  MetricCard,
  RevenueChart,
  OrderVolumeChart,
  OrderStatusChart,
  TopItemsChart,
  CategoryChart,
  dashboardTheme,
} from '../../components/dashboard';
import { LoadingSpinner, Select } from '../../components/ui';
import {
  getKeyMetrics,
  getRevenueTrend,
  getOrderTrend,
  getOrderStatusBreakdown,
  getTopSellingItems,
  getCategoryPerformance,
} from '../../lib/dashboard.api';
import type {
  DashboardMetrics,
  TrendData,
  StatusData,
  ItemData,
  CategoryData,
} from '../../types/dashboard';

export type TrendPeriod = 'weekly' | 'monthly' | 'yearly';

const TREND_PERIOD_OPTIONS: { value: TrendPeriod; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

function formatRevenue(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
}

export default function AdminDashboardScreen() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [revenueTrend, setRevenueTrend] = useState<TrendData[]>([]);
  const [orderTrend, setOrderTrend] = useState<TrendData[]>([]);
  const [orderStatus, setOrderStatus] = useState<StatusData[]>([]);
  const [topItems, setTopItems] = useState<ItemData[]>([]);
  const [categoryPerf, setCategoryPerf] = useState<CategoryData[]>([]);

  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>('monthly');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    try {
      setError(null);
      const [
        metricsRes,
        revenueRes,
        orderRes,
        statusRes,
        itemsRes,
        categoryRes,
      ] = await Promise.all([
        getKeyMetrics(),
        getRevenueTrend(trendPeriod),
        getOrderTrend(trendPeriod),
        getOrderStatusBreakdown(),
        getTopSellingItems(5),
        getCategoryPerformance(),
      ]);
      setMetrics(metricsRes);
      setRevenueTrend(revenueRes);
      setOrderTrend(orderRes);
      setOrderStatus(statusRes);
      setTopItems(itemsRes);
      setCategoryPerf(categoryRes);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [trendPeriod]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAll();
  }, [loadAll]);

  if (loading && !metrics) {
    return <LoadingSpinner fullScreen />;
  }

  if (error && !metrics) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadAll}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={dashboardTheme.textPrimary} />
      }
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Dashboard</Text>

      <View style={styles.cardsRow}>
        <MetricCard
          label="Total Revenue"
          value={metrics ? formatRevenue(metrics.totalRevenue) : '₹0'}
          accentColor={dashboardTheme.chartBluePrimary}
        />
        <MetricCard
          label="Total Orders"
          value={metrics?.totalOrders ?? 0}
          accentColor={dashboardTheme.chartBluePrimary}
        />
      </View>
      <View style={styles.cardsRow}>
        <MetricCard
          label="Active Retailers"
          value={metrics?.activeRetailers ?? 0}
          accentColor={dashboardTheme.chartBluePrimary}
        />
        <MetricCard
          label="Pending Approvals"
          value={metrics?.pendingApprovals ?? 0}
          accentColor={dashboardTheme.chartBluePrimary}
        />
      </View>

      {metrics && (
        <View style={styles.extraMetrics}>
          <Text style={styles.extraLabel}>
            Avg order: {formatRevenue(metrics.avgOrderValue)} · Fulfillment:{' '}
            {metrics.fulfillmentRate}% · Cancel: {metrics.cancellationRate}%
            {metrics.revenueGrowth !== 0 && ` · Growth: ${metrics.revenueGrowth}%`}
          </Text>
        </View>
      )}

      <View style={styles.trendSection}>
        <Text style={styles.trendSectionTitle}>Trends</Text>
        <View style={styles.trendDropdownWrap}>
          <Select
            placeholder="Select period"
            value={trendPeriod}
            options={TREND_PERIOD_OPTIONS}
            onChange={(value) => setTrendPeriod(value as TrendPeriod)}
            compact
          />
        </View>
      </View>

      <RevenueChart data={revenueTrend} loading={loading} periodLabel={TREND_PERIOD_OPTIONS.find((o) => o.value === trendPeriod)?.label} />
      <OrderVolumeChart data={orderTrend} loading={loading} periodLabel={TREND_PERIOD_OPTIONS.find((o) => o.value === trendPeriod)?.label} />
      <OrderStatusChart data={orderStatus} loading={loading} />
      <TopItemsChart data={topItems} loading={loading} />
      <CategoryChart data={categoryPerf} loading={loading} />

      <View style={styles.bottomPad} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: dashboardTheme.pageBg,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: dashboardTheme.textPrimary,
    marginBottom: 20,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  extraMetrics: {
    marginBottom: 20,
  },
  extraLabel: {
    fontSize: 12,
    color: dashboardTheme.textSecondary,
  },
  trendSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  trendSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: dashboardTheme.textPrimary,
  },
  trendDropdownWrap: {
    minWidth: 120,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: dashboardTheme.pageBg,
  },
  errorText: {
    fontSize: 16,
    color: dashboardTheme.negative,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: dashboardTheme.activeBg,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: dashboardTheme.activeText,
    fontSize: 16,
    fontWeight: '600',
  },
  bottomPad: {
    height: 24,
  },
});
