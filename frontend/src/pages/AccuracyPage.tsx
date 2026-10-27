import {
  Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { api } from '../api/client'
import { axisProps, color, gridProps, tooltipProps } from '../components/chartTheme'
import { Icon } from '../components/icons'
import { ChartCard, Chip, Insight, PageIntro, StatTile, Status } from '../components/ui'
import { gw, mw, shortDate, signedMw } from '../format'
import { useApi } from '../hooks/useApi'

const gwText = (v: number) => `${(v / 1000).toFixed(1)} GW`

export function AccuracyPage({ cutoff, openDay }: { cutoff: string; openDay: (d: string) => void }) {
  const { data, error, loading } = useApi(() => api.accuracy(cutoff), [cutoff])
  if (!data) return <Status loading={loading} error={error} />
  const o = data.overall
  const worstDays = [...data.by_day].sort((a, b) => b.mae - a.mae).slice(0, 5)
  const shortDays = data.by_day.filter((d) => d.bias > 0).length

  return (
    <div className={loading ? 'reloading' : ''}>
      <PageIntro eyebrow="Pilot results · January 2026" title="How reliable is the wind forecast you buy against?">
        Every number on this page uses only the forecast that was available at your {cutoff} order deadline the day
        before delivery, exactly the information your desk had when placing day-ahead orders.
      </PageIntro>

      <Insight title={`Wind was over-forecast on ${shortDays} of ${data.by_day.length} delivery days`}>
        On average the forecast promised <strong>{gwText(o.bias)} more wind</strong> than arrived, leaving the desk
        short. Planning for <strong>{gwText(o.p90)} less wind than forecast</strong> would have covered actual
        generation in 9 out of 10 hours.
      </Insight>

      <div className="tiles">
        <StatTile icon="target" label="Average forecast error" value={mw(o.mae)}
                  chip={{ tone: 'info', text: `${o.nmae_pct?.toFixed(0)}% of avg. wind` }}
                  hint={`MAE · avg. wind ${mw(o.mean_actual)}`} />
        <StatTile icon="trend" label="Systematic bias" value={signedMw(o.bias)}
                  chip={o.bias > 0 ? { tone: 'warn', text: 'Over-forecast' } : { tone: 'good', text: 'Under-forecast' }}
                  hint="Forecast − actual" />
        <StatTile icon="range" label="Typical error range" value={`${gwText(o.p10)} to ${gwText(o.p90)}`}
                  chip={{ tone: 'neutral', text: '80% of hours' }} hint="P10 – P90" />
        <StatTile icon="alert" label="Worst hourly shortfall" value={mw(o.max_over_forecast)}
                  chip={{ tone: 'warn', text: 'Peak risk' }} hint={`RMSE ${mw(o.rmse)}`} />
      </div>

      <ChartCard
        title="Daily bias"
        subtitle={<>Red: wind over-forecast, desk short of power. Blue: wind under-forecast, surplus. Click a bar to open that day.</>}
        table={{ columns: ['Delivery day', 'Bias', 'MAE'], rows: data.by_day.map((d) => [d.date, signedMw(d.bias), mw(d.mae)]) }}
      >
        <div className="chart-md">
          <ResponsiveContainer>
            <BarChart data={data.by_day} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="date" {...axisProps} tickFormatter={shortDate} interval="preserveStartEnd" minTickGap={24} />
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
          title="Error by hour of day"
          subtitle="Average absolute error per delivery hour (UK time)"
          table={{ columns: ['Hour', 'MAE', 'Bias'], rows: data.by_hour.map((h) => [`${h.hour}:00`, mw(h.mae), signedMw(h.bias)]) }}
        >
          <div className="chart-sm">
            <ResponsiveContainer>
              <BarChart data={data.by_hour} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="hour" {...axisProps} interval="preserveStartEnd" minTickGap={24} tickFormatter={(h) => `${h}:00`} />
                <YAxis {...axisProps} tickFormatter={gw} width={56} />
                <Tooltip {...tooltipProps} cursor={{ fill: 'var(--hover)' }} labelFormatter={(h) => `${h}:00`}
                         formatter={(v) => [mw(+v), 'MAE']} />
                <Bar dataKey="mae" fill={color.actual} radius={[4, 4, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Distribution of errors"
          subtitle="Hours by size of miss (500 MW bins). Most misses are on the short side."
          table={{ columns: ['Error range', 'Hours'], rows: data.histogram.map((b) => [`${signedMw(b.from)} to ${signedMw(b.to)}`, b.count]) }}
        >
          <div className="chart-sm">
            <ResponsiveContainer>
              <BarChart data={data.histogram} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap={2}>
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

      <ChartCard title="Hardest days to forecast" subtitle="Highest average error. Select a day to inspect it hour by hour.">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Delivery day</th><th>Avg. error</th><th>Bias</th><th>Worst hour</th><th /></tr></thead>
            <tbody>
              {worstDays.map((d) => (
                <tr key={d.date} className="clickable" onClick={() => openDay(d.date)}>
                  <td><strong>{shortDate(d.date)}</strong></td>
                  <td>{mw(d.mae)}</td>
                  <td><Chip tone={d.bias > 0 ? 'warn' : 'good'}>{signedMw(d.bias)}</Chip></td>
                  <td>{mw(d.max_over_forecast)}</td>
                  <td className="row-action">View <Icon name="chevronRight" size={14} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  )
}
