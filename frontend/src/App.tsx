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
            <div>
              <div className="brand-name">WindSight</div>
              <div className="brand-tag">How far to trust the wind forecast when buying day-ahead</div>
            </div>
          </div>
          <div className="appbar-meta">GB national wind · Jan 2026 pilot · Elexon BMRS data</div>
        </div>
        <nav className="tabs" role="tablist">
          {TABS.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'active' : ''}
                    onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <div className="app">
        {meta && tab !== 'method' && (
          <div className="toolbar">
            <div className="toolbar-label">
              <strong>Order deadline</strong> on the day before delivery (UK time)
            </div>
            <div className="segmented" role="group" aria-label="Order deadline">
              {meta.cutoff_presets.map((p) => (
                <button key={p.time} className={cutoff === p.time ? 'active' : ''} onClick={() => setCutoff(p.time)}
                        title={p.label}>
                  {p.label.split(' (')[0].replace(' day-ahead auction', '')} <span className="seg-time">{p.time}</span>
                </button>
              ))}
              <label className={`seg-custom ${!isPreset ? 'active' : ''}`}>
                Other
                <input type="time" value={cutoff} onChange={(e) => e.target.value && setCutoff(e.target.value)}
                       aria-label="Custom order deadline" />
              </label>
            </div>
          </div>
        )}

        <main>
          <Status loading={loading} error={error} />
          {meta && tab === 'overview' && <AccuracyPage cutoff={cutoff} openDay={openDay} />}
          {meta && tab === 'day' && <DayPage meta={meta} cutoff={cutoff} day={day} setDay={setDay} />}
          {meta && tab === 'horizon' && <HorizonPage cutoff={cutoff} />}
          {tab === 'method' && <MethodologyPage />}
        </main>

        <footer>
          <span>Error = forecast − actual. Positive means less wind arrived than forecast, so extra power had to be bought.</span>
          <span>Data: Elexon BMRS (FUELHH, WINDFOR)</span>
        </footer>
      </div>
    </>
  )
}
