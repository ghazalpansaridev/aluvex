import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import type { TrendData } from '../../types/dashboard';
import { dashboardTheme } from './theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 48;
// Keep chart content inside the box (wrap has padding; reserve right margin for last bar/labels)
const CHART_CONTENT_WIDTH = CHART_WIDTH - 24;

const CHART_BLUE = dashboardTheme.chartBluePrimary;
const LINE_AMBER = dashboardTheme.chartAmber;
const LINE_DARK_BLUE = dashboardTheme.chartBlueDark;

interface RevenueChartProps {
  data: TrendData[];
  loading?: boolean;
  periodLabel?: string;
}

function formatCurrency(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
}

/** Compact label for inside bar: no rupee, k view e.g. 12.7k, 27k */
function formatBarLabel(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}m`;
  if (n >= 1000) {
    const k = n / 1000;
    return k % 1 === 0 ? `${k}k` : `${k.toFixed(1)}k`;
  }
  return String(n);
}

// Scale % to bar range so line fits same axis (0–100% → 0–maxBar)
function scalePctToBarRange(pct: number, maxBar: number): number {
  const clamped = Math.max(-50, Math.min(150, pct));
  return (clamped / 100) * maxBar;
}

export function RevenueChart({ data, loading, periodLabel }: RevenueChartProps) {
  const maxVal = useMemo(() => Math.max(...data.map((d) => d.value), 1), [data]);
  const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data]);

  const barData = useMemo(() => {
    return data.map((d) => ({
      value: d.value,
      label: d.label ?? d.date.slice(0, 10),
      frontColor: CHART_BLUE,
    }));
  }, [data]);

  const chartMax = maxVal * 1.15;
  // Cap orange line at 78% of chart height so data point labels/circles stay inside the box
  const lineMaxY = chartMax * 0.78;
  const lineDataPctChange = useMemo(() => {
    return data.map((d, i) => {
      const prev = i > 0 ? data[i - 1].value : 0;
      const pct = prev > 0 ? Math.round(((d.value - prev) / prev) * 100) : 0;
      const scaled = scalePctToBarRange(pct, maxVal);
      const sign = pct > 0 ? '+' : '';
      const value = Math.max(0, Math.min(lineMaxY, scaled));
      return { value, dataPointText: `${sign}${pct}%` };
    });
  }, [data, maxVal, lineMaxY]);

  const lineDataPctOfTotal = useMemo(() => {
    if (total <= 0) return data.map(() => ({ value: 0, dataPointText: '0%' }));
    return data.map((d) => {
      const pct = Math.round((d.value / total) * 100);
      const scaled = Math.min(chartMax, (pct / 100) * maxVal);
      return { value: scaled, dataPointText: `${pct}%` };
    });
  }, [data, total, maxVal, chartMax]);

  const title = periodLabel ? `Revenue Trend (${periodLabel})` : 'Revenue Trend';

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <View style={[styles.chartPlaceholder, styles.skeleton]} />
      </View>
    );
  }

  if (!barData.length || barData.every((d) => d.value === 0)) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.chartPlaceholder}>
          <Text style={styles.emptyText}>No revenue data for this period</Text>
        </View>
      </View>
    );
  }

  const n = barData.length;
  const initialSpacing = 10;
  const endSpacing = 14;
  const available = CHART_CONTENT_WIDTH - initialSpacing - endSpacing;
  const barWidth = Math.min(26, Math.floor((available - Math.max(0, n - 1) * 2) / n));
  const spacing = n > 1 ? (available - barWidth * n) / (n - 1) : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.chartWrap}>
        <BarChart
          data={barData}
          width={CHART_CONTENT_WIDTH}
          height={200}
          barWidth={barWidth}
          spacing={spacing}
          initialSpacing={initialSpacing}
          endSpacing={endSpacing}
          disableScroll
          maxValue={chartMax}
          noOfSections={4}
          xAxisLabelTextStyle={{ fontSize: 10, color: dashboardTheme.textSecondary }}
          yAxisTextStyle={{ fontSize: 10, color: dashboardTheme.textSecondary }}
          formatYLabel={(v) => formatCurrency(Number(v))}
          showValuesAsTopLabel={false}
          barInnerComponent={(item: { value: number }) => (
            <View style={styles.barInnerLabel}>
              <Text
                style={styles.barInnerLabelText}
                numberOfLines={1}
                allowFontScaling={false}
                adjustsFontSizeToFit
                minimumFontScale={0.5}
              >
                {formatBarLabel(item.value)}
              </Text>
            </View>
          )}
          rotateLabel
          labelsExtraHeight={24}
          showLine
          lineData={lineDataPctChange}
          lineConfig={{
            color: LINE_AMBER,
            thickness: 2,
            hideDataPoints: false,
            dataPointsColor: LINE_AMBER,
            dataPointsRadius: 3,
            textColor: dashboardTheme.textPrimary,
            textFontSize: 8,
            textShiftY: 8,
          }}
          lineData2={lineDataPctOfTotal}
          lineConfig2={{
            color: LINE_DARK_BLUE,
            thickness: 2,
            hideDataPoints: false,
            dataPointsColor: LINE_DARK_BLUE,
            dataPointsRadius: 3,
            textColor: dashboardTheme.textPrimary,
            textFontSize: 8,
            textShiftY: -12,
          }}
        />
      </View>
      <View style={styles.legend}>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: CHART_BLUE }]} />
          <Text style={styles.legendText}>Revenue</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: LINE_AMBER }]} />
          <Text style={styles.legendText}>% change</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: LINE_DARK_BLUE }]} />
          <Text style={styles.legendText}>% of total</Text>
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
    fontSize: 14,
    fontWeight: '600',
    color: dashboardTheme.textPrimary,
    marginBottom: 10,
  },
  chartWrap: {
    backgroundColor: dashboardTheme.cardBg,
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: dashboardTheme.border,
    overflow: 'hidden',
  },
  chartPlaceholder: {
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
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    color: dashboardTheme.textSecondary,
  },
  barInnerLabel: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    alignSelf: 'stretch',
    paddingBottom: 3,
    minWidth: 0,
  },
  barInnerLabelText: {
    fontSize: 9,
    color: '#fff',
    fontWeight: '600',
    letterSpacing: 0.2,
    textAlign: 'center',
    width: '100%',
  },
});
