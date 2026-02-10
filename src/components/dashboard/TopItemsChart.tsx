import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import type { ItemData } from '../../types/dashboard';
import { dashboardTheme } from './theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 48;
const HORIZONTAL_CHART_CONTENT_WIDTH = CHART_WIDTH - 56;

interface TopItemsChartProps {
  data: ItemData[];
  loading?: boolean;
}

function formatCurrency(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
}

/** Short label for inside bar (no ₹, k style) */
function formatBarValue(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function TopItemsChart({ data, loading }: TopItemsChartProps) {
  const { barData, legendItems } = useMemo(() => {
    const shades = [...dashboardTheme.chartBlueShades];
    const bars = data.map((d, i) => ({
      value: d.revenue,
      label: ' ',
      frontColor: shades[i % shades.length] as string,
      barInnerComponent: () => (
        <View style={styles.barInnerWrap}>
          <Text numberOfLines={1} style={styles.barInnerValue}>
            {formatBarValue(d.revenue)}
          </Text>
        </View>
      ),
    }));
    const legend = data.map((d, i) => ({
      name: d.name,
      color: shades[i % shades.length] as string,
    }));
    return { barData: bars, legendItems: legend };
  }, [data]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Top Selling Items</Text>
        <View style={[styles.placeholder, styles.skeleton]} />
      </View>
    );
  }

  if (!barData.length) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Top Selling Items</Text>
        <View style={styles.placeholder}>
          <Text style={styles.emptyText}>No sales data yet</Text>
        </View>
      </View>
    );
  }

  const maxVal = Math.max(...barData.map((d) => d.value), 1);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Top Selling Items</Text>
      <View style={styles.chartWrap}>
        <BarChart
          data={barData}
          horizontal
          width={HORIZONTAL_CHART_CONTENT_WIDTH}
          height={220}
          barWidth={28}
          spacing={32}
          initialSpacing={4}
          endSpacing={48}
          labelWidth={8}
          disableScroll
          maxValue={maxVal * 1.25}
          noOfSections={4}
          xAxisThickness={0}
          yAxisThickness={0}
          yAxisTextStyle={styles.axisLabel}
          xAxisLabelTextStyle={styles.axisLabel}
          formatXLabel={(v) => formatCurrency(Number(v))}
          showValuesAsTopLabel={false}
        />
        <View style={styles.axisHintRow}>
          <Text style={styles.axisHint}>Revenue →</Text>
        </View>
        <View style={styles.legend}>
          {legendItems.map((item, i) => (
            <View key={`${item.name}-${i}`} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={styles.legendText} numberOfLines={1}>
                {item.name}
              </Text>
            </View>
          ))}
        </View>
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
    borderRadius: 12,
    padding: 12,
    paddingRight: 16,
    borderWidth: 1,
    borderColor: dashboardTheme.border,
    overflow: 'hidden',
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
  axisLabel: {
    fontSize: 11,
    color: dashboardTheme.textSecondary,
  },
  axisHintRow: {
    marginTop: 4,
    paddingHorizontal: 2,
  },
  axisHint: {
    fontSize: 10,
    color: dashboardTheme.textMuted,
  },
  barInnerWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  barInnerValue: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    paddingHorizontal: 2,
    paddingBottom: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '48%',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    color: dashboardTheme.textSecondary,
  },
});
