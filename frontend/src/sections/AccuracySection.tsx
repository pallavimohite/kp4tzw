import {
  Bar, BarChart, CartesianGrid, Cell, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import type { AccuracyReport } from '../api/client'
import { annotation, axisProps, color, gridProps, tooltipProps } from '../components/chartTheme'
import { Chart, Section } from '../components/ui'
import { gw, longDate, mw, shortDate, signedMw } from '../format'

export function AccuracySection({ data, openDay }: { data: AccuracyReport; openDay: (d: string) => void }) {
  const o = data.overall
  const byBias = [...data.by_day].sort((a, b) => b.bias - a.bias)
  const [worst, second] = byBias
  const worstDays = [...data.by_day].sort((a, b) => b.mae - a.mae).slice(0, 5)
  const nightPeak = [...data.by_hour].sort((a, b) => b.mae - a.mae)[0]

  return (
    <Section id="accuracy" number="1" title="How wrong is the forecast?"
             standfirst={<>A typical hour was off by <strong>{mw(o.mae)}</strong>, and the errors lean one way: forecasts
               ran <strong>{mw(o.bias)}</strong> too high on average. Only a handful of days came in under the forecast.</>}>

      <Chart
        title="Daily bias: forecast minus actual, GW"
        note="Above the line the desk was short of wind; below it, long. Click a bar to read that day."
        keyItems={[{ label: 'Over-forecast (short)', color: color.over }, { label: 'Under-forecast (long)', color: color.under }]}
        table={{ columns: ['Delivery day', 'Bias', 'Avg. miss'], rows: data.by_day.map((d) => [d.date, signedMw(d.bias), mw(d.mae)]) }}
      >
        <div className="plot-md">
          <ResponsiveContainer>
            <BarChart data={data.by_day} margin={{ top: 28, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="date" {...axisProps} tickFormatter={shortDate} interval="preserveStartEnd" minTickGap={24} />
              <YAxis {...axisProps} tickFormatter={gw} width={58} />
              <ReferenceLine y={0} stroke="var(--ink)" />
              <Tooltip {...tooltipProps} cursor={{ fill: 'var(--hover)' }} labelFormatter={(d) => longDate(String(d))}
                       formatter={(v) => [signedMw(+v), 'Bias']} />
              <Bar dataKey="bias" isAnimationActive={false} onClick={(d: { date?: string }) => d.date && openDay(d.date)}
                   style={{ cursor: 'pointer' }}>
                {data.by_day.map((d) => <Cell key={d.date} fill={d.bias > 0 ? color.over : color.under} />)}
              </Bar>
              <ReferenceDot x={worst.date} y={worst.bias} r={0}
                            label={annotation(`${shortDate(worst.date)}: +${(worst.bias / 1000).toFixed(1)} GW`, 'top')} />
              <ReferenceDot x={second.date} y={second.bias} r={0}
                            label={annotation(`${shortDate(second.date)}`, 'top')} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Chart>

      <div className="two-up">
        <Chart
          title="Average miss by hour of day, GW"
          note={<>Misses peak around {nightPeak.hour}:00, even though the early hours have the freshest forecast.</>}
          table={{ columns: ['Hour', 'Avg. miss', 'Bias'], rows: data.by_hour.map((h) => [`${h.hour}:00`, mw(h.mae), signedMw(h.bias)]) }}
        >
          <div className="plot-sm">
            <ResponsiveContainer>
              <BarChart data={data.by_hour} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="hour" {...axisProps} tickFormatter={(h) => `${h}:00`} interval="preserveStartEnd" minTickGap={24} />
                <YAxis {...axisProps} tickFormatter={gw} width={58} />
                <Tooltip {...tooltipProps} cursor={{ fill: 'var(--hover)' }} labelFormatter={(h) => `${h}:00 UK`}
                         formatter={(v) => [mw(+v), 'Average miss']} />
                <Bar dataKey="mae" fill={color.actual} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Chart>

        <Chart
          title="How big the misses were: hours per 0.5 GW band"
          note="The shape sits right of zero: being short is the normal case, not the exception."
          table={{ columns: ['Error band', 'Hours'], rows: data.histogram.map((b) => [`${signedMw(b.from)} to ${signedMw(b.to)}`, b.count]) }}
        >
          <div className="plot-sm">
            <ResponsiveContainer>
              <BarChart data={data.histogram} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap={1}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="from" {...axisProps} tickFormatter={gw} />
                <YAxis {...axisProps} width={40} allowDecimals={false} />
                <Tooltip {...tooltipProps} cursor={{ fill: 'var(--hover)' }}
                         labelFormatter={(_, p) => p[0] ? `${signedMw(p[0].payload.from)} to ${signedMw(p[0].payload.to)}` : ''}
                         formatter={(v) => [v, 'Hours']} />
                <Bar dataKey="count" isAnimationActive={false}>
                  {data.histogram.map((b) => <Cell key={b.from} fill={b.from >= 0 ? color.over : color.under} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Chart>
      </div>

      <h3 className="sub-head">The five hardest days</h3>
      <table className="ledger">
        <thead><tr><th>Delivery day</th><th className="num">Avg. miss</th><th className="num">Bias</th><th className="num">Worst hour</th><th /></tr></thead>
        <tbody>
          {worstDays.map((d) => (
            <tr key={d.date}>
              <td>{longDate(d.date)}</td>
              <td className="num">{mw(d.mae)}</td>
              <td className="num">{signedMw(d.bias)}</td>
              <td className="num">{mw(d.max_over_forecast)}</td>
              <td className="num"><button className="text-btn" onClick={() => openDay(d.date)}>Read the day →</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  )
}
