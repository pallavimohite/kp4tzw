"""Download January 2026 wind data from Elexon and cache it as JSON in backend/app/data.

Purchase decisions are made 1-31 Jan 2026, so delivery days are 2 Jan - 1 Feb 2026.
We fetch a few extra days of forecasts on either side so any cutoff time and the
forecast-horizon analysis have the data they need.

Run from the backend folder:  python -m scripts.fetch_data
"""

import json
from datetime import datetime, timezone
from pathlib import Path

from app.services.elexon import fetch_actuals, fetch_forecasts

DATA_DIR = Path(__file__).resolve().parent.parent / "app" / "data"

# January is GMT, so UK local time == UTC for this window
ACTUALS_FROM = datetime(2026, 1, 2, tzinfo=timezone.utc)
ACTUALS_TO = datetime(2026, 2, 2, 1, tzinfo=timezone.utc)  # publishTime lags startTime by 30 min
FORECASTS_FROM = datetime(2025, 12, 29, tzinfo=timezone.utc)
FORECASTS_TO = datetime(2026, 2, 2, tzinfo=timezone.utc)


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    actuals = [a for a in fetch_actuals(ACTUALS_FROM, ACTUALS_TO)
               if "2026-01-02" <= a["startTime"] < "2026-02-02"]
    (DATA_DIR / "actuals.json").write_text(json.dumps(actuals))
    print(f"actuals:   {len(actuals)} rows  {actuals[0]['startTime']} -> {actuals[-1]['startTime']}")

    forecasts = fetch_forecasts(FORECASTS_FROM, FORECASTS_TO)
    (DATA_DIR / "forecasts.json").write_text(json.dumps(forecasts))
    publishes = sorted({f["publishTime"] for f in forecasts})
    print(f"forecasts: {len(forecasts)} rows from {len(publishes)} publishes  {publishes[0]} -> {publishes[-1]}")


if __name__ == "__main__":
    main()
