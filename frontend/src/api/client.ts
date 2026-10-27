// Typed client for the FastAPI backend. Error convention: error = forecast - actual (MW).

export interface CutoffPreset {
  time: string
  label: string
}

export interface Meta {
  first_delivery_day: string
  last_delivery_day: string
  default_cutoff: string
  cutoff_presets: CutoffPreset[]
}

export interface Summary {
  count: number
  mae: number
  rmse: number
  bias: number
  nmae_pct: number | null
  p10: number
  p50: number
  p90: number
  max_over_forecast: number
  max_under_forecast: number
  mean_actual: number
}

export interface DayPoint {
  time: string
  actual: number | null
  forecast: number | null
  error: number | null
  lead_hours: number | null
  band_low: number | null
  band_high: number | null
}

export interface DayView {
  date: string
  decision_time: string
  forecast_published: string | null
  summary: Summary
  band: { p10: number; p90: number }
  points: DayPoint[]
}

export interface AccuracyReport {
  overall: Summary
  by_hour: (Summary & { hour: number })[]
  by_day: (Summary & { date: string })[]
  histogram: { from: number; to: number; count: number }[]
  series: { time: string; forecast: number; actual: number }[]
}

export type HorizonBucket = Summary & { lead_from: number; lead_to: number }

async function get<T>(path: string): Promise<T> {
  const res = await fetch(path)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail ?? `Request failed (${res.status})`)
  }
  return res.json()
}

export const api = {
  meta: () => get<Meta>('/api/meta'),
  day: (date: string, cutoff: string) => get<DayView>(`/api/day/${date}?cutoff=${cutoff}`),
  accuracy: (cutoff: string) => get<AccuracyReport>(`/api/accuracy?cutoff=${cutoff}`),
  horizon: () => get<HorizonBucket[]>('/api/horizon'),
}
