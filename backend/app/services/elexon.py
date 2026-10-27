"""Client for the Elexon BMRS Insights API (no API key required).

Only two datasets are used:
- FUELHH  : actual half-hourly generation by fuel type (we keep fuelType == "WIND")
- WINDFOR : national wind generation forecasts (hourly, re-published several times a day)
"""

from datetime import datetime, timedelta

import httpx

BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1/datasets"
CHUNK = timedelta(days=7)  # keep each request small and fast


def _iso(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def _fetch_stream(dataset: str, start: datetime, end: datetime, extra: dict | None = None) -> list[dict]:
    """Fetch a dataset by publish time, in weekly chunks, from start (inclusive) to end (exclusive)."""
    rows: list[dict] = []
    with httpx.Client(timeout=60) as client:
        chunk_start = start
        while chunk_start < end:
            chunk_end = min(chunk_start + CHUNK, end)
            params = {
                "publishDateTimeFrom": _iso(chunk_start),
                # API treats "To" as inclusive; step back a second to avoid duplicates between chunks
                "publishDateTimeTo": _iso(chunk_end - timedelta(seconds=1)),
                **(extra or {}),
            }
            resp = client.get(f"{BASE_URL}/{dataset}/stream", params=params)
            resp.raise_for_status()
            rows.extend(resp.json())
            chunk_start = chunk_end
    return rows


def fetch_actuals(start: datetime, end: datetime) -> list[dict]:
    """Actual wind generation, one row per 30-minute slot: {startTime, generation}."""
    raw = _fetch_stream("FUELHH", start, end, {"fuelType": "WIND"})
    # If a slot was ever re-published, keep the most recent value
    latest: dict[str, dict] = {}
    for r in raw:
        prev = latest.get(r["startTime"])
        if prev is None or r["publishTime"] > prev["publishTime"]:
            latest[r["startTime"]] = r
    return sorted(
        ({"startTime": r["startTime"], "generation": r["generation"]} for r in latest.values()),
        key=lambda r: r["startTime"],
    )


def fetch_forecasts(start: datetime, end: datetime) -> list[dict]:
    """Every wind forecast published in the window: {publishTime, startTime, generation}."""
    raw = _fetch_stream("WINDFOR", start, end)
    unique = {(r["publishTime"], r["startTime"]): r for r in raw}
    return sorted(
        ({"publishTime": r["publishTime"], "startTime": r["startTime"], "generation": r["generation"]}
         for r in unique.values()),
        key=lambda r: (r["publishTime"], r["startTime"]),
    )
