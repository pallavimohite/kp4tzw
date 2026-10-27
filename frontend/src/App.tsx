import { useState } from 'react'
import { api } from './api/client'
import { Status } from './components/ui'
import { useApi } from './hooks/useApi'
import { AccuracySection } from './sections/AccuracySection'
import { DaySection } from './sections/DaySection'
import { HorizonSection } from './sections/HorizonSection'
import { Lede } from './sections/Lede'
import { MethodNotes } from './sections/MethodNotes'

const NAV = [
  { href: '#accuracy', label: '1 Accuracy' },
  { href: '#day', label: '2 One day' },
  { href: '#horizon', label: '3 Horizon' },
  { href: '#method', label: 'Notes' },
]

export default function App() {
  const { data: meta, error, loading } = useApi(api.meta, [])
  const [cutoff, setCutoff] = useState('09:20')
  const [day, setDay] = useState('2026-01-15')
  const accuracy = useApi(() => api.accuracy(cutoff), [cutoff])

  const isPreset = meta?.cutoff_presets.some((p) => p.time === cutoff) ?? true
  const openDay = (d: string) => {
    setDay(d)
    document.getElementById('day')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <nav className="masthead">
        <div className="masthead-inner">
          <a href="#top" className="wordmark">Wind Forecast Review</a>
          <div className="nav-links">{NAV.map((n) => <a key={n.href} href={n.href}>{n.label}</a>)}</div>
          {meta && (
            <label className="deadline">
              Orders due
              <select value={isPreset ? cutoff : 'custom'}
                      onChange={(e) => setCutoff(e.target.value === 'custom' ? '10:00' : e.target.value)}>
                {meta.cutoff_presets.map((p) => (
                  <option key={p.time} value={p.time}>{p.time} {p.label.split(' ')[0]}</option>
                ))}
                <option value="custom">other time…</option>
              </select>
              {!isPreset && <input type="time" value={cutoff} onChange={(e) => e.target.value && setCutoff(e.target.value)}
                                   aria-label="Custom order deadline" />}
              <span className="deadline-hint">day before</span>
            </label>
          )}
        </div>
      </nav>

      <article id="top" className="report">
        <div className="dateline">
          <span>GB wind · day-ahead pilot · January 2026</span>
          <span>Prepared for the day-ahead trading desk</span>
        </div>

        <Status loading={loading || (accuracy.loading && !accuracy.data)} error={error ?? accuracy.error} />
        {accuracy.data && (
          <div className={accuracy.loading ? 'reloading' : ''}>
            <Lede data={accuracy.data} cutoff={cutoff} />
            <AccuracySection data={accuracy.data} openDay={openDay} />
          </div>
        )}
        {meta && <DaySection meta={meta} cutoff={cutoff} day={day} setDay={setDay} />}
        {meta && <HorizonSection cutoff={cutoff} />}
        <MethodNotes />

        <footer className="colophon">
          Data: Elexon BMRS, national wind generation (FUELHH) and wind forecasts (WINDFOR). Error is always forecast
          minus actual; positive means less wind arrived than forecast.
        </footer>
      </article>
    </>
  )
}
