import { useState, type ReactNode } from 'react'

/** A numbered report section: "1 · How wrong is the forecast?" */
export function Section({ id, number, title, standfirst, children }: {
  id: string
  number: string
  title: string
  standfirst?: ReactNode
  children: ReactNode
}) {
  return (
    <section id={id} className="section">
      <div className="section-num">{number}</div>
      <h2 className="section-title">{title}</h2>
      {standfirst && <p className="standfirst">{standfirst}</p>}
      {children}
    </section>
  )
}

/** One big number with a short caption underneath, newspaper "by the numbers" style. */
export function Figure({ value, caption }: { value: string; caption: ReactNode }) {
  return (
    <div className="figure">
      <div className="figure-value">{value}</div>
      <div className="figure-caption">{caption}</div>
    </div>
  )
}

/** Inline colour key, e.g. "— Forecast  — Actual", used instead of a chart legend box. */
export function Key({ items }: { items: { label: string; color: string; band?: boolean }[] }) {
  return (
    <div className="key">
      {items.map((i) => (
        <span key={i.label}>
          <i className={i.band ? 'swatch band' : 'swatch'} style={{ background: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  )
}

/** A chart with title, optional key, a data-table toggle and a source line. */
export function Chart({ title, note, keyItems, table, children }: {
  title: string
  note?: ReactNode
  keyItems?: { label: string; color: string; band?: boolean }[]
  table?: { columns: string[]; rows: (string | number)[][] }
  children: ReactNode
}) {
  const [showTable, setShowTable] = useState(false)
  return (
    <figure className="chart">
      <figcaption>
        <div className="chart-title">{title}</div>
        {note && <div className="chart-note">{note}</div>}
        {keyItems && <Key items={keyItems} />}
      </figcaption>
      {showTable && table ? (
        <div className="table-wrap">
          <table>
            <thead><tr>{table.columns.map((c) => <th key={c}>{c}</th>)}</tr></thead>
            <tbody>{table.rows.map((r, i) => <tr key={i}>{r.map((v, j) => <td key={j}>{v}</td>)}</tr>)}</tbody>
          </table>
        </div>
      ) : children}
      <div className="chart-foot">
        <span>Source: Elexon BMRS (FUELHH, WINDFOR)</span>
        {table && (
          <button className="text-btn" onClick={() => setShowTable((s) => !s)}>
            {showTable ? 'Show chart' : 'Show data'}
          </button>
        )}
      </div>
    </figure>
  )
}

export function Status({ loading, error }: { loading: boolean; error: string | null }) {
  if (error) return <p className="status error">Could not load data: {error}</p>
  if (loading) return <p className="status">Loading…</p>
  return null
}
