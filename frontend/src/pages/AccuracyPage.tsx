import {
  Bar, BarChart, CartesianGrid, Cell, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { api } from '../api/client'
import { annotation, axisProps, color, gridProps, tooltipProps } from '../components/chartTheme'
import { ChartCard, KeyFinding, PageIntro, StatTile, Status } from '../components/ui'
import { gw, longDate, mw, shortDate, signedMw } from '../format'
import { useApi } from '../hooks/useApi'

const gwText = (v: number) => `${(v / 1000).toFixed(1)} GW`

export function AccuracyPage({ cutoff, openDay }: { cutoff: string; openDay: (d: string) => void }) {
  const { data, error, loading } = useApi(() => api.accuracy(cutoff), [cutoff])
  if (!data) return <Status loading={loading} error={error} />
  const o = data.overall
  const shortDays = data.by_day.filter((d) => d.bias > 0).length
  const [worst, second] = [...data.by_day].sort((a, b) => b.bias - a.bias)
  const worstDays = [...data.by_day].sort((a, b) => b.mae - a.mae).slice(0, 5)
  const peakHour = [...data.by_hour].sort((a, b) => b.mae - a.mae)[0]

  return (
    <div className={loading ? 'reloading' : ''}>
      <PageIntro title="How reliable was the forecast in January?" />

      <KeyFinding>
        Too high on <strong>{shortDays} of {data.by_day.length} days</strong>, by <strong>{gwText(o.bias)}</strong> on
        average. A <strong>{gwText(o.p90)}</strong> margin covered 9 hours in 10.
      </KeyFinding>

      <div className="tiles">
        <StatTile label="Typical miss" value={mw(o.mae)} note={`${o.nmae_pct?.toFixed(0)}% of avg. wind`}
                  hint={`Mean absolute error per hour. Average wind: ${mw(o.mean_actual)}`} />
        <StatTile label="Bias" value={signedMw(o.bias)} tone={o.bias > 0 ? 'bad' : 'good'}
                  note={o.bias > 0 ? 'forecast too high' : 'forecast too low'} hint="Average of forecast − actual" />
        <StatTile label="80% range" value={`${(o.p10 / 1000).toFixed(1)} to ${gwText(o.p90)}`} note="of hourly errors"
                  hint="10th to 90th percentile of forecast − actual" />
        <StatTile label="Worst hour" value={signedMw(o.max_over_forecast)} tone="bad" note={`RMSE ${mw(o.rmse)}`} />
      </div>

      <ChartCard
        title="Daily bias"
        subtitle="Red = desk short · Blue = surplus · click a bar"
        table={{ columns: ['Delivery day', 'Bias', 'Typical miss'], rows: data.by_day.map((d) => [d.date, signedMw(d.bias), mw(d.mae)]) }}
      >
        <div className="chart-md">
          <ResponsiveContainer>
            <BarChart data={data.by_day} margin={{ top: 24, right: 20, bottom: 0, left: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="date" {...axisProps} tickFormatter={shortDate} interval="preserveStartEnd" minTickGap={24} />
              <YAxis {...axisProps} tickFormatter={gw} width={58} />
              <ReferenceLine y={0} stroke="var(--baseline)" />
              <Tooltip {...tooltipProps} cursor={{ fill: 'var(--hover)' }} labelFormatter={(d) => longDate(String(d))}
                       formatter={(v) => [signedMw(+v), 'Bias']} />
              <Bar dataKey="bias" radius={[3, 3, 0, 0]} isAnimationActive={false}
                   onClick={(d: { date?: string }) => d.date && openDay(d.date)} style={{ cursor: 'pointer' }}>
                {data.by_day.map((d) => <Cell key={d.date} fill={d.bias > 0 ? color.over : color.under} />)}
              </Bar>
              <ReferenceDot x={worst.date} y={worst.bias} r={0} label={annotation(`${shortDate(worst.date)}`)} />
              <ReferenceDot x={second.date} y={second.bias} r={0} label={annotation(`${shortDate(second.date)}`)} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <div className="grid-2">
        <ChartCard
          title="Miss by hour of day"
          subtitle={`Worst at ${peakHour.hour}:00`}
          table={{ columns: ['Hour', 'Typical miss', 'Bias'], rows: data.by_hour.map((h) => [`${h.hour}:00`, mw(h.mae), signedMw(h.bias)]) }}
        >
          <div className="chart-sm">
            <ResponsiveContainer>
              <BarChart data={data.by_hour} margin={{ top: 8, right: 20, bottom: 0, left: 0 }}>
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
          title="Size of the misses"
          subtitle="Hours per 0.5 GW band"
          table={{ columns: ['Error band', 'Hours'], rows: data.histogram.map((b) => [`${signedMw(b.from)} to ${signedMw(b.to)}`, b.count]) }}
        >
          <div className="chart-sm">
            <ResponsiveContainer>
              <BarChart data={data.histogram} margin={{ top: 8, right: 20, bottom: 0, left: 0 }} barCategoryGap={2}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="from" {...axisProps} tickFormatter={gw} interval="preserveStartEnd" minTickGap={18} />
                <YAxis {...axisProps} width={40} allowDecimals={false} />
                <ReferenceLine x={0} stroke="var(--text-primary)" strokeDasharray="0" />
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

      <ChartCard title="Five hardest days" subtitle="Click a row to open the day">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Delivery day</th><th className="num">Typical miss</th><th className="num">Bias</th><th className="num">Worst hour</th><th /></tr></thead>
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
