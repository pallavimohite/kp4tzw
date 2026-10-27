import { useState } from 'react'
import { api } from './api/client'
import { Icon, type IconName } from './components/icons'
import { Status } from './components/ui'
import { useApi } from './hooks/useApi'
import { AccuracyPage } from './pages/AccuracyPage'
import { DayPage } from './pages/DayPage'
import { HorizonPage } from './pages/HorizonPage'
import { MethodologyPage } from './pages/MethodologyPage'

type Tab = 'overview' | 'day' | 'horizon' | 'method'

const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'overview', label: 'Overview', icon: 'gauge' },
  { id: 'day', label: 'Daily view', icon: 'calendar' },
  { id: 'horizon', label: 'Forecast horizon', icon: 'trend' },
  { id: 'method', label: 'Methodology', icon: 'book' },
]

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
            <span className="logo"><Icon name="wind" size={20} /></span>
            <div>
              <div className="brand-name">WindSight</div>
              <div className="brand-tag">Day-ahead wind forecast intelligence</div>
            </div>
          </div>
          <div className="appbar-meta">
            <span className="pill"><span className="dot" /> Pilot · January 2026</span>
            <span className="pill pill-quiet">Source: Elexon BMRS</span>
          </div>
        </div>
        <nav className="tabs" role="tablist">
          {TABS.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'active' : ''}
                    onClick={() => setTab(t.id)}>
              <Icon name={t.icon} size={16} /> {t.label}
            </button>
          ))}
        </nav>
      </header>

      <div className="app">
        {meta && tab !== 'method' && (
          <div className="toolbar">
            <div className="toolbar-label">
              <Icon name="clock" size={16} />
              <span><strong>Order deadline</strong> · day before delivery, UK time</span>
            </div>
            <div className="segmented" role="group" aria-label="Order deadline">
              {meta.cutoff_presets.map((p) => (
                <button key={p.time} className={cutoff === p.time ? 'active' : ''} onClick={() => setCutoff(p.time)}
                        title={p.label}>
                  {p.label.split(' (')[0].replace(' day-ahead auction', '')} <span className="seg-time">{p.time}</span>
                </button>
              ))}
              <label className={`seg-custom ${!isPreset ? 'active' : ''}`}>
                Custom
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
