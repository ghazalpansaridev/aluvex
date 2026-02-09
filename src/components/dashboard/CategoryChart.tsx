import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import type { CategoryData } from '../../types/dashboard';
import { dashboardTheme } from './theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 48;

interface CategoryChartProps {
  data: CategoryData[];
  loading?: boolean;
}

function formatCurrency(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
}

const BAR_COLORS = [...dashboardTheme.chartBlueShades];

export function CategoryChart({ data, loading }: CategoryChartProps) {
  const barData = useMemo(() => {
    return data.map((d, i) => ({
      value: d.revenue,
      label: '', // Hide default label
      frontColor: BAR_COLORS[i % BAR_COLORS.length] as string,
      topLabelComponent: () => (
        <View style={{ marginBottom: -50 }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: '#FFF' }}>
            {d.revenue.toLocaleString()}
          </Text>
        </View>
      ),
      labelComponent: () => (
        <View style={{ transform: [{ rotate: '-45deg' }], width: 60, marginLeft: -15 }}>
          <Text style={{ fontSize: 10, color: dashboardTheme.textSecondary, textAlign: 'left' }}>
            {d.name.length > 12 ? d.name.slice(0, 11) + '…' : d.name}
          </Text>
        </View>
      ),
    }));
  }, [data]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Category Performance</Text>
        <View style={[styles.placeholder, styles.skeleton]} />
      </View>
    );
  }

  if (!barData.length) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Category Performance</Text>
        <View style={styles.placeholder}>
          <Text style={styles.emptyText}>No category data yet</Text>
        </View>
      </View>
    );
  }

  const maxVal = Math.max(...barData.map((d) => d.value), 1);
  const n = barData.length;
  const initialSpacing = 20;
  const endSpacing = 20;
  const available = CHART_WIDTH - initialSpacing - endSpacing;
  const barWidth = Math.min(40, Math.floor((available - Math.max(0, n - 1) * 4) / n));
  const spacing = n > 1 ? (available - barWidth * n) / (n - 1) : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Category Performance</Text>
      <View style={styles.chartWrap}>
        <BarChart
          data={barData}
          width={CHART_WIDTH}
          height={200}
          barWidth={barWidth}
          spacing={spacing}
          initialSpacing={initialSpacing}
          endSpacing={endSpacing}
          disableScroll
          maxValue={maxVal * 1.05}
          noOfSections={4}
          xAxisThickness={0}
          yAxisThickness={0}
          yAxisTextStyle={{ fontSize: 10, color: dashboardTheme.textSecondary }}
          formatYLabel={(v) => formatCurrency(Number(v))}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: dashboardTheme.textPrimary,
    marginBottom: 12,
  },
  chartWrap: {
    backgroundColor: dashboardTheme.cardBg,
    borderRadius: 10,
    padding: 8,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: dashboardTheme.border,
  },
  placeholder: {
    height: 200,
    backgroundColor: dashboardTheme.placeholderBg,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeleton: { opacity: 0.7 },
  emptyText: { fontSize: 14, color: dashboardTheme.textMuted },
});
