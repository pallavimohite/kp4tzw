// Small inline icon set (24px grid, stroke icons) so no icon library is needed.

const paths = {
  wind: 'M3 8h10a3 3 0 1 0-3-3 M3 12h15a3 3 0 1 1-3 3 M3 16h7',
  gauge: 'M12 14l4-4 M3.3 17a9 9 0 1 1 17.4 0',
  trend: 'M3 17l6-6 4 4 8-8 M14 7h7v7',
  alert: 'M12 9v4 M12 17h.01 M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  clock: 'M12 7v5l3 2 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  calendar: 'M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  target: 'M12 12h.01 M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0z M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  range: 'M4 12h16 M4 8v8 M20 8v8',
  bolt: 'M13 2L4 14h7l-1 8 9-12h-7z',
  chart: 'M4 20V10 M10 20V4 M16 20v-7 M22 20H2',
  book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14z M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5',
  layers: 'M12 2l10 5-10 5L2 7z M2 12l10 5 10-5 M2 17l10 5 10-5',
  chevronLeft: 'M15 18l-6-6 6-6',
  chevronRight: 'M9 18l6-6-6-6',
  table: 'M3 5h18v14H3z M3 10h18 M3 15h18 M9 5v14',
  database: 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3z M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6 M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
}

export type IconName = keyof typeof paths

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  )
}
