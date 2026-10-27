import { useState, type ReactNode } from 'react'
import { Icon, type IconName } from './icons'

type Tone = 'neutral' | 'warn' | 'good' | 'info'

export function Chip({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`chip chip-${tone}`}>{children}</span>
}

export function StatTile({ icon, label, value, hint, chip }: {
  icon: IconName
  label: string
  value: string
  hint?: string
  chip?: { tone: Tone; text: string }
}) {
  return (
    <div className="tile">
      <div className="tile-top">
        <span className="tile-icon"><Icon name={icon} /></span>
        <span className="tile-label">{label}</span>
      </div>
      <div className="tile-value">{value}</div>
      <div className="tile-foot">
        {chip && <Chip tone={chip.tone}>{chip.text}</Chip>}
        {hint && <span className="tile-hint">{hint}</span>}
      </div>
    </div>
  )
}

export function PageIntro({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div className="page-intro">
      <div className="eyebrow">{eyebrow}</div>
      <h2 className="page-title">{title}</h2>
      {children && <p className="page-lead">{children}</p>}
    </div>
  )
}

/** Highlighted key message at the top of a page. */
export function Insight({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="insight">
      <span className="insight-icon"><Icon name="bolt" size={20} /></span>
      <div>
        <div className="insight-title">{title}</div>
        <div className="insight-body">{children}</div>
      </div>
    </div>
  )
}

/** A card holding one chart, with a toggle to show the same data as a table (accessibility). */
export function ChartCard({ title, subtitle, table, children }: {
  title: string
  subtitle?: ReactNode
  table?: { columns: string[]; rows: (string | number)[][] }
  children: ReactNode
}) {
  const [showTable, setShowTable] = useState(false)
  return (
    <section className="card">
      <header className="card-head">
        <div>
          <h3>{title}</h3>
          {subtitle && <p className="card-sub">{subtitle}</p>}
        </div>
        {table && (
          <button className="ghost-btn" onClick={() => setShowTable((s) => !s)}>
            <Icon name={showTable ? 'chart' : 'table'} size={15} />
            {showTable ? 'Chart' : 'Table'}
          </button>
        )}
      </header>
      {showTable && table ? (
        <div className="table-wrap">
          <table>
            <thead><tr>{table.columns.map((c) => <th key={c}>{c}</th>)}</tr></thead>
            <tbody>
              {table.rows.map((r, i) => <tr key={i}>{r.map((v, j) => <td key={j}>{v}</td>)}</tr>)}
            </tbody>
          </table>
        </div>
      ) : children}
    </section>
  )
}

export function Status({ loading, error }: { loading: boolean; error: string | null }) {
  if (error) return <div className="notice error"><Icon name="alert" /> Could not load data: {error}</div>
  if (loading) return <div className="notice"><span className="spinner" /> Loading data…</div>
  return null
}
