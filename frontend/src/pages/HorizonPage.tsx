import {
  CartesianGrid, Legend, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { api } from '../api/client'
import { axisProps, color, gridProps, legendProps, tooltipProps } from '../components/chartTheme'
import { ChartCard, Status } from '../components/ui'
import { gw, mw, signedMw } from '../format'
import { useApi } from '../hooks/useApi'

export function HorizonPage({ cutoff }: { cutoff: string }) {
  const { data, error, loading } = useApi(api.horizon, [])
  if (!data) return <Status loading={loading} error={error} />

  // Lead times the buyer actually works with: decision on D-1 at the cutoff, delivery 00:00-24:00 on D
  const [h, m] = cutoff.split(':').map(Number)
  const leadFrom = 24 - (h + m / 60)
  const leadTo = leadFrom + 24
  const rows = data.map((b) => ({ ...b, mid: (b.lead_from + b.lead_to) / 2 }))
  const first = data[0]
  const last = data[data.length - 1]

  return (
    <>
      <div className="insight">
        <strong>Fresher forecasts are better, but only slightly.</strong> Error rises from {mw(first.mae)} at{' '}
        {first.lead_from}–{first.lead_to} h ahead to {mw(last.mae)} at {last.lead_from}–{last.lead_to} h ahead.
        Day-ahead decisions at {cutoff} work with forecasts roughly {Math.round(leadFrom)}–{Math.round(leadTo)} h
        ahead (shaded). The over-forecast bias stays at every horizon, so it is a systematic effect to correct for,
        not just forecast age.
      </div>

      <ChartCard
        title="Forecast error vs how far ahead the forecast was made"
        subtitle="Every forecast published for January delivery, grouped by lead time (3-hour buckets)"
        table={{
          columns: ['Lead time', 'MAE', 'Bias', 'RMSE', 'Forecasts'],
          rows: data.map((b) => [`${b.lead_from}–${b.lead_to} h`, mw(b.mae), signedMw(b.bias), mw(b.rmse), b.count]),
        }}
      >
        <div className="chart-lg">
          <ResponsiveContainer>
            <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 16, left: 0 }}>
              <CartesianGrid {...gridProps} />
              <ReferenceArea x1={leadFrom} x2={Math.min(leadTo, 48)} fill="var(--hover)" stroke="none"
                             label={{ value: 'Day-ahead decision window', fill: 'var(--muted)', fontSize: 12, position: 'insideTop' }} />
              <XAxis dataKey="mid" type="number" domain={[0, 48]} ticks={[0, 6, 12, 18, 24, 30, 36, 42, 48]} {...axisProps}
                     label={{ value: 'Hours ahead of delivery', position: 'insideBottom', offset: -10, fill: 'var(--muted)', fontSize: 12 }} />
              <YAxis {...axisProps} tickFormatter={gw} width={56} domain={[0, 'auto']} />
              <Tooltip {...tooltipProps} labelFormatter={(v) => `~${v} h ahead`} formatter={(v, name) => [mw(+v), name]} />
              <Legend {...legendProps} verticalAlign="top" wrapperStyle={{ fontSize: 13, paddingBottom: 8 }} />
              <Line dataKey="mae" name="MAE" stroke={color.actual} strokeWidth={2} dot={{ r: 4 }} isAnimationActive={false} />
              <Line dataKey="bias" name="Bias (forecast − actual)" stroke={color.forecast} strokeWidth={2} dot={{ r: 4 }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </>
  )
}
