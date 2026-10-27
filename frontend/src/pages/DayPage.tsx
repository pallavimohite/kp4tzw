import {
  Area, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { api, type Meta } from '../api/client'
import { axisProps, color, gridProps, legendProps, tooltipProps } from '../components/chartTheme'
import { ChartCard, StatTile, Status } from '../components/ui'
import { clock, dateTime, gw, longDate, mw, signedMw } from '../format'
import { useApi } from '../hooks/useApi'

const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export function DayPage({ meta, cutoff, day, setDay }: {
  meta: Meta
  cutoff: string
  day: string
  setDay: (d: string) => void
}) {
  const { data, error, loading } = useApi(() => api.day(day, cutoff), [day, cutoff])

  const chartData = data?.points.map((p) => ({
    ...p,
    label: clock(p.time),
    band: p.band_low != null && p.band_high != null ? [p.band_low, p.band_high] : null,
  }))
  const s = data?.summary
  const lead = data?.points.filter((p) => p.lead_hours != null).map((p) => p.lead_hours!) ?? []

  return (
    <>
      <div className="filters">
        <button onClick={() => setDay(addDays(day, -1))} disabled={day <= meta.first_delivery_day} aria-label="Previous day">‹</button>
        <input type="date" value={day} min={meta.first_delivery_day} max={meta.last_delivery_day}
               onChange={(e) => e.target.value && setDay(e.target.value)} aria-label="Delivery day" />
        <button onClick={() => setDay(addDays(day, 1))} disabled={day >= meta.last_delivery_day} aria-label="Next day">›</button>
      </div>

      <Status loading={loading && !data} error={error} />
      {data && s && (
        <div className={loading ? 'reloading' : ''}>
          <div className="decision">
            Buying for <strong>{longDate(data.date)}</strong> had to be done by{' '}
            <strong>{dateTime(data.decision_time)}</strong>. The latest forecast available then was published{' '}
            <strong>{data.forecast_published ? dateTime(data.forecast_published) : 'n/a'}</strong>
            {lead.length > 0 && <> ({Math.min(...lead)}–{Math.max(...lead)} h ahead of delivery)</>}.
          </div>

          <div className="tiles">
            <StatTile label="Average miss (MAE)" value={mw(s.mae)} hint={`${s.nmae_pct?.toFixed(0)}% of average wind`} />
            <StatTile label="Bias" value={signedMw(s.bias)}
                      hint={s.bias > 0 ? 'Forecast too high: buyer short' : 'Forecast too low: buyer long'}
                      tone={s.bias > 0 ? 'warn' : undefined} />
            <StatTile label="Worst shortfall" value={mw(Math.max(0, s.max_over_forecast))} hint="Largest over-forecast in one hour" />
            <StatTile label="Average actual wind" value={mw(s.mean_actual)} />
          </div>

          <ChartCard
            title="Decision-time forecast vs actual wind generation"
            subtitle={<>Shaded band: where actual wind landed 80% of the time in January for this cutoff
              (forecast {signedMw(-data.band.p90)} to {signedMw(-data.band.p10)}).</>}
            table={{
              columns: ['Time (UK)', 'Actual', 'Forecast', 'Error', 'Lead (h)'],
              rows: data.points.map((p) => [clock(p.time), mw(p.actual), mw(p.forecast), signedMw(p.error), p.lead_hours ?? '–']),
            }}
          >
            <div className="chart-lg">
              <ResponsiveContainer>
                <ComposedChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="label" {...axisProps} interval={5} />
                  <YAxis {...axisProps} tickFormatter={gw} width={56} />
                  <Tooltip {...tooltipProps}
                           formatter={(v, name) => [Array.isArray(v) ? `${mw(+v[0])} – ${mw(+v[1])}` : mw(+v), name]} />
                  <Legend {...legendProps} />
                  <Area dataKey="band" name="80% range" stroke="none" fill={color.forecast} fillOpacity={0.12}
                        connectNulls isAnimationActive={false} />
                  <Line dataKey="forecast" name="Forecast (at decision time)" stroke={color.forecast} strokeWidth={2}
                        dot={false} connectNulls isAnimationActive={false} />
                  <Line dataKey="actual" name="Actual" stroke={color.actual} strokeWidth={2}
                        dot={false} isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      )}
    </>
  )
}
