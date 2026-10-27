import {
  CartesianGrid, Legend, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { api } from '../api/client'
import { annotation, axisProps, color, gridProps, legendProps, tooltipProps } from '../components/chartTheme'
import { ChartCard, KeyFinding, PageIntro, StatTile, Status } from '../components/ui'
import { gw, mw, signedMw } from '../format'
import { useApi } from '../hooks/useApi'

export function HorizonPage({ cutoff }: { cutoff: string }) {
  const { data, error, loading } = useApi(api.horizon, [])
  if (!data) return <Status loading={loading} error={error} />

  // Lead times the desk actually works with: decision on D-1 at the cutoff, delivery 00:00-24:00 on D
  const [h, m] = cutoff.split(':').map(Number)
  const leadFrom = 24 - (h + m / 60)
  const leadTo = leadFrom + 24
  const rows = data.map((b) => ({ ...b, mid: (b.lead_from + b.lead_to) / 2 }))
  const first = data[0]
  const last = data[data.length - 1]
  const gain = 100 * (1 - first.mae / last.mae)

  return (
    <>
      <PageIntro title="Would a fresher forecast help?" />

      <KeyFinding>
        A 3-hour-ahead forecast is only <strong>{gain.toFixed(0)}% better</strong> than a 2-day one, and both run too high. Fixing the bias beats waiting.
      </KeyFinding>

      <div className="tiles">
        <StatTile label="You trade on" value={`${Math.round(leadFrom)}–${Math.round(leadTo)} h`} note="ahead of delivery" />
        <StatTile label="Miss 0–3 h ahead" value={mw(first.mae)} tone="good" note="too late to trade" />
        <StatTile label={`Miss ${last.lead_from}–${last.lead_to} h ahead`} value={mw(last.mae)} tone="bad" note="two days out" />
      </div>

      <ChartCard
        title="Error vs hours ahead of delivery"
        table={{
          columns: ['Lead time', 'Typical miss', 'Bias', 'RMSE', 'Forecasts'],
          rows: data.map((b) => [`${b.lead_from}–${b.lead_to} h`, mw(b.mae), signedMw(b.bias), mw(b.rmse), b.count]),
        }}
      >
        <div className="chart-lg">
          <ResponsiveContainer>
            <LineChart data={rows} margin={{ top: 8, right: 8, bottom: 16, left: 0 }}>
              <CartesianGrid {...gridProps} />
              <ReferenceArea x1={leadFrom} x2={Math.min(leadTo, 48)} fill="var(--accent-soft)" stroke="none"
                             label={annotation(`Your ${cutoff} orders`, 'insideTop')} />
              <XAxis dataKey="mid" type="number" domain={[0, 48]} ticks={[0, 6, 12, 18, 24, 30, 36, 42, 48]} {...axisProps}
                     label={{ value: 'hours ahead of delivery', position: 'insideBottom', offset: -10, fill: 'var(--muted)', fontSize: 12 }} />
              <YAxis {...axisProps} tickFormatter={gw} width={58} domain={[0, 'auto']} />
              <Tooltip {...tooltipProps} labelFormatter={(v) => `about ${v} h ahead`} formatter={(v, name) => [mw(+v), name]} />
              <Legend {...legendProps} verticalAlign="top" wrapperStyle={{ fontSize: 13, paddingBottom: 8 }} />
              <Line dataKey="mae" name="Typical miss (MAE)" stroke={color.actual} strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
              <Line dataKey="bias" name="Bias (forecast − actual)" stroke={color.forecast} strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </>
  )
}
