import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { CategoryData } from '../../types/dashboard';
import { dashboardTheme } from './theme';

interface CategoryChartProps {
  data: CategoryData[];
  loading?: boolean;
}

function formatCurrency(n: number): string {
  return `₹${Math.round(n).toLocaleString()}`;
}

const CARD_COLORS = [...dashboardTheme.chartBlueShades];

export function CategoryChart({ data, loading }: CategoryChartProps) {
  const categoryCards = useMemo(() => {
    const totalRevenue = data.reduce((sum, cat) => sum + cat.revenue, 0);
    
    return data.map((cat, index) => {
      const percentage = totalRevenue > 0 ? ((cat.revenue / totalRevenue) * 100).toFixed(1) : '0';
      const color = CARD_COLORS[index % CARD_COLORS.length] as string;
      
      return {
        name: cat.name,
        revenue: cat.revenue,
        percentage,
        color,
      };
    });
  }, [data]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Category Performance</Text>
        <View style={[styles.placeholder, styles.skeleton]} />
      </View>
    );
  }

  if (!data.length) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Category Performance</Text>
        <View style={styles.placeholder}>
          <Text style={styles.emptyText}>No category data yet</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Category Performance</Text>
      
      <View style={styles.gridContainer}>
        {categoryCards.map((cat, index) => (
          <View key={`${cat.name}-${index}`} style={styles.categoryCard}>
            <Text style={styles.categoryName} numberOfLines={1}>{cat.name}</Text>
            
            <Text style={styles.revenueAmount}>{formatCurrency(cat.revenue)}</Text>
            
            <Text style={styles.percentageText}>{cat.percentage}% of total</Text>
            
            <View style={styles.progressBackground}>
              <View 
                style={[
                  styles.progressBar, 
                  { width: `${cat.percentage}%`, backgroundColor: cat.color }
                ]} 
              />
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
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryCard: {
    width: '48.5%',
    backgroundColor: dashboardTheme.cardBg,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: dashboardTheme.border,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
    color: dashboardTheme.textPrimary,
    marginBottom: 6,
  },
  revenueAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: dashboardTheme.textPrimary,
    marginBottom: 5,
  },
  percentageText: {
    fontSize: 11,
    color: dashboardTheme.textSecondary,
    marginBottom: 6,
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
    borderRadius: 10,
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
