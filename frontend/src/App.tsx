import { useState } from 'react'
import { api } from './api/client'
import { Status } from './components/ui'
import { useApi } from './hooks/useApi'
import { AccuracyPage } from './pages/AccuracyPage'
import { DayPage } from './pages/DayPage'
import { HorizonPage } from './pages/HorizonPage'
import { MethodologyPage } from './pages/MethodologyPage'

type Tab = 'overview' | 'day' | 'horizon' | 'method'

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'day', label: 'Daily view' },
  { id: 'horizon', label: 'Forecast horizon' },
  { id: 'method', label: 'Methodology' },
]

/** Turbine mark: three slender blades round a hub, on a tapered tower. */
function Logo() {
  const blade = 'M16 12 C17.4 9.2 17.1 5.4 16 2.2 C15.2 5.4 15 9.2 16 12 Z'
  return (
    <svg className="logo" viewBox="0 0 32 32" aria-hidden="true">
      <path d="M15.3 13 L14.6 30 H17.4 L16.7 13 Z" fill="currentColor" opacity="0.55" />
      <g fill="currentColor" transform="rotate(15 16 12)">
        <path d={blade} />
        <path d={blade} transform="rotate(120 16 12)" />
        <path d={blade} transform="rotate(240 16 12)" />
      </g>
      <circle cx="16" cy="12" r="1.7" fill="currentColor" />
    </svg>
  )
}

export default function App() {
  const { data: meta, error, loading } = useApi(api.meta, [])
  const [tab, setTabState] = useState<Tab>(() => {
    const fromUrl = window.location.hash.slice(1) as Tab
    return TABS.some((t) => t.id === fromUrl) ? fromUrl : 'overview'
  })
  const [cutoff, setCutoff] = useState('09:20')
  const [day, setDay] = useState('2026-01-15')

  // Keep the open tab in the URL so views can be bookmarked and shared
  const setTab = (t: Tab) => { setTabState(t); window.history.replaceState(null, '', `#${t}`) }
  const openDay = (d: string) => { setDay(d); setTab('day') }
  const isPreset = meta?.cutoff_presets.some((p) => p.time === cutoff)

  return (
    <>
      <header className="appbar">
        <div className="appbar-inner">
          <div className="brand">
            <Logo />
            <span className="brand-name">WindSight</span>
          </div>
          <nav className="tabs" role="tablist">
            {TABS.map((t) => (
              <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'active' : ''}
                      onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </nav>
          {meta && (
            <div className="deadline" title="Order deadline on the day before delivery, UK time">
              <span className="deadline-label">Deadline</span>
              <div className="segmented" role="group" aria-label="Order deadline">
                {meta.cutoff_presets.map((p) => (
                  <button key={p.time} className={cutoff === p.time ? 'active' : ''} onClick={() => setCutoff(p.time)}
                          title={p.label}>
                    {p.label.split(' ')[0] === 'Nord' ? 'N2EX' : 'EPEX'} {p.time}
                  </button>
                ))}
                <label className={`seg-custom ${!isPreset ? 'active' : ''}`}>
                  <input type="time" value={cutoff} onChange={(e) => e.target.value && setCutoff(e.target.value)}
                         aria-label="Custom order deadline" />
                </label>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="app">
        <main>
          <Status loading={loading} error={error} />
          {meta && tab === 'overview' && <AccuracyPage cutoff={cutoff} openDay={openDay} />}
          {meta && tab === 'day' && <DayPage meta={meta} cutoff={cutoff} day={day} setDay={setDay} />}
          {meta && tab === 'horizon' && <HorizonPage cutoff={cutoff} />}
          {tab === 'method' && <MethodologyPage />}
        </main>

        <footer>
          <span>GB national wind · day-ahead pilot, January 2026 · error = forecast − actual</span>
          <span>Data: Elexon BMRS (FUELHH, WINDFOR)</span>
        </footer>
      </div>
    </>
  )
}
