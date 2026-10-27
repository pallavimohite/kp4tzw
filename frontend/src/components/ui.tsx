import { useState, type ReactNode } from 'react'

/** One headline number. `tone` colours the number itself: bad news in red, good news in green.
 *  `hint` is the longer explanation, shown on hover so the card itself stays short. */
export function StatTile({ label, value, note, tone, hint, visual }: {
  label: string
  value: string
  note?: ReactNode
  tone?: 'bad' | 'good'
  hint?: string
  visual?: ReactNode
}) {
  return (
    <div className="tile" title={hint}>
      <div className="tile-label">{label}</div>
      <div className={`tile-value ${tone ?? ''}`}>{value}</div>
      {visual}
      {note && <div className="tile-note">{note}</div>}
    </div>
  )
}

export function PageIntro({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="page-intro">
      <h2 className="page-title">{title}</h2>
      {children && <p className="page-lead">{children}</p>}
    </div>
  )
}

/** The one sentence the reader should remember from a page. */
export function KeyFinding({ children }: { children: ReactNode }) {
  return (
    <div className="finding">
      <div className="finding-label">Key finding</div>
      <p>{children}</p>
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
          <button className="link-btn" onClick={() => setShowTable((s) => !s)}>
            {showTable ? 'Show chart' : 'Show data'}
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
  if (error) return <div className="notice error">Could not load data: {error}</div>
  if (loading) return <div className="notice"><span className="spinner" /> Loading data…</div>
  return null
}
