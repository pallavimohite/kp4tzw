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
  tick: { fill: color.axis, fontSize: 11, fontFamily: mono },
  tickLine: false,
  axisLine: false,
}

export const gridProps = { stroke: color.grid, vertical: false }

export const tooltipProps = {
  contentStyle: {
    background: 'var(--paper)',
    border: '1px solid var(--ink)',
    borderRadius: 0,
    color: 'var(--ink)',
    fontSize: 13,
    padding: '8px 10px',
  },
  labelStyle: { fontFamily: mono, fontSize: 11, color: 'var(--muted)', marginBottom: 4 },
}

/** Text label for an annotation drawn on a chart (ReferenceDot / ReferenceArea label). */
export const annotation = (value: string, position: 'top' | 'right' | 'left' | 'insideTop' | 'insideTopLeft' = 'top') => ({
  value,
  position,
  fill: 'var(--ink)',
  fontSize: 12,
  fontStyle: 'italic' as const,
  fontFamily: "'Newsreader', Georgia, serif",
})
