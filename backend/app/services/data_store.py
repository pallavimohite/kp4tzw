"""Loads the cached Elexon data once and indexes it for fast lookups."""

import bisect
import json
from dataclasses import dataclass
from datetime import datetime
from functools import lru_cache
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


@dataclass(frozen=True)
class Forecast:
    publish_time: datetime
    start_time: datetime
    generation: float


def _parse(ts: str) -> datetime:
    return datetime.fromisoformat(ts.replace("Z", "+00:00"))


class DataStore:
    def __init__(self, actuals: list[dict], forecasts: list[dict]):
        # Actual generation (MW) keyed by the start of each 30-minute slot
        self.actuals: dict[datetime, float] = {_parse(a["startTime"]): a["generation"] for a in actuals}

        # For every target time, all forecasts made for it, oldest publish first
        self.forecasts_by_target: dict[datetime, list[Forecast]] = {}
        for f in forecasts:
            fc = Forecast(_parse(f["publishTime"]), _parse(f["startTime"]), f["generation"])
            self.forecasts_by_target.setdefault(fc.start_time, []).append(fc)
        for items in self.forecasts_by_target.values():
            items.sort(key=lambda fc: fc.publish_time)
        self._publish_times = {t: [fc.publish_time for fc in items] for t, items in self.forecasts_by_target.items()}

    def latest_forecast_before(self, target: datetime, cutoff: datetime) -> Forecast | None:
        """THE core rule: the newest forecast for `target` that was published at or before `cutoff`."""
        times = self._publish_times.get(target)
        if not times:
            return None
        idx = bisect.bisect_right(times, cutoff) - 1
        return self.forecasts_by_target[target][idx] if idx >= 0 else None

    def all_forecasts(self):
        for items in self.forecasts_by_target.values():
            yield from items


@lru_cache(maxsize=1)
def get_store() -> DataStore:
    actuals = json.loads((DATA_DIR / "actuals.json").read_text())
    forecasts = json.loads((DATA_DIR / "forecasts.json").read_text())
    return DataStore(actuals, forecasts)
