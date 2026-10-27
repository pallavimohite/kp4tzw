# Wind Forecast Monitor

A web app that helps a UK energy utility's day-ahead trading team answer two questions:

1. **What was the latest wind forecast available when we had to place our day-ahead order?**
2. **How accurate are those forecasts, so we can size the safety margin we buy?**

Data: GB national wind generation from [Elexon BMRS](https://bmrs.elexon.co.uk/), actuals (`FUELHH`, fuelType `WIND`) and forecasts (`WINDFOR`), for purchase decisions made in **January 2026**.

**Live app:** _link to be added after deployment_

---

## The core rule

Power for delivery day **D** is bought on **D-1** before the day-ahead auction closes
(default **09:20 UK time**, the EPEX GB day-ahead gate closure. Nord Pool N2EX at 09:50 is also selectable,
or any custom time). Elexon re-publishes the wind forecast about 8 times a day, so each hour of D has many forecasts.

> For every hour of D, the app uses **the newest forecast published at or before the cutoff on D-1**,
> never one published later. That is exactly the information the buyer had.

Example: for 2 Jan 15:00 with a 09:20 cutoff, the forecast published 1 Jan 07:30 is used. The 1 Jan 09:30 and later
forecasts are ignored, even though they are more accurate.

Error convention: **error = forecast − actual**. Positive means less wind arrived than forecast, so the buyer was short.

## Key findings (09:20 cutoff, January 2026)

| Metric | Value |
|---|---|
| Mean absolute error (MAE) | ~2,020 MW (18% of average wind) |
| Bias | **+1,750 MW**: forecasts over-stated wind most days |
| 80% of hours, error between | −430 MW and +4,150 MW |
| Error vs lead time | ~1,670 MW at 0–3 h ahead → ~2,360 MW at 45–48 h ahead |

The over-forecast bias is present at every lead time, so it is systematic (a plausible cause is wind farm
curtailment in a windy month), not just forecast age. Planning for "forecast minus P90 error" would have covered
actual wind in 9 of 10 hours.

## Features

- **Daily view:** pick a delivery day and see the decision-time forecast vs actual (30-min), an 80% uncertainty
  band built from January's error distribution, and when the decision and forecast were made.
- **Forecast accuracy:** MAE, RMSE, bias, nMAE, P10/P90, daily bias chart, error by hour of day, error histogram,
  and hardest days (click through to the daily view).
- **Forecast horizon:** error vs lead time using every published forecast, with the day-ahead decision window shaded.
- **Configurable cutoff** shared across all pages; every chart has a table view; light/dark theme.

## Architecture

```
Elexon API ──(fetch script)──> cached JSON ──> FastAPI services ──> REST API ──> React + Recharts
                                               (forecast rule,
                                                metrics)
```

- **Backend:** Python 3.12, FastAPI, plain Python (no pandas) so it stays small and fast as a serverless function.
  The data is historical, so it is fetched once and cached in the repo. The app does not depend on Elexon being up.
- **Frontend:** React 19 + TypeScript + Vite, Recharts for charts.
- **Deployment:** Docker Compose for local runs; Vercel (static frontend + Python function) for the live app.
- **CI:** GitHub Actions runs backend tests, frontend lint and build on every push.

## Repository layout

```
├── backend/
│   ├── app/
│   │   ├── main.py              FastAPI app (CORS, router)
│   │   ├── api/routes.py        HTTP endpoints: validation and JSON shaping only
│   │   ├── services/
│   │   │   ├── elexon.py        Elexon BMRS client (FUELHH, WINDFOR)
│   │   │   ├── data_store.py    loads cached data, indexes forecasts by target time
│   │   │   ├── forecast.py      decision cutoff + "latest forecast before cutoff" rule
│   │   │   └── metrics.py       MAE, RMSE, bias, percentiles, breakdowns, horizon analysis
│   │   └── data/                cached January 2026 actuals.json + forecasts.json
│   ├── scripts/fetch_data.py    re-downloads the data from Elexon
│   ├── tests/                   pytest: cutoff rule, clock changes, metrics, API
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/client.ts        typed API client
│   │   ├── hooks/useApi.ts      data-fetching hook
│   │   ├── components/          stat tiles, chart cards, chart theme
│   │   ├── pages/               DayPage, AccuracyPage, HorizonPage
│   │   ├── format.ts            number/date formatting (UK time)
│   │   └── App.tsx              layout, tabs, shared cutoff selector
│   ├── nginx.conf               serves the build and proxies /api in Docker
│   └── Dockerfile
├── api/index.py                 Vercel entry point (re-exports the FastAPI app)
├── vercel.json                  Vercel build + routing config
├── requirements.txt             Python deps for the Vercel function
├── docker-compose.yml
└── .github/workflows/ci.yml
```

## Running it

### Option 1: Docker (recommended)

```bash
docker compose up --build
```

Open http://localhost:3000.

### Option 2: run locally without Docker

```bash
# backend (terminal 1)
cd backend
python -m venv .venv
.venv/Scripts/activate          # Windows; use `source .venv/bin/activate` on macOS/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000     # API docs at http://localhost:8000/docs

# frontend (terminal 2)
cd frontend
npm install
npm run dev                     # http://localhost:5173 (proxies /api to :8000)
```

### Tests

```bash
cd backend && pytest -q
cd frontend && npm run lint && npm run build
```

### Refresh the data

```bash
cd backend && python -m scripts.fetch_data
```

## API

| Endpoint | Description |
|---|---|
| `GET /api/meta` | Delivery-day range, default cutoff, cutoff presets |
| `GET /api/day/{date}?cutoff=HH:MM` | Decision-time forecast vs actual for one delivery day, plus uncertainty band |
| `GET /api/accuracy?cutoff=HH:MM&start=&end=` | Accuracy metrics and breakdowns over delivery days |
| `GET /api/horizon?bucket_hours=3` | Error by forecast lead time |

Interactive docs: `/docs` (Swagger UI) when running the backend.

## Assumptions and limitations

- Delivery day = UK calendar day (00:00–24:00 local). January is GMT, but the code is timezone-aware
  (clock-change days have 46/50 slots and are tested).
- Decisions on 1–31 Jan 2026 → delivery days 2 Jan – 1 Feb 2026.
- Forecasts are hourly and actuals half-hourly; accuracy is scored on the hourly slots where both exist.
- The uncertainty band uses the whole month's errors (in-sample). In production it would use a rolling
  window of past errors only.
- Only Elexon national wind data is used, as required (no demand, prices or other fuels).

## Use of AI tools

This project was built with help from an AI coding assistant (Claude Code), used for scaffolding, code
generation, domain research (day-ahead gate closure times) and review. All design decisions, data checks and
results were reviewed and verified by me.
