"""Forecast accuracy metrics. Error convention everywhere: error = forecast - actual (MW)."""

import math
from collections import defaultdict
from zoneinfo import ZoneInfo

from app.services.data_store import DataStore
from app.services.forecast import FIRST_DELIVERY_DAY, LAST_DELIVERY_DAY, Point, delivery_slots

UK = ZoneInfo("Europe/London")


def percentile(values: list[float], q: float) -> float:
    """Linear-interpolated percentile, q in [0, 100]."""
    s = sorted(values)
    k = (len(s) - 1) * q / 100
    lo, hi = math.floor(k), math.ceil(k)
    return s[lo] + (s[hi] - s[lo]) * (k - lo)


def summarise(errors: list[float], actuals: list[float]) -> dict:
    """Headline accuracy numbers for a set of (error, actual) pairs."""
    n = len(errors)
    if n == 0:
        return {"count": 0}
    mae = sum(abs(e) for e in errors) / n
    mean_actual = sum(actuals) / n
    return {
        "count": n,
        "mae": mae,                                           # typical size of the miss
        "rmse": math.sqrt(sum(e * e for e in errors) / n),    # punishes big misses more
        "bias": sum(errors) / n,                              # + means forecasts run too high
        "nmae_pct": 100 * mae / mean_actual if mean_actual else None,  # MAE as % of average wind
        "p10": percentile(errors, 10),
        "p50": percentile(errors, 50),
        "p90": percentile(errors, 90),
        "max_over_forecast": max(errors),    # worst shortfall surprise
        "max_under_forecast": min(errors),   # worst surplus surprise
        "mean_actual": mean_actual,
    }


def accuracy_report(points: list[Point]) -> dict:
    """Overall summary plus breakdowns the buyer cares about."""
    by_hour: dict[int, list[Point]] = defaultdict(list)
    by_day: dict[str, list[Point]] = defaultdict(list)
    for p in points:
        local = p.start_time.astimezone(UK)
        by_hour[local.hour].append(p)
        by_day[local.date().isoformat()].append(p)

    def stats(group: list[Point]) -> dict:
        return summarise([p.error for p in group], [p.actual for p in group])

    errors = [p.error for p in points]
    return {
        "overall": stats(points),
        "by_hour": [{"hour": h, **stats(g)} for h, g in sorted(by_hour.items())],
        "by_day": [{"date": d, **stats(g)} for d, g in sorted(by_day.items())],
        "histogram": histogram(errors, bin_width=500),
    }


def histogram(values: list[float], bin_width: float) -> list[dict]:
    if not values:
        return []
    counts: dict[int, int] = defaultdict(int)
    for v in values:
        counts[math.floor(v / bin_width)] += 1
    lo, hi = min(counts), max(counts)
    return [{"from": b * bin_width, "to": (b + 1) * bin_width, "count": counts.get(b, 0)} for b in range(lo, hi + 1)]


def horizon_report(store: DataStore, bucket_hours: int = 3, max_hours: int = 48) -> list[dict]:
    """How accuracy changes with lead time (target time - publish time), using EVERY forecast
    published for slots in the delivery period. Shows how much an earlier/later cutoff costs."""
    in_period = {s for d in range((LAST_DELIVERY_DAY - FIRST_DELIVERY_DAY).days + 1)
                 for s in delivery_slots(FIRST_DELIVERY_DAY.fromordinal(FIRST_DELIVERY_DAY.toordinal() + d))}
    buckets: dict[int, list[tuple[float, float]]] = defaultdict(list)
    for fc in store.all_forecasts():
        actual = store.actuals.get(fc.start_time)
        if fc.start_time not in in_period or actual is None:
            continue
        lead = (fc.start_time - fc.publish_time).total_seconds() / 3600
        if 0 <= lead < max_hours:
            buckets[int(lead // bucket_hours)].append((fc.generation - actual, actual))
    return [
        {"lead_from": b * bucket_hours, "lead_to": (b + 1) * bucket_hours,
         **summarise([e for e, _ in pairs], [a for _, a in pairs])}
        for b, pairs in sorted(buckets.items())
    ]
