import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { Card } from '../ui';
import { dashboardTheme } from './theme';

interface MetricCardProps {
  label: string;
  value: string | number;
  accentColor?: string;
}

export function MetricCard({ label, value, accentColor }: MetricCardProps) {
  const color = accentColor ?? dashboardTheme.chartBlue;
  return (
    <Card style={styles.card} padding="md">
      <Text style={[styles.value, { color }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    minWidth: 0,
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
  },
  label: {
    fontSize: 12,
    color: dashboardTheme.textSecondary,
    marginTop: 4,
  },
});
