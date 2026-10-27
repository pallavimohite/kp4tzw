import type { CSSProperties } from 'react'
import { longDate, signedMw } from '../format'

/** One square per delivery day: red = desk short, blue = desk long; stronger colour = bigger miss. */
export function CalendarStrip({ days, onPick }: {
  days: { date: string; bias: number }[]
  onPick: (date: string) => void
}) {
  const max = Math.max(...days.map((d) => Math.abs(d.bias)))
  const strength = (bias: number) => 0.25 + 0.75 * (Math.abs(bias) / max)
  return (
    <div className="cal-strip" role="list">
      {days.map((d) => (
        <button key={d.date} role="listitem" className={`cal-day ${d.bias > 0 ? 'short' : 'long'} ${strength(d.bias) > 0.55 ? 'strong' : ''}`}
                style={{ '--strength': strength(d.bias) } as CSSProperties}
                title={`${longDate(d.date)}: ${signedMw(d.bias)}`} onClick={() => onPick(d.date)}>
          {Number(d.date.slice(8))}
        </button>
      ))}
    </div>
  )
}

/** Horizontal bar showing where 80% of errors fall, with a tick at zero. */
export function RangeBar({ low, high, min, max }: { low: number; high: number; min: number; max: number }) {
  const pct = (v: number) => `${(100 * (v - min)) / (max - min)}%`
  return (
    <div className="range-bar" aria-hidden="true">
      <div className="range-fill" style={{ left: pct(low), width: `calc(${pct(high)} - ${pct(low)})` }} />
      <div className="range-zero" style={{ left: pct(0) }} />
    </div>
  )
}

/** Tiny bar chart of daily values, positive bars up (red) and negative down (blue). */
export function Sparkbars({ values }: { values: number[] }) {
  const max = Math.max(...values.map(Math.abs))
  const w = 100 / values.length
  return (
    <svg className="sparkbars" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true">
      {values.map((v, i) => {
        const h = (Math.abs(v) / max) * 14
        return <rect key={i} x={i * w + w * 0.15} width={w * 0.7} y={v > 0 ? 15 - h : 15} height={Math.max(h, 0.5)}
                     className={v > 0 ? 'spark-over' : 'spark-under'} />
      })}
      <line x1="0" x2="100" y1="15" y2="15" className="spark-zero" />
    </svg>
  )
}
