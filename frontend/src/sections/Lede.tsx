import type { AccuracyReport } from '../api/client'
import { Figure } from '../components/ui'
import { mw } from '../format'

const gw = (v: number) => (v / 1000).toFixed(1)

/** Opening of the report: the headline finding, written from the data, plus key figures. */
export function Lede({ data, cutoff }: { data: AccuracyReport; cutoff: string }) {
  const o = data.overall
  const shortDays = data.by_day.filter((d) => d.bias > 0).length
  const over = o.bias > 0

  return (
    <header className="lede">
      <h1 className="headline">
        {over
          ? <>The forecast promised {gw(o.bias)} GW more wind than&nbsp;arrived</>
          : <>The forecast under-stated wind by {gw(-o.bias)} GW</>}
      </h1>
      <p className="standfirst">
        On {shortDays} of {data.by_day.length} delivery days in January 2026, the wind forecast available at the {cutoff} order
        deadline over-stated Great Britain's wind output. A desk buying day-ahead power against it would usually have
        been left short, and topping up close to delivery is expensive.
      </p>

      <div className="figures">
        <Figure value={`${gw(o.mae)} GW`} caption={<>typical miss in any hour<br />({o.nmae_pct?.toFixed(0)}% of average output)</>} />
        <Figure value={`${shortDays} of ${data.by_day.length}`} caption={<>days the desk<br />was short of wind</>} />
        <Figure value={`${gw(o.p90)} GW`} caption={<>safety margin that covered<br />9 out of 10 hours</>} />
        <Figure value={`${gw(o.max_over_forecast)} GW`} caption={<>worst single hour<br />({mw(o.max_over_forecast)} short)</>} />
      </div>
    </header>
  )
}
