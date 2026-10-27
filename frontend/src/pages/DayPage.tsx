import {
  Area, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { api, type Meta } from '../api/client'
import { axisProps, color, gridProps, legendProps, tooltipProps } from '../components/chartTheme'
import { DecisionTimeline } from '../components/DecisionTimeline'
import { Icon } from '../components/icons'
import { ChartCard, PageIntro, StatTile, Status } from '../components/ui'
import { clock, gw, longDate, mw, signedMw } from '../format'
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
      <div className="intro-row">
        <PageIntro eyebrow="Daily view" title={`Delivery day ${longDate(day)}`}>
          What the desk saw at the order deadline, and what the wind actually did.
        </PageIntro>
        <div className="day-picker">
          <button className="icon-btn" onClick={() => setDay(addDays(day, -1))} disabled={day <= meta.first_delivery_day}
                  aria-label="Previous day"><Icon name="chevronLeft" /></button>
          <label className="date-field">
            <input type="date" value={day} min={meta.first_delivery_day} max={meta.last_delivery_day}
                   onChange={(e) => e.target.value && setDay(e.target.value)} aria-label="Delivery day" />
          </label>
          <button className="icon-btn" onClick={() => setDay(addDays(day, 1))} disabled={day >= meta.last_delivery_day}
                  aria-label="Next day"><Icon name="chevronRight" /></button>
        </div>
      </div>

      <Status loading={loading && !data} error={error} />
      {data && s && (
        <div className={loading ? 'reloading' : ''}>
          <DecisionTimeline published={data.forecast_published} decision={data.decision_time} deliveryDate={data.date}
                            leadFrom={lead.length ? Math.min(...lead) : null} leadTo={lead.length ? Math.max(...lead) : null} />

          <div className="tiles">
            <StatTile icon="target" label="Average forecast error" value={mw(s.mae)}
                      chip={{ tone: 'info', text: `${s.nmae_pct?.toFixed(0)}% of avg. wind` }} hint="MAE for this day" />
            <StatTile icon="trend" label="Bias" value={signedMw(s.bias)}
                      chip={s.bias > 0 ? { tone: 'warn', text: 'Desk short' } : { tone: 'good', text: 'Desk long' }}
                      hint="Forecast − actual" />
            <StatTile icon="alert" label="Worst hourly shortfall" value={mw(Math.max(0, s.max_over_forecast))}
                      hint="Largest over-forecast in one hour" />
            <StatTile icon="wind" label="Average actual wind" value={mw(s.mean_actual)} hint="GB national wind output" />
          </div>

          <ChartCard
            title="Forecast at order deadline vs actual generation"
            subtitle={<>Shaded band: the range actual wind fell in 80% of January hours, given this forecast
              ({signedMw(-data.band.p90)} to {signedMw(-data.band.p10)}).</>}
            table={{
              columns: ['Time (UK)', 'Actual', 'Forecast', 'Error', 'Lead (h)'],
              rows: data.points.map((p) => [clock(p.time), mw(p.actual), mw(p.forecast), signedMw(p.error), p.lead_hours ?? '–']),
            }}
          >
            <div className="chart-lg">
              <ResponsiveContainer>
                <ComposedChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" minTickGap={24} />
                  <YAxis {...axisProps} tickFormatter={gw} width={56} tickCount={5}
                         domain={[0, (max: number) => Math.ceil(max / 4000) * 4000]} />
                  <Tooltip {...tooltipProps}
                           formatter={(v, name) => [Array.isArray(v) ? `${mw(+v[0])} – ${mw(+v[1])}` : mw(+v), name]} />
                  <Legend {...legendProps} />
                  <Area dataKey="band" name="80% likely range" stroke="none" fill={color.forecast} fillOpacity={0.12}
                        connectNulls isAnimationActive={false} />
                  <Line dataKey="forecast" name="Forecast at deadline" stroke={color.forecast} strokeWidth={2}
                        dot={false} connectNulls isAnimationActive={false} />
                  <Line dataKey="actual" name="Actual generation" stroke={color.actual} strokeWidth={2}
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
