import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import type { StatusData } from '../../types/dashboard';
import { dashboardTheme } from './theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 48;
const HORIZONTAL_CHART_CONTENT_WIDTH = CHART_WIDTH - 56;

/**
 * Order Status chart — design spec
 * • Legend instead of y-axis labels (legend below chart, same order as bars)
 * • Monochromatic blue palette (5 shades, dark → light)
 * • Values inside bars, minimal; no status text on bars
 * • Light/minimal gridlines; consistent spacing
 *
 * Blue palette (hex): #1a365d, #2c5282, #3182ce, #63b3ed, #90cdf4
 * Font hierarchy: title 15, total 12, value-in-bar 10, legend 11
 * Legend: below chart, horizontal wrap, color swatch + label (muted)
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

interface OrderStatusChartProps {
  data: StatusData[];
  loading?: boolean;
}

export function OrderStatusChart({ data, loading }: OrderStatusChartProps) {
  const { barData, legendItems } = useMemo(() => {
    const byStatus = new Map(data.map((d) => [d.status, d.count]));
    const sorted = STATUS_ORDER.map((status) => ({
      status,
      count: byStatus.get(status) ?? 0,
    })).filter((d) => d.count > 0);

    const cancelledColor = dashboardTheme.chartGrey;
    const bars = sorted.map((d) => {
      const isCancelled = d.status === 'cancelled';
      const color = isCancelled
        ? cancelledColor
        : ORDER_STATUS_BLUE_PALETTE[STATUS_ORDER.indexOf(d.status) % ORDER_STATUS_BLUE_PALETTE.length];
      return {
        value: d.count,
        label: ' ',
        frontColor: color,
        isCancelled,
      };
    });

    const legend = STATUS_ORDER.map((status) => ({
      status,
      label: status.replace(/_/g, ' '),
      color:
        status === 'cancelled'
          ? cancelledColor
          : ORDER_STATUS_BLUE_PALETTE[STATUS_ORDER.indexOf(status) % ORDER_STATUS_BLUE_PALETTE.length],
    }));

    return { barData: bars, legendItems: legend };
  }, [data]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Order Status</Text>
        <View style={[styles.placeholder, styles.skeleton]} />
      </View>
    );
  }

  if (!barData.length || barData.every((d) => d.value === 0)) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Order Status</Text>
        <View style={styles.placeholder}>
          <Text style={styles.emptyText}>No order data</Text>
        </View>
      </View>
    );
  }

  const total = barData.reduce((s, d) => s + d.value, 0);
  const maxVal = Math.max(...barData.map((d) => d.value), 1);

  const renderBarInner = (item: { value: number }, index: number) => {
    const count = barData[index]?.value ?? item.value;
    const isCancelled = barData[index]?.isCancelled ?? false;
    return (
      <View style={styles.barInnerWrap}>
        <Text
          numberOfLines={1}
          style={[styles.barInnerValue, isCancelled && styles.barInnerValueOnGrey]}
        >
          {count}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Order Status</Text>
        <Text style={styles.total}>Total: {total}</Text>
      </View>
      <View style={styles.chartWrap}>
        <View style={styles.chartInner}>
        <BarChart
          data={barData}
          horizontal
          width={HORIZONTAL_CHART_CONTENT_WIDTH}
          height={Math.max(160, barData.length * 40)}
          barWidth={22}
          spacing={24}
          initialSpacing={0}
          endSpacing={32}
          labelWidth={0}
          yAxisLabelWidth={0}
          disableScroll
          maxValue={maxVal * 1.15}
          noOfSections={4}
          xAxisThickness={0}
          yAxisThickness={0}
          hideRules
          showValuesAsTopLabel={false}
          barInnerComponent={renderBarInner}
          yAxisTextStyle={styles.axisLabelStraight}
          xAxisLabelTextStyle={styles.axisLabelStraight}
        />
        </View>
        <View style={styles.legend}>
          {legendItems.map((item) => (
            <View key={item.status} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={styles.legendText}>{item.label}</Text>
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
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: dashboardTheme.textPrimary,
  },
  total: {
    fontSize: 12,
    color: dashboardTheme.textSecondary,
  },
  chartWrap: {
    backgroundColor: dashboardTheme.cardBg,
    borderRadius: 12,
    paddingLeft: 0,
    paddingRight: 14,
    paddingTop: 12,
    paddingBottom: 12,
    borderWidth: 1,
    borderColor: dashboardTheme.border,
    overflow: 'hidden',
  },
  chartInner: {
    marginLeft: -12,
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
  axisLabel: { fontSize: 10, color: dashboardTheme.textSecondary },
  axisLabelStraight: {
    fontSize: 11,
    color: dashboardTheme.textSecondary,
  },
  barInnerWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 6,
  },
  barInnerValue: {
    fontSize: 8,
    color: '#fff',
    fontWeight: '600',
  },
  barInnerValueOnGrey: {
    color: '#1A1A1A',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 14,
    marginTop: 12,
    paddingHorizontal: 2,
    paddingBottom: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
