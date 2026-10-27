import { dateTime, longDate } from '../format'

/** Visual of the core rule: forecast published -> order deadline -> delivery day. */
export function DecisionTimeline({ published, decision, deliveryDate, leadFrom, leadTo }: {
  published: string | null
  decision: string
  deliveryDate: string
  leadFrom: number | null
  leadTo: number | null
}) {
  const steps = [
    { cls: 'forecast', label: 'Forecast used', value: published ? dateTime(published) : 'None available',
      note: 'Newest one published before the deadline' },
    { cls: 'deadline', label: 'Order deadline', value: dateTime(decision), note: 'Anything published later is ignored' },
    { cls: 'delivery', label: 'Power delivered', value: `${longDate(deliveryDate)}, 00:00–24:00`,
      note: leadFrom != null && leadTo != null ? `${leadFrom}–${leadTo} h after the forecast` : 'No forecast available' },
  ]
  return (
    <ol className="timeline" aria-label="Decision timeline">
      {steps.map((s) => (
        <li key={s.cls} className={`tl-step tl-${s.cls}`}>
          <div className="tl-label">{s.label}</div>
          <div className="tl-value">{s.value}</div>
          <div className="tl-note">{s.note}</div>
        </li>
      ))}
    </ol>
  )
}
