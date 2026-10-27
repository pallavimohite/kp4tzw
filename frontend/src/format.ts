// Display helpers. All times are shown in UK local time.

const UK = 'Europe/London'

export const mw = (v: number | null | undefined) =>
  v == null ? '–' : `${Math.round(v).toLocaleString('en-GB')} MW`

export const signedMw = (v: number | null | undefined) =>
  v == null ? '–' : `${v > 0 ? '+' : ''}${Math.round(v).toLocaleString('en-GB')} MW`

export const gw = (v: number) => `${+(v / 1000).toFixed(1)} GW`

export const clock = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: UK })

export const dateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: UK,
  })

export const shortDate = (isoDate: string) =>
  new Date(`${isoDate}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: UK })

export const longDate = (isoDate: string) =>
  new Date(`${isoDate}T12:00:00Z`).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', timeZone: UK,
  })
