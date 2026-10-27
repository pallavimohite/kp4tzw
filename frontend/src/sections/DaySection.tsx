import {
  Area, CartesianGrid, ComposedChart, Line, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { api, type Meta } from '../api/client'
import { annotation, axisProps, color, gridProps, tooltipProps } from '../components/chartTheme'
import { Chart, Section, Status } from '../components/ui'
import { clock, gw, longDate, mw, signedMw } from '../format'
import { useApi } from '../hooks/useApi'

const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

const fullDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/London' })

export function DaySection({ meta, cutoff, day, setDay }: {
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
  const scored = data?.points.filter((p) => p.error != null) ?? []
  const worst = scored.reduce<(typeof scored)[number] | null>((w, p) => (!w || p.error! > w.error! ? p : w), null)
  const lead = scored.map((p) => p.lead_hours!)

  return (
    <Section id="day" number="2" title="One day, up close"
             standfirst="Pick any delivery day to see exactly what the desk knew when it placed its order, and how the wind then behaved.">

      <div className="day-nav">
        <button className="text-btn" onClick={() => setDay(addDays(day, -1))} disabled={day <= meta.first_delivery_day}>← Previous</button>
        <input type="date" value={day} min={meta.first_delivery_day} max={meta.last_delivery_day}
               onChange={(e) => e.target.value && setDay(e.target.value)} aria-label="Delivery day" />
        <button className="text-btn" onClick={() => setDay(addDays(day, 1))} disabled={day >= meta.last_delivery_day}>Next →</button>
      </div>

      <Status loading={loading && !data} error={error} />
      {data && (
        <div className={loading ? 'reloading' : ''}>
          <div className="timeline">
            <div className="tl-row">
              <div className="tl-item">
                <span className="tl-time">{clock(data.forecast_published ?? data.decision_time)}</span>
                <span className="tl-what">Forecast published</span>
              </div>
              <div className="tl-item">
                <span className="tl-time">{clock(data.decision_time)}</span>
                <span className="tl-what">Order deadline</span>
              </div>
              <div className="tl-item tl-gap" />
              <div className="tl-item">
                <span className="tl-time">00:00–24:00</span>
                <span className="tl-what">Power delivered</span>
              </div>
            </div>
            <div className="tl-rule"><span /><span /><span className="tl-faint" /></div>
            <div className="tl-days">
              <span>{longDate(addDays(data.date, -1))}</span>
              <span>{longDate(data.date)}</span>
            </div>
          </div>

          <p className="body-copy">
            For <strong>{fullDate(`${data.date}T12:00:00Z`)}</strong>, orders were due at {clock(data.decision_time)} the day before.
            The newest forecast at that moment was the {data.forecast_published ? clock(data.forecast_published) : '–'} edition,
            made {lead.length ? `${Math.min(...lead)} to ${Math.max(...lead)}` : '–'} hours ahead of each delivery hour.
            Newer forecasts followed, but the desk could not have seen them. On the day, the forecast missed by{' '}
            <strong>{mw(data.summary.mae)}</strong> in a typical hour
            {worst && <> and by <strong>{signedMw(worst.error)}</strong> at {clock(worst.time)}</>}.
          </p>

          <Chart
            title="Wind generation, GW: forecast at the order deadline vs what actually happened"
            note={<>Shaded: where actual wind landed in 80% of January's hours, given the forecast
              ({signedMw(-data.band.p90)} to {signedMw(-data.band.p10)}).</>}
            keyItems={[
              { label: `Forecast at ${clock(data.decision_time)} deadline`, color: color.forecast },
              { label: 'Actual', color: color.actual },
              { label: '80% range', color: color.forecast, band: true },
            ]}
            table={{
              columns: ['Time (UK)', 'Actual', 'Forecast', 'Error', 'Lead (h)'],
              rows: data.points.map((p) => [clock(p.time), mw(p.actual), mw(p.forecast), signedMw(p.error), p.lead_hours ?? '–']),
            }}
          >
            <div className="plot-lg">
              <ResponsiveContainer>
                <ComposedChart data={chartData} margin={{ top: 28, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" minTickGap={28} />
                  <YAxis {...axisProps} tickFormatter={gw} width={58} tickCount={5}
                         domain={[0, (max: number) => Math.ceil(max / 4000) * 4000]} />
                  <Tooltip {...tooltipProps}
                           formatter={(v, name) => [Array.isArray(v) ? `${mw(+v[0])} – ${mw(+v[1])}` : mw(+v), name]} />
                  <Area dataKey="band" name="80% range" stroke="none" fill={color.forecast} fillOpacity={0.12}
                        connectNulls isAnimationActive={false} />
                  <Line dataKey="forecast" name="Forecast" stroke={color.forecast} strokeWidth={2}
                        dot={false} connectNulls isAnimationActive={false} />
                  <Line dataKey="actual" name="Actual" stroke={color.actual} strokeWidth={2}
                        dot={false} isAnimationActive={false} />
                  {worst && worst.error! > 0 && (
                    <ReferenceDot x={clock(worst.time)} y={worst.actual!} r={4} fill="var(--paper)" stroke="var(--ink)"
                                  label={annotation(`Largest miss, ${clock(worst.time)}`, 'top')} />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Chart>
        </div>
      )}
    </Section>
  )
}
