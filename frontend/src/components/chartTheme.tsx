// Shared chart styling. Colours come from CSS variables so light/dark mode switch in one place.

export const color = {
  actual: 'var(--series-1)',     // blue: what really happened
  forecast: 'var(--series-2)',   // orange: what the buyer was told
  over: 'var(--diverge-warm)',   // over-forecast -> buyer short of power
  under: 'var(--diverge-cool)',  // under-forecast -> buyer has surplus
  grid: 'var(--grid)',
  axis: 'var(--muted)',
}

export const axisProps = {
  stroke: color.axis,
  tick: { fill: color.axis, fontSize: 12 },
  tickLine: false,
  axisLine: { stroke: 'var(--baseline)' },
}

export const gridProps = { stroke: color.grid, vertical: false }

export const tooltipProps = {
  contentStyle: {
    background: 'var(--surface-1)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    boxShadow: 'var(--shadow-lg)',
    color: 'var(--text-primary)',
    fontSize: 13,
    padding: '10px 12px',
  },
  labelStyle: { color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 600 },
}

// Legend text stays in normal ink; the line swatch next to it carries the colour
export const legendProps = {
  iconType: 'plainline' as const,
  wrapperStyle: { fontSize: 13 },
  formatter: (value: string) => <span style={{ color: 'var(--text-secondary)' }}>{value}</span>,
}
