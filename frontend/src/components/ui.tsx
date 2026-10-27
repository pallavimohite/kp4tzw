import { useState, type ReactNode } from 'react'

export function StatTile({ label, value, hint, tone }: {
  label: string
  value: string
  hint?: string
  tone?: 'warn'
}) {
  return (
    <div className={`tile ${tone ?? ''}`}>
      <div className="tile-label">{label}</div>
      <div className="tile-value">{value}</div>
      {hint && <div className="tile-hint">{hint}</div>}
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
          <h2>{title}</h2>
          {subtitle && <p className="muted">{subtitle}</p>}
        </div>
        {table && (
          <button className="link-btn" onClick={() => setShowTable((s) => !s)}>
            {showTable ? 'Show chart' : 'Show table'}
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
  if (loading) return <div className="notice">Loading…</div>
  return null
}
