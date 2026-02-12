import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { StatusData } from '../../types/dashboard';
import { dashboardTheme } from './theme';

/**
 * Order Status chart — card-based design
 * • Individual cards for each status with icon, count badge, percentage, and progress bar
 * • Monochromatic blue palette (5 shades, dark → light)
 * • Cancelled uses grey
 */
const STATUS_ORDER: string[] = [
  'cancelled',
  'placed',
  'processing',
  'shipped',
  'partially_shipped',
];

const ORDER_STATUS_BLUE_PALETTE = [
  '#1a365d', // darkest
  '#2c5282',
  '#3182ce',
  '#63b3ed',
  '#90cdf4', // lightest
] as const;

type StatusConfig = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  lightColor: string;
};

const STATUS_CONFIG: Record<string, StatusConfig> = {
  cancelled: {
    icon: 'close-circle',
    label: 'Cancelled',
    color: dashboardTheme.chartGrey,
    lightColor: '#E8E8E8',
  },
  placed: {
    icon: 'checkmark-circle',
    label: 'Placed',
    color: '#2c5282',
    lightColor: '#E3F2FD',
  },
  processing: {
    icon: 'settings',
    label: 'Processing',
    color: '#3182ce',
    lightColor: '#DBEAFE',
  },
  shipped: {
    icon: 'cube',
    label: 'Shipped',
    color: '#63b3ed',
    lightColor: '#BFDBFE',
  },
  partially_shipped: {
    icon: 'cube-outline',
    label: 'Partially Shipped',
    color: '#90cdf4',
    lightColor: '#DBEAFE',
  },
};

interface OrderStatusChartProps {
  data: StatusData[];
  loading?: boolean;
}

export function OrderStatusChart({ data, loading }: OrderStatusChartProps) {
  const statusItems = useMemo(() => {
    const byStatus = new Map(data.map((d) => [d.status, d.count]));
    const total = data.reduce((sum, d) => sum + d.count, 0);
    
    return STATUS_ORDER.map((status) => {
      const count = byStatus.get(status) ?? 0;
      const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
      const config = STATUS_CONFIG[status];
      
      return {
        status,
        count,
        percentage,
        ...config,
      };
    });
  }, [data]);

  const total = useMemo(() => data.reduce((sum, d) => sum + d.count, 0), [data]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Order Status</Text>
          <Text style={styles.total}>Total: 0</Text>
        </View>
        <View style={[styles.placeholder, styles.skeleton]} />
      </View>
    );
  }

  if (total === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Order Status</Text>
          <Text style={styles.total}>Total: 0</Text>
        </View>
        <View style={styles.placeholder}>
          <Text style={styles.emptyText}>No order data</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Order Status</Text>
        <Text style={styles.total}>Total: {total}</Text>
      </View>
      
      <View style={styles.cardsContainer}>
        {statusItems.map((item) => (
          <View key={item.status} style={styles.statusCard}>
            <View style={styles.statusCardHeader}>
              <View style={styles.statusCardLeft}>
                <View style={[styles.iconContainer, { backgroundColor: item.lightColor }]}>
                  <Ionicons name={item.icon} size={16} color={item.color} />
                </View>
                <Text style={styles.statusLabel}>{item.label}</Text>
              </View>
              <View style={[styles.countBadge, { backgroundColor: item.color }]}>
                <Text style={styles.countText}>{item.count}</Text>
              </View>
            </View>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressBackground}>
                <View 
                  style={[
                    styles.progressBar, 
                    { width: `${item.percentage}%`, backgroundColor: item.color }
                  ]} 
                />
              </View>
              <Text style={styles.percentageText}>{item.percentage}%</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: dashboardTheme.textPrimary,
  },
  total: {
    fontSize: 11,
    color: dashboardTheme.textSecondary,
  },
  cardsContainer: {
    gap: 8,
  },
  statusCard: {
    backgroundColor: dashboardTheme.cardBg,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: dashboardTheme.border,
  },
  statusCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: dashboardTheme.textPrimary,
  },
  countBadge: {
    minWidth: 32,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBackground: {
    flex: 1,
    height: 6,
    backgroundColor: dashboardTheme.placeholderBg,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  percentageText: {
    fontSize: 11,
    fontWeight: '600',
    color: dashboardTheme.textSecondary,
    minWidth: 28,
    textAlign: 'right',
  },
  placeholder: {
    height: 200,
    backgroundColor: dashboardTheme.placeholderBg,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeleton: { 
    opacity: 0.7,
  },
  emptyText: { 
    fontSize: 14, 
    color: dashboardTheme.textMuted,
  },
});
