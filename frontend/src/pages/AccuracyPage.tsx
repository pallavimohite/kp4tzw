import {
  Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { api } from '../api/client'
import { axisProps, color, gridProps, tooltipProps } from '../components/chartTheme'
import { ChartCard, StatTile, Status } from '../components/ui'
import { gw, mw, shortDate, signedMw } from '../format'
import { useApi } from '../hooks/useApi'

export function AccuracyPage({ cutoff, openDay }: { cutoff: string; openDay: (d: string) => void }) {
  const { data, error, loading } = useApi(() => api.accuracy(cutoff), [cutoff])
  if (!data) return <Status loading={loading} error={error} />
  const o = data.overall
  const worstDays = [...data.by_day].sort((a, b) => b.mae - a.mae).slice(0, 5)

  return (
    <div className={loading ? 'reloading' : ''}>
      <div className="tiles">
        <StatTile label="Average miss (MAE)" value={mw(o.mae)} hint={`${o.nmae_pct?.toFixed(0)}% of average wind (${mw(o.mean_actual)})`} />
        <StatTile label="Bias" value={signedMw(o.bias)} tone={o.bias > 0 ? 'warn' : undefined}
                  hint={o.bias > 0 ? 'Forecasts run high: plan for less wind' : 'Forecasts run low'} />
        <StatTile label="80% of hours, error within" value={`${signedMw(o.p10)} to ${signedMw(o.p90)}`}
                  hint="P10 – P90 of forecast − actual" />
        <StatTile label="Worst single-hour shortfall" value={mw(o.max_over_forecast)} hint={`RMSE ${mw(o.rmse)}`} />
      </div>

      <div className="insight">
        <strong>What this means for buying:</strong> at this cutoff the forecast over-stated wind by{' '}
        {mw(o.bias)} on average. Planning for {mw(o.p90)} less wind than forecast (the P90 error)
        would have covered actual wind in 9 out of 10 hours.
      </div>

      <ChartCard
        title="Daily bias: forecast − actual"
        subtitle={<>Above zero (red): wind over-forecast, buyer short. Below zero (blue): surplus. Click a bar to open that day.</>}
        table={{ columns: ['Delivery day', 'Bias', 'MAE'], rows: data.by_day.map((d) => [d.date, signedMw(d.bias), mw(d.mae)]) }}
      >
        <div className="chart-md">
          <ResponsiveContainer>
            <BarChart data={data.by_day} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="date" {...axisProps} tickFormatter={shortDate} interval={3} />
              <YAxis {...axisProps} tickFormatter={gw} width={56} />
              <ReferenceLine y={0} stroke="var(--baseline)" />
              <Tooltip {...tooltipProps} cursor={{ fill: 'var(--hover)' }} labelFormatter={(d) => shortDate(String(d))}
                       formatter={(v, name) => [signedMw(+v), name]} />
              <Bar dataKey="bias" name="Bias" radius={[4, 4, 0, 0]} isAnimationActive={false}
                   onClick={(d: { date?: string }) => d.date && openDay(d.date)} style={{ cursor: 'pointer' }}>
                {data.by_day.map((d) => <Cell key={d.date} fill={d.bias > 0 ? color.over : color.under} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <div className="grid-2">
        <ChartCard
          title="Average miss by hour of day"
          subtitle="MAE per delivery hour (UK time)"
          table={{ columns: ['Hour', 'MAE', 'Bias'], rows: data.by_hour.map((h) => [`${h.hour}:00`, mw(h.mae), signedMw(h.bias)]) }}
        >
          <div className="chart-sm">
            <ResponsiveContainer>
              <BarChart data={data.by_hour} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="hour" {...axisProps} interval={2} tickFormatter={(h) => `${h}:00`} />
                <YAxis {...axisProps} tickFormatter={gw} width={56} />
                <Tooltip {...tooltipProps} cursor={{ fill: 'var(--hover)' }} labelFormatter={(h) => `${h}:00`}
                         formatter={(v) => [mw(+v), 'MAE']} />
                <Bar dataKey="mae" fill={color.actual} radius={[4, 4, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="How big are the misses?"
          subtitle="Number of hours by error size (500 MW bins)"
          table={{ columns: ['Error range', 'Hours'], rows: data.histogram.map((b) => [`${signedMw(b.from)} to ${signedMw(b.to)}`, b.count]) }}
        >
          <div className="chart-sm">
            <ResponsiveContainer>
              <BarChart data={data.histogram}
                        margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap={2}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="from" {...axisProps} tickFormatter={gw} />
                <YAxis {...axisProps} width={40} allowDecimals={false} />
                <Tooltip {...tooltipProps} cursor={{ fill: 'var(--hover)' }}
                         labelFormatter={(_, p) => p[0] ? `${signedMw(p[0].payload.from)} to ${signedMw(p[0].payload.to)}` : ''}
                         formatter={(v) => [v, 'Hours']} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                  {data.histogram.map((b) => <Cell key={b.from} fill={b.from >= 0 ? color.over : color.under} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Hardest days to forecast" subtitle="Highest average miss. Click to inspect.">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Delivery day</th><th>MAE</th><th>Bias</th><th>Worst shortfall</th></tr></thead>
            <tbody>
              {worstDays.map((d) => (
                <tr key={d.date} className="clickable" onClick={() => openDay(d.date)}>
                  <td>{shortDate(d.date)}</td><td>{mw(d.mae)}</td><td>{signedMw(d.bias)}</td><td>{mw(d.max_over_forecast)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  )
}
