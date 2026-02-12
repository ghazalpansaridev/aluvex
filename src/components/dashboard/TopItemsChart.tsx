import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ItemData } from '../../types/dashboard';
import { dashboardTheme } from './theme';

interface TopItemsChartProps {
  data: ItemData[];
  loading?: boolean;
}

function formatCurrency(n: number): string {
  return `₹${Math.round(n).toLocaleString()}`;
}

export function TopItemsChart({ data, loading }: TopItemsChartProps) {
  const itemCards = useMemo(() => {
    const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
    const shades = [...dashboardTheme.chartBlueShades];
    
    return data.map((item, index) => {
      const percentage = totalRevenue > 0 ? Math.round((item.revenue / totalRevenue) * 100) : 0;
      const color = shades[index % shades.length] as string;
      
      return {
        name: item.name,
        revenue: item.revenue,
        percentage,
        color,
        image_url: item.image_url,
      };
    });
  }, [data]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Top Selling Items</Text>
        <View style={[styles.placeholder, styles.skeleton]} />
      </View>
    );
  }

  if (!data.length) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Top Selling Items</Text>
        <View style={styles.placeholder}>
          <Text style={styles.emptyText}>No sales data yet</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Top Selling Items</Text>
      
      <View style={styles.cardsContainer}>
        {itemCards.map((item, index) => (
          <View key={`${item.name}-${index}`} style={styles.itemCard}>
            <View style={styles.itemCardHeader}>
              <View style={styles.itemCardLeft}>
                <View style={[styles.iconContainer, { backgroundColor: item.image_url ? '#F7F6F4' : `${item.color}20` }]}>
                  {item.image_url ? (
                    <Image 
                      source={{ uri: item.image_url }} 
                      style={styles.productImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <Ionicons name="cube" size={20} color={item.color} />
                  )}
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.revenueLabel}>
                    Revenue: <Text style={styles.revenueValue}>{formatCurrency(item.revenue)}</Text>
                  </Text>
                </View>
              </View>
              <Text style={styles.revenueAmount}>{formatCurrency(item.revenue)}</Text>
            </View>
            
            <View style={styles.performanceContainer}>
              <Text style={styles.performanceLabel}>Performance: <Text style={styles.performanceValue}>{item.percentage}% of total</Text></Text>
              <View style={styles.progressBackground}>
                <View 
                  style={[
                    styles.progressBar, 
                    { width: `${item.percentage}%`, backgroundColor: item.color }
                  ]} 
                />
              </View>
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
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: dashboardTheme.textPrimary,
    marginBottom: 10,
  },
  cardsContainer: {
    gap: 8,
  },
  itemCard: {
    backgroundColor: dashboardTheme.cardBg,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: dashboardTheme.border,
  },
  itemCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: dashboardTheme.textPrimary,
    marginBottom: 3,
  },
  revenueLabel: {
    fontSize: 11,
    color: dashboardTheme.textSecondary,
  },
  revenueValue: {
    fontWeight: '600',
    color: dashboardTheme.textPrimary,
  },
  revenueAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: dashboardTheme.textPrimary,
  },
  performanceContainer: {
    gap: 5,
  },
  performanceLabel: {
    fontSize: 11,
    color: dashboardTheme.textSecondary,
  },
  performanceValue: {
    fontWeight: '600',
    color: dashboardTheme.textPrimary,
  },
  progressBackground: {
    height: 6,
    backgroundColor: dashboardTheme.placeholderBg,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
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
