/** Footnote-style notes on how the numbers were produced. */
export function MethodNotes() {
  return (
    <section id="method" className="notes">
      <h2 className="notes-title">Notes on method</h2>
      <ol>
        <li>
          <strong>Only what the desk knew.</strong> Power for day D is bought on D-1 before the auction closes: 09:20 UK
          for EPEX GB, 09:50 for Nord Pool N2EX. Elexon re-issues the wind forecast about eight times a day. For every
          hour we use the newest forecast published at or before the deadline, and ignore anything later.
        </li>
        <li>
          <strong>Data.</strong> Actual generation from Elexon <code>FUELHH</code> (fuel type WIND, half-hourly);
          forecasts from <code>WINDFOR</code> (hourly). Orders placed 1–31 January 2026, so delivery days are
          2 January to 1 February. Hours are scored where both a forecast and an actual exist.
        </li>
        <li>
          <strong>Measures.</strong> <em>Miss</em> (MAE) is the average size of the error in MW. <em>Bias</em> is
          the average of forecast minus actual; positive means the desk was short. The <em>80% range</em> runs from
          the 10th to the 90th percentile of errors; the 90th percentile is the margin that covered 9 hours in 10.
        </li>
        <li>
          <strong>Caveats.</strong> Delivery days are UK calendar days, with clock changes handled. The 80% range
          uses the whole month's errors; in live use it would only use past errors. A likely cause of the bias is
          wind farms being curtailed for grid reasons, which this data alone cannot confirm.
        </li>
      </ol>
    </section>
  )
}
