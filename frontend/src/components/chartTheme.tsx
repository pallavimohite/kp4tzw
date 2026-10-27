// Shared chart styling. Colours come from CSS variables so light/dark mode switch in one place.

export const color = {
  actual: 'var(--series-1)',     // blue: what really happened
  forecast: 'var(--series-2)',   // orange: what the buyer was told
  over: 'var(--diverge-warm)',   // over-forecast -> buyer short of power
  under: 'var(--diverge-cool)',  // under-forecast -> buyer has surplus
  grid: 'var(--grid)',
  axis: 'var(--muted)',
}

const mono = "'IBM Plex Mono', ui-monospace, monospace"

export const axisProps = {
  stroke: color.axis,
  tick: { fill: 'var(--text-secondary)', fontSize: 12.5, fontFamily: mono },
  tickLine: false,
  axisLine: { stroke: 'var(--baseline)' },
}

export const gridProps = { stroke: color.grid, vertical: false }

export const tooltipProps = {
  contentStyle: {
    background: 'var(--surface-1)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    boxShadow: 'var(--shadow-lg)',
    color: 'var(--text-primary)',
    fontSize: 14.5,
    padding: '10px 12px',
  },
  labelStyle: { color: 'var(--text-secondary)', marginBottom: 4, fontFamily: mono, fontSize: 13 },
}

// Legend text stays in normal ink; the line swatch next to it carries the colour
export const legendProps = {
  iconType: 'plainline' as const,
  wrapperStyle: { fontSize: 14.5 },
  formatter: (value: string) => <span style={{ color: 'var(--text-secondary)' }}>{value}</span>,
}

/** Label for a note written on a chart (ReferenceDot / ReferenceArea), e.g. "28 Jan: +5.3 GW". */
export const annotation = (value: string, position: 'top' | 'bottom' | 'insideTop' = 'top') => ({
  value,
  position,
  fill: 'var(--text-primary)',
  fontSize: 13.5,
  fontWeight: 600,
})
