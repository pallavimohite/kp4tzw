"""HTTP endpoints. Thin layer: validate input, call services, shape JSON."""

from datetime import date, time

from fastapi import APIRouter, HTTPException, Query

from app.services.data_store import get_store
from app.services.forecast import (
    DEFAULT_CUTOFF, FIRST_DELIVERY_DAY, LAST_DELIVERY_DAY, day_points, decision_cutoff, evaluation_points,
)
from app.services.metrics import accuracy_report, horizon_report, summarise

router = APIRouter(prefix="/api")

CUTOFF_QUERY = Query("09:20", pattern=r"^([01]\d|2[0-3]):[0-5]\d$",
                     description="Decision time on the day before delivery, UK local (HH:MM)")
CUTOFF_PRESETS = [
    {"time": "09:20", "label": "EPEX GB day-ahead auction (09:20)"},
    {"time": "09:50", "label": "Nord Pool N2EX day-ahead auction (09:50)"},
]


def _parse_cutoff(value: str) -> time:
    h, m = value.split(":")
    return time(int(h), int(m))


def _check_day(day: date) -> None:
    if not FIRST_DELIVERY_DAY <= day <= LAST_DELIVERY_DAY:
        raise HTTPException(404, f"Data available for delivery days {FIRST_DELIVERY_DAY} to {LAST_DELIVERY_DAY}")


@router.get("/health")
def health():
    return {"status": "ok"}


@router.get("/meta")
def meta():
    return {
        "first_delivery_day": FIRST_DELIVERY_DAY,
        "last_delivery_day": LAST_DELIVERY_DAY,
        "default_cutoff": DEFAULT_CUTOFF.strftime("%H:%M"),
        "cutoff_presets": CUTOFF_PRESETS,
        "timezone": "Europe/London",
        "units": "MW",
    }


@router.get("/day/{day}")
def day_view(day: date, cutoff: str = CUTOFF_QUERY):
    """One delivery day: decision-time forecast vs actual, with an uncertainty band from historical errors."""
    _check_day(day)
    cutoff_time = _parse_cutoff(cutoff)
    store = get_store()

    # Error spread over the whole pilot period at this cutoff -> planning band around each forecast
    month = summarise(*zip(*[(p.error, p.actual) for p in evaluation_points(store, cutoff_time)]))
    points = day_points(store, day, cutoff_time)
    scored = [p for p in points if p.error is not None]

    return {
        "date": day,
        "decision_time": decision_cutoff(day, cutoff_time),
        "forecast_published": max((p.forecast_published for p in points if p.forecast_published), default=None),
        "summary": summarise([p.error for p in scored], [p.actual for p in scored]),
        "band": {"p10": month["p10"], "p90": month["p90"]},
        "points": [
            {
                "time": p.start_time,
                "actual": p.actual,
                "forecast": p.forecast,
                "error": p.error,
                "lead_hours": p.lead_hours,
                # 80% of the time actual wind fell inside forecast - p90 .. forecast - p10
                "band_low": p.forecast - month["p90"] if p.forecast is not None else None,
                "band_high": p.forecast - month["p10"] if p.forecast is not None else None,
            }
            for p in points
        ],
    }


@router.get("/accuracy")
def accuracy(cutoff: str = CUTOFF_QUERY, start: date = FIRST_DELIVERY_DAY, end: date = LAST_DELIVERY_DAY):
    """Accuracy of decision-time forecasts over a range of delivery days."""
    _check_day(start)
    _check_day(end)
    if start > end:
        raise HTTPException(422, "start must be on or before end")
    return accuracy_report(evaluation_points(get_store(), _parse_cutoff(cutoff), start, end))


@router.get("/horizon")
def horizon(bucket_hours: int = Query(3, ge=1, le=12)):
    """Accuracy by forecast lead time, using every forecast published for the period."""
    return horizon_report(get_store(), bucket_hours=bucket_hours)
