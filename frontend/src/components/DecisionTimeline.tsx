import { dateTime, longDate } from '../format'
import { Icon } from './icons'

/** Visual of the core rule: forecast published -> order deadline -> delivery day. */
export function DecisionTimeline({ published, decision, deliveryDate, leadFrom, leadTo }: {
  published: string | null
  decision: string
  deliveryDate: string
  leadFrom: number | null
  leadTo: number | null
}) {
  return (
    <div className="timeline" aria-label="Decision timeline">
      <div className="tl-step">
        <span className="tl-dot tl-forecast"><Icon name="wind" size={16} /></span>
        <div className="tl-label">Forecast used</div>
        <div className="tl-value">{published ? dateTime(published) : 'None available'}</div>
        <div className="tl-note">Latest one published before the deadline</div>
      </div>
      <div className="tl-line" />
      <div className="tl-step">
        <span className="tl-dot tl-deadline"><Icon name="clock" size={16} /></span>
        <div className="tl-label">Order deadline</div>
        <div className="tl-value">{dateTime(decision)}</div>
        <div className="tl-note">Later forecasts are ignored</div>
      </div>
      <div className="tl-line" />
      <div className="tl-step">
        <span className="tl-dot tl-delivery"><Icon name="bolt" size={16} /></span>
        <div className="tl-label">Delivery day</div>
        <div className="tl-value">{longDate(deliveryDate)}, 00:00–24:00</div>
        <div className="tl-note">
          {leadFrom != null && leadTo != null ? `Forecast is ${leadFrom}–${leadTo} h ahead` : 'No forecast available'}
        </div>
      </div>
    </div>
  )
}
