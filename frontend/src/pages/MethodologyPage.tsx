import type { ReactNode } from 'react'
import { PageIntro } from '../components/ui'

const METRICS: [string, string][] = [
  ['Typical miss (MAE)', 'Average size of the error in MW, ignoring direction. "How wrong is a normal hour?"'],
  ['Bias', 'Average of forecast − actual. Positive means the forecast promised more wind than arrived, so the desk was short.'],
  ['RMSE', 'Like MAE but punishes large misses more. Useful when big surprises are costly.'],
  ['80% range (P10–P90)', '80% of hourly errors fall in this range. The P90 value is a practical safety margin to buy.'],
  ['% of average wind (nMAE)', 'MAE divided by average wind output, to compare calm and windy periods fairly.'],
]

function Note({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="card method">
      <h3><span className="method-n">{n}</span>{title}</h3>
      {children}
    </section>
  )
}

export function MethodologyPage() {
  return (
    <>
      <PageIntro title="How the numbers are produced">
        Everything here comes from public Elexon data and can be reproduced from the code in the repository.
      </PageIntro>

      <div className="grid-2 grid-halves">
        <Note n={1} title="Only what you knew at the deadline">
          <p>Day-ahead power for day <strong>D</strong> is bought on <strong>D-1</strong> before the auction closes
            (09:20 UK for EPEX GB, 09:50 for Nord Pool N2EX). Elexon publishes a new wind forecast about 8 times a day,
            so each hour has many forecasts.</p>
          <p>For every hour we use <strong>the newest forecast published at or before the deadline</strong>. Later,
            more accurate forecasts are ignored, because the desk could not have seen them.</p>
          <div className="example">
            <div><span className="ex-tag ex-used">used</span>published 1 Jan 07:30, forecast for 2 Jan 15:00</div>
            <div><span className="ex-tag ex-ignored">ignored</span>published 1 Jan 09:30, after the 09:20 deadline</div>
          </div>
        </Note>

        <Note n={2} title="Data">
          <ul>
            <li><strong>Actual generation:</strong> Elexon BMRS <code>FUELHH</code>, fuel type WIND, every 30 minutes.</li>
            <li><strong>Forecasts:</strong> Elexon BMRS <code>WINDFOR</code>, hourly values, re-published through the day.</li>
            <li><strong>Period:</strong> orders placed 1–31 Jan 2026, so delivery days 2 Jan – 1 Feb 2026.</li>
            <li>Accuracy is scored on hourly slots where both a forecast and an actual exist.</li>
          </ul>
        </Note>

        <Note n={3} title="Accuracy measures">
          <dl className="glossary">
            {METRICS.map(([term, def]) => <div key={term}><dt>{term}</dt><dd>{def}</dd></div>)}
          </dl>
        </Note>

        <Note n={4} title="Assumptions and next steps">
          <ul>
            <li>Delivery day is the UK calendar day; all times are UK local and clock changes are handled.</li>
            <li>The 80% range uses the whole month's errors. In live use it would only use past errors.</li>
            <li>A likely cause of the bias is wind farms being curtailed for grid reasons; this data alone can't confirm it.</li>
            <li>Next: a bias-corrected forecast, daily automatic refresh and an alert before the deadline.</li>
          </ul>
        </Note>
      </div>
    </>
  )
}
