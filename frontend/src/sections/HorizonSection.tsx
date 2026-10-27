import {
  CartesianGrid, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { api } from '../api/client'
import { annotation, axisProps, color, gridProps, tooltipProps } from '../components/chartTheme'
import { Chart, Section, Status } from '../components/ui'
import { gw, mw, signedMw } from '../format'
import { useApi } from '../hooks/useApi'

export function HorizonSection({ cutoff }: { cutoff: string }) {
  const { data, error, loading } = useApi(api.horizon, [])

  // Lead times the desk works with: decision on D-1 at the cutoff, delivery 00:00-24:00 on D
  const [h, m] = cutoff.split(':').map(Number)
  const leadFrom = 24 - (h + m / 60)
  const leadTo = leadFrom + 24

  return (
    <Section id="horizon" number="3" title="Would a fresher forecast help?"
             standfirst={data && <>Only a little. A forecast made a few hours ahead misses by {mw(data[0].mae)}; one made two days
               ahead, by {mw(data[data.length - 1].mae)}. The over-forecast persists at every horizon, so correcting the bias
               is worth more than waiting for a later forecast, which the day-ahead market doesn't allow anyway.</>}>
      <Status loading={loading} error={error} />
      {data && (
        <Chart
          title="Forecast error by how far ahead it was made, GW"
          note="Every forecast Elexon published for January delivery, grouped into 3-hour lead-time buckets."
          keyItems={[{ label: 'Average miss', color: color.actual }, { label: 'Bias (forecast − actual)', color: color.forecast }]}
          table={{
            columns: ['Lead time', 'Avg. miss', 'Bias', 'RMSE', 'Forecasts'],
            rows: data.map((b) => [`${b.lead_from}–${b.lead_to} h`, mw(b.mae), signedMw(b.bias), mw(b.rmse), b.count]),
          }}
        >
          <div className="plot-lg">
            <ResponsiveContainer>
              <LineChart data={data.map((b) => ({ ...b, mid: (b.lead_from + b.lead_to) / 2 }))}
                         margin={{ top: 28, right: 8, bottom: 20, left: 0 }}>
                <CartesianGrid {...gridProps} />
                <ReferenceArea x1={leadFrom} x2={Math.min(leadTo, 48)} fill="var(--hover)" stroke="none"
                               label={annotation(`Day-ahead orders at ${cutoff} use these`, 'insideTop')} />
                <XAxis dataKey="mid" type="number" domain={[0, 48]} ticks={[0, 6, 12, 18, 24, 30, 36, 42, 48]} {...axisProps}
                       label={{ value: 'hours ahead of delivery', position: 'insideBottom', offset: -14, fill: 'var(--muted)', fontSize: 11 }} />
                <YAxis {...axisProps} tickFormatter={gw} width={58} domain={[0, 'auto']} />
                <Tooltip {...tooltipProps} labelFormatter={(v) => `about ${v} h ahead`} formatter={(v, name) => [mw(+v), name]} />
                <Line dataKey="mae" name="Average miss" stroke={color.actual} strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line dataKey="bias" name="Bias" stroke={color.forecast} strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Chart>
      )}
    </Section>
  )
}
