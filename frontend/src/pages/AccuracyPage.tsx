import {
  Area, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { api } from '../api/client'
import { axisProps, color, gridProps, tooltipProps } from '../components/chartTheme'
import { ChartCard, StatTile, Status } from '../components/ui'
import { CalendarStrip, RangeBar, Sparkbars } from '../components/visuals'
import { dateTime, gw, longDate, mw, shortDate, signedMw } from '../format'
import { useApi } from '../hooks/useApi'

const gwText = (v: number) => `${v > 0 ? '+' : ''}${(v / 1000).toFixed(1)} GW`

export function AccuracyPage({ cutoff, openDay }: { cutoff: string; openDay: (d: string) => void }) {
  const { data, error, loading } = useApi(() => api.accuracy(cutoff), [cutoff])
  if (!data) return <Status loading={loading} error={error} />
  const o = data.overall
  const shortDays = data.by_day.filter((d) => d.bias > 0).length
  const worstDays = [...data.by_day].sort((a, b) => b.mae - a.mae).slice(0, 5)
  const peakHour = [...data.by_hour].sort((a, b) => b.mae - a.mae)[0]
  const worstHour = data.series.reduce((w, p) => (p.forecast - p.actual > w.forecast - w.actual ? p : w))

  // The gap between the lines is drawn as two range areas: red where the forecast was too high, blue where too low
  const series = data.series.map((p) => ({
    ...p,
    over: p.forecast > p.actual ? [p.actual, p.forecast] : [p.actual, p.actual],
    under: p.forecast < p.actual ? [p.forecast, p.actual] : [p.actual, p.actual],
  }))
  const dayTicks = data.series.filter((_, i) => i % (24 * 4) === 0).map((p) => p.time)
  const top = Math.ceil(Math.max(...data.series.map((p) => Math.max(p.forecast, p.actual))) / 5000) * 5000
  const gwTicks = Array.from({ length: top / 5000 + 1 }, (_, i) => i * 5000)

  return (
    <div className={loading ? 'reloading' : ''}>
      <div className="hero">
        <h2 className="hero-title">Forecast was too high on <span className="bad">{shortDays} of {data.by_day.length}</span> days</h2>
        <CalendarStrip days={data.by_day} onPick={openDay} />
        <div className="cal-key"><span className="k-short" />short of wind <span className="k-long" />surplus · click a day</div>
      </div>

      <div className="tiles">
        <StatTile label="Typical miss" value={gwText(o.mae).replace('+', '')} note={`${o.nmae_pct?.toFixed(0)}% of average wind`}
                  hint={`Mean absolute error per hour: ${mw(o.mae)}. Average wind output: ${mw(o.mean_actual)}.`} />
        <StatTile label="Bias" value={gwText(o.bias)} tone={o.bias > 0 ? 'bad' : 'good'}
                  visual={<Sparkbars values={data.by_day.map((d) => d.bias)} />}
                  hint={`Average of forecast − actual: ${signedMw(o.bias)}. Positive means less wind arrived than forecast.`} />
        <StatTile label="80% of hours" value={`${(o.p10 / 1000).toFixed(1)} to ${gwText(o.p90)}`}
                  visual={<RangeBar low={o.p10} high={o.p90} min={o.max_under_forecast} max={o.max_over_forecast} />}
                  hint={`10th to 90th percentile of the hourly error. Planning for ${mw(o.p90)} less wind covered 9 hours in 10.`} />
        <StatTile label="Worst hour" value={gwText(o.max_over_forecast)} tone="bad" note={dateTime(worstHour.time)}
                  hint={`Largest single-hour over-forecast. RMSE across all hours: ${mw(o.rmse)}.`} />
      </div>

      <ChartCard
        title={`January: forecast at the ${cutoff} deadline vs actual wind`}
        table={{
          columns: ['Time (UK)', 'Forecast', 'Actual', 'Error'],
          rows: data.series.map((p) => [dateTime(p.time), mw(p.forecast), mw(p.actual), signedMw(p.forecast - p.actual)]),
        }}
      >
        <div className="chart-key">
          <span><i style={{ background: color.forecast }} />Forecast</span>
          <span><i style={{ background: color.actual }} />Actual</span>
          <span><i className="area" style={{ background: color.over }} />Wind you didn't get</span>
        </div>
        <div className="chart-hero">
          <ResponsiveContainer>
            <ComposedChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="time" {...axisProps} ticks={dayTicks} tickFormatter={(t) => shortDate(String(t).slice(0, 10))} />
              <YAxis {...axisProps} tickFormatter={gw} width={58} domain={[0, top]} ticks={gwTicks} />
              <Tooltip {...tooltipProps} labelFormatter={(t) => dateTime(String(t))}
                       formatter={(v, name) => [mw(+v), name]} />
              <Area dataKey="over" stroke="none" fill={color.over} fillOpacity={0.3} isAnimationActive={false} tooltipType="none" />
              <Area dataKey="under" stroke="none" fill={color.under} fillOpacity={0.2} isAnimationActive={false} tooltipType="none" />
              <Line dataKey="forecast" name="Forecast" stroke={color.forecast} strokeWidth={1.5} dot={false} isAnimationActive={false} />
              <Line dataKey="actual" name="Actual" stroke={color.actual} strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <div className="grid-2">
        <ChartCard
          title={`Miss by hour of day · worst at ${peakHour.hour}:00`}
          table={{ columns: ['Hour', 'Typical miss', 'Bias'], rows: data.by_hour.map((h) => [`${h.hour}:00`, mw(h.mae), signedMw(h.bias)]) }}
        >
          <div className="chart-sm">
            <ResponsiveContainer>
              <BarChart data={data.by_hour} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="hour" {...axisProps} tickFormatter={(h) => `${h}:00`} interval="preserveStartEnd" minTickGap={24} />
                <YAxis {...axisProps} tickFormatter={gw} width={58} />
                <Tooltip {...tooltipProps} cursor={{ fill: 'var(--hover)' }} labelFormatter={(h) => `${h}:00 UK`}
                         formatter={(v) => [mw(+v), 'Typical miss']} />
                <Bar dataKey="mae" radius={[3, 3, 0, 0]} isAnimationActive={false}>
                  {data.by_hour.map((h) => (
                    <Cell key={h.hour} fill={color.actual} fillOpacity={h.hour === peakHour.hour ? 1 : 0.55} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Size of the misses (hours per 0.5 GW)"
          table={{ columns: ['Error band', 'Hours'], rows: data.histogram.map((b) => [`${signedMw(b.from)} to ${signedMw(b.to)}`, b.count]) }}
        >
          <div className="chart-sm">
            <ResponsiveContainer>
              <BarChart data={data.histogram} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap={2}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="from" {...axisProps} tickFormatter={gw} interval="preserveStartEnd" minTickGap={18} />
                <YAxis {...axisProps} width={40} allowDecimals={false} />
                <ReferenceLine x={0} stroke="var(--text-primary)" />
                <Tooltip {...tooltipProps} cursor={{ fill: 'var(--hover)' }}
                         labelFormatter={(_, p) => p[0] ? `${signedMw(p[0].payload.from)} to ${signedMw(p[0].payload.to)}` : ''}
                         formatter={(v) => [v, 'Hours']} />
                <Bar dataKey="count" radius={[3, 3, 0, 0]} isAnimationActive={false}>
                  {data.histogram.map((b) => <Cell key={b.from} fill={b.from >= 0 ? color.over : color.under} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Five hardest days">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Day</th><th className="num">Typical miss</th><th className="num">Bias</th><th className="num">Worst hour</th><th /></tr></thead>
            <tbody>
              {worstDays.map((d) => (
                <tr key={d.date} className="clickable" onClick={() => openDay(d.date)}>
                  <td><strong>{longDate(d.date)}</strong></td>
                  <td className="num">{mw(d.mae)}</td>
                  <td className="num bad">{signedMw(d.bias)}</td>
                  <td className="num">{signedMw(d.max_over_forecast)}</td>
                  <td className="row-action">Open →</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  )
}
