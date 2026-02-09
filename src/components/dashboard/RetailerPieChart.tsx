import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import type { RetailerStats } from '../../types/dashboard';
import { dashboardTheme } from './theme';

const CHART_SIZE = Dimensions.get('window').width * 0.45;

interface RetailerPieChartProps {
  data: RetailerStats;
  loading?: boolean;
}

export function RetailerPieChart({ data, loading }: RetailerPieChartProps) {
  const pieData = useMemo(() => {
    const items: { value: number; color: string; text: string }[] = [];
    if (data.approved > 0) items.push({ value: data.approved, color: dashboardTheme.chartBluePrimary, text: 'Approved' });
    if (data.pending > 0) items.push({ value: data.pending, color: dashboardTheme.chartAmber, text: 'Pending' });
    if (data.rejected > 0) items.push({ value: data.rejected, color: dashboardTheme.negative, text: 'Rejected' }); // keep red for semantic
    return items;
  }, [data]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Retailer Pipeline</Text>
        <View style={[styles.placeholder, styles.skeleton]} />
      </View>
    );
  }

  if (!pieData.length || data.total === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Retailer Pipeline</Text>
        <View style={styles.placeholder}>
          <Text style={styles.emptyText}>No retailers yet</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Retailer Pipeline</Text>
      <View style={styles.chartWrap}>
        <PieChart
          data={pieData}
          donut
          radius={CHART_SIZE / 2 - 16}
          innerRadius={(CHART_SIZE / 2 - 16) * 0.55}
          centerLabelComponent={() => (
            <Text style={styles.centerLabel}>{data.total}</Text>
          )}
          showText
          textColor={dashboardTheme.textPrimary}
          textSize={11}
        />
        <View style={styles.legend}>
          {pieData.map((d) => (
            <View key={d.text} style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: d.color }]} />
              <Text style={styles.legendText}>
                {d.text}: {d.value}
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: dashboardTheme.cardBg,
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: dashboardTheme.border,
  },
  placeholder: {
    height: 180,
    backgroundColor: dashboardTheme.placeholderBg,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeleton: { opacity: 0.7 },
  emptyText: { fontSize: 14, color: dashboardTheme.textMuted },
  centerLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: dashboardTheme.textPrimary,
  },
  legend: {
    marginLeft: 16,
    flex: 1,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendText: {
    fontSize: 13,
    color: dashboardTheme.textPrimary,
  },
});
