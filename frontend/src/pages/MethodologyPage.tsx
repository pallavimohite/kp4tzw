import type { ReactNode } from 'react'
import { Icon, type IconName } from '../components/icons'
import { PageIntro } from '../components/ui'

const METRICS: [string, string][] = [
  ['MAE (average error)', 'Average size of the miss in MW, ignoring direction. "How wrong is a typical hour?"'],
  ['Bias', 'Average of forecast − actual. Positive means the forecast promised more wind than arrived, so the desk was short.'],
  ['RMSE', 'Like MAE but punishes large misses more. Useful when big surprises are costly.'],
  ['P10 / P90', '80% of hourly errors fall between these values. P90 is a practical safety margin to buy.'],
  ['nMAE', 'MAE as a percentage of average wind output, to compare periods with different wind levels.'],
]

function Section({ icon, title, children }: { icon: IconName; title: string; children: ReactNode }) {
  return (
    <section className="card method">
      <div className="method-head"><span className="tile-icon"><Icon name={icon} /></span><h3>{title}</h3></div>
      {children}
    </section>
  )
}

export function MethodologyPage() {
  return (
    <>
      <PageIntro eyebrow="Methodology" title="How the numbers are produced">
        A transparent, reproducible approach, so every figure in this tool can be traced back to public data.
      </PageIntro>

      <div className="grid-2 grid-halves">
        <Section icon="clock" title="1. Only what you knew at the deadline">
          <p>Day-ahead power for day <strong>D</strong> is bought on <strong>D-1</strong> before the auction closes
            (09:20 UK for EPEX GB, 09:50 for Nord Pool N2EX). Elexon publishes a new wind forecast about 8 times a day,
            so each hour has many forecasts.</p>
          <p>For every hour we use <strong>the newest forecast published at or before the deadline</strong>. Later,
            more accurate forecasts are ignored, because the desk could not have seen them.</p>
          <div className="example">
            <div><span className="ex-tag ex-used">Used</span>Published 1 Jan 07:30 → forecast for 2 Jan 15:00</div>
            <div><span className="ex-tag ex-ignored">Ignored</span>Published 1 Jan 09:30 (after the 09:20 deadline)</div>
          </div>
        </Section>

        <Section icon="database" title="2. Data">
          <ul>
            <li><strong>Actual generation:</strong> Elexon BMRS <code>FUELHH</code>, fuel type WIND, every 30 minutes.</li>
            <li><strong>Forecasts:</strong> Elexon BMRS <code>WINDFOR</code>, hourly values, re-published through the day.</li>
            <li><strong>Period:</strong> orders placed 1–31 Jan 2026, so delivery days 2 Jan – 1 Feb 2026.</li>
            <li>Accuracy is scored on hourly slots where both a forecast and an actual exist.</li>
          </ul>
        </Section>

        <Section icon="gauge" title="3. Accuracy measures">
          <dl className="glossary">
            {METRICS.map(([term, def]) => <div key={term}><dt>{term}</dt><dd>{def}</dd></div>)}
          </dl>
        </Section>

        <Section icon="layers" title="4. Assumptions & next steps">
          <ul>
            <li>Delivery day is the UK calendar day; all times are UK local and clock changes are handled.</li>
            <li>The uncertainty band uses the whole month's errors. In production it would use a rolling window of past errors only.</li>
            <li>Next: bias-corrected forecast, regional breakdown, live daily refresh and alerts before the deadline.</li>
          </ul>
        </Section>
      </div>
    </>
  )
}
