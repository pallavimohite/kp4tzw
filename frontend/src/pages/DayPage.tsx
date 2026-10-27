import {
  Area, CartesianGrid, ComposedChart, Legend, Line, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { api, type Meta } from '../api/client'
import { annotation, axisProps, color, gridProps, legendProps, tooltipProps } from '../components/chartTheme'
import { DecisionTimeline } from '../components/DecisionTimeline'
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
  const scored = data?.points.filter((p) => p.error != null) ?? []
  const lead = scored.map((p) => p.lead_hours!)
  const worst = scored.reduce<(typeof scored)[number] | null>((w, p) => (!w || p.error! > w.error! ? p : w), null)

  return (
    <>
      <div className="intro-row">
        <PageIntro title={`Delivery day: ${longDate(day)}`}>
          What the desk could see at the order deadline, and what the wind then did.
        </PageIntro>
        <div className="day-picker">
          <button className="step-btn" onClick={() => setDay(addDays(day, -1))} disabled={day <= meta.first_delivery_day}
                  aria-label="Previous day">‹</button>
          <input type="date" value={day} min={meta.first_delivery_day} max={meta.last_delivery_day}
                 onChange={(e) => e.target.value && setDay(e.target.value)} aria-label="Delivery day" />
          <button className="step-btn" onClick={() => setDay(addDays(day, 1))} disabled={day >= meta.last_delivery_day}
                  aria-label="Next day">›</button>
        </div>
      </div>

      <Status loading={loading && !data} error={error} />
      {data && s && (
        <div className={loading ? 'reloading' : ''}>
          <DecisionTimeline published={data.forecast_published} decision={data.decision_time} deliveryDate={data.date}
                            leadFrom={lead.length ? Math.min(...lead) : null} leadTo={lead.length ? Math.max(...lead) : null} />

          <div className="tiles">
            <StatTile label="Typical miss per hour" value={mw(s.mae)} note={`${s.nmae_pct?.toFixed(0)}% of the day's average wind`} />
            <StatTile label="Bias (forecast − actual)" value={signedMw(s.bias)} tone={s.bias > 0 ? 'bad' : 'good'}
                      note={s.bias > 0 ? 'Desk was short of wind' : 'Desk had surplus wind'} />
            <StatTile label="Worst single hour" value={worst ? signedMw(worst.error) : '–'} tone={worst && worst.error! > 0 ? 'bad' : undefined}
                      note={worst ? `at ${clock(worst.time)}` : undefined} />
            <StatTile label="Average actual wind" value={mw(s.mean_actual)} note="GB national output" />
          </div>

          <ChartCard
            title="Forecast at the order deadline vs actual generation"
            subtitle={<>Shaded: where actual wind landed in 80% of January's hours, given the forecast
              ({signedMw(-data.band.p90)} to {signedMw(-data.band.p10)}).</>}
            table={{
              columns: ['Time (UK)', 'Actual', 'Forecast', 'Error', 'Lead (h)'],
              rows: data.points.map((p) => [clock(p.time), mw(p.actual), mw(p.forecast), signedMw(p.error), p.lead_hours ?? '–']),
            }}
          >
            <div className="chart-lg">
              <ResponsiveContainer>
                <ComposedChart data={chartData} margin={{ top: 24, right: 20, bottom: 0, left: 0 }}>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" minTickGap={28} />
                  <YAxis {...axisProps} tickFormatter={gw} width={58} tickCount={5}
                         domain={[0, (max: number) => Math.ceil(max / 4000) * 4000]} />
                  <Tooltip {...tooltipProps}
                           formatter={(v, name) => [Array.isArray(v) ? `${mw(+v[0])} – ${mw(+v[1])}` : mw(+v), name]} />
                  <Legend {...legendProps} />
                  <Area dataKey="band" name="80% likely range" stroke="none" fill={color.forecast} fillOpacity={0.12}
                        connectNulls isAnimationActive={false} />
                  <Line dataKey="forecast" name={`Forecast at ${clock(data.decision_time)} deadline`} stroke={color.forecast}
                        strokeWidth={2} dot={false} connectNulls isAnimationActive={false} />
                  <Line dataKey="actual" name="Actual generation" stroke={color.actual} strokeWidth={2}
                        dot={false} isAnimationActive={false} />
                  {worst && worst.error! > 0 && (
                    <ReferenceDot x={clock(worst.time)} y={worst.actual!} r={4} fill="var(--surface-1)" stroke="var(--text-primary)"
                                  strokeWidth={1.5} label={annotation(`Largest miss ${signedMw(worst.error)}`, 'bottom')} />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      )}
    </>
  )
}
