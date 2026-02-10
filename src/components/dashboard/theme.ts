/**
 * Dashboard color palette — clean, muted, professional (e‑commerce analytics style).
 * White/dark gray base; muted gold for primary charts; soft green/red for trends.
 */
export const dashboardTheme = {
  // Backgrounds
  pageBg: '#F7F6F4',
  cardBg: '#FFFFFF',
  placeholderBg: '#F2F1EF',
  border: '#E8E8E8',

  // Text
  textPrimary: '#1A1A1A',
  textSecondary: '#6B6B6B',
  textMuted: '#8E8E93',

  // Primary chart (revenue / main metric) — muted gold
  chartGold: '#B8960C',
  chartGoldFill: 'rgba(184, 150, 12, 0.2)',
  chartGoldFillEnd: 'rgba(184, 150, 12, 0.02)',

  // Secondary chart — muted blue
  chartBlue: '#5B7FA3',
  chartBlueFill: 'rgba(91, 127, 163, 0.15)',
  chartBlueFillEnd: 'rgba(91, 127, 163, 0.02)',

  // Primary blue palette (bars + trend lines)
  chartBluePrimary: '#007AFF',
  chartBlueSecondary: '#4DA3FF',
  chartBlueDark: '#0047AB', // darker than bar for %-of-total line
  chartBlueLight: '#5DADE2',
  // Blue shades for multi-series (category/status) — no semantic meaning
  chartBlueShades: ['#007AFF', '#4DA3FF', '#5DADE2', '#7EC8E3', '#A8D4EC'] as const,
  // Trend line: % change (amber)
  chartAmber: '#E67E22',

  // Semantic
  positive: '#4A7C59',
  negative: '#B85454',
  warning: '#A67C52',
  // Cancelled / inactive (grey)
  chartGrey: '#8E8E93',

  // Pastel accents (category / multi-series)
  pastelBlue: '#A8C5E5',
  pastelYellow: '#D4C9A0',
  pastelGreen: '#9BC4B0',
  pastelPurple: '#B8A9C9',
  pastelCoral: '#C9A99A',

  // Actions
  activeBg: '#1A1A1A',
  activeText: '#FFFFFF',
} as const;
