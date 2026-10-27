import { useState } from 'react'
import { api } from './api/client'
import { Status } from './components/ui'
import { useApi } from './hooks/useApi'
import { AccuracyPage } from './pages/AccuracyPage'
import { DayPage } from './pages/DayPage'
import { HorizonPage } from './pages/HorizonPage'

type Tab = 'day' | 'accuracy' | 'horizon'

const TABS: { id: Tab; label: string }[] = [
  { id: 'day', label: 'Daily view' },
  { id: 'accuracy', label: 'Forecast accuracy' },
  { id: 'horizon', label: 'Forecast horizon' },
]

export default function App() {
  const { data: meta, error, loading } = useApi(api.meta, [])
  const [tab, setTabState] = useState<Tab>(() => {
    const fromUrl = window.location.hash.slice(1) as Tab
    return TABS.some((t) => t.id === fromUrl) ? fromUrl : 'day'
  })
  const [cutoff, setCutoff] = useState('09:20')
  const [day, setDay] = useState('2026-01-15')

  // Keep the open tab in the URL so views can be bookmarked and shared
  const setTab = (t: Tab) => { setTabState(t); window.history.replaceState(null, '', `#${t}`) }
  const openDay = (d: string) => { setDay(d); setTab('day') }

  return (
    <div className="app">
      <header className="top">
        <div>
          <h1>Wind Forecast Monitor</h1>
          <p className="muted">GB national wind generation · day-ahead decisions for January 2026 · source: Elexon BMRS</p>
        </div>
        {meta && (
          <label className="cutoff">
            <span>Decision cutoff (day before, UK time)</span>
            <select value={meta.cutoff_presets.some((p) => p.time === cutoff) ? cutoff : 'custom'}
                    onChange={(e) => e.target.value !== 'custom' && setCutoff(e.target.value)}>
              {meta.cutoff_presets.map((p) => <option key={p.time} value={p.time}>{p.label}</option>)}
              <option value="custom">Custom time…</option>
            </select>
            <input type="time" value={cutoff} onChange={(e) => e.target.value && setCutoff(e.target.value)}
                   aria-label="Custom cutoff time" />
          </label>
        )}
      </header>

      <nav className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'active' : ''}
                  onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>

      <main>
        <Status loading={loading} error={error} />
        {meta && tab === 'day' && <DayPage meta={meta} cutoff={cutoff} day={day} setDay={setDay} />}
        {meta && tab === 'accuracy' && <AccuracyPage cutoff={cutoff} openDay={openDay} />}
        {meta && tab === 'horizon' && <HorizonPage cutoff={cutoff} />}
      </main>

      <footer className="muted">
        Error = forecast − actual. Positive means less wind arrived than forecast, so extra power had to be bought.
      </footer>
    </div>
  )
}
