"""Business logic: what forecast did the buyer actually have when they had to decide?

Day-ahead rule: power for delivery day D is bought on day D-1 before the auction
closes (default 09:20 UK time, the EPEX GB day-ahead gate closure). So for every
slot of day D we use the latest forecast published at or before that cutoff.
"""

from dataclasses import dataclass
from datetime import date, datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo

from app.services.data_store import DataStore

UK = ZoneInfo("Europe/London")
DEFAULT_CUTOFF = time(9, 20)
SLOT = timedelta(minutes=30)

# Purchase decisions made in January 2026 -> delivery days 2 Jan .. 1 Feb 2026
FIRST_DELIVERY_DAY = date(2026, 1, 2)
LAST_DELIVERY_DAY = date(2026, 2, 1)


@dataclass
class Point:
    """One time slot: what was forecast (at decision time) vs what actually happened."""
    start_time: datetime
    actual: float | None
    forecast: float | None
    forecast_published: datetime | None

    @property
    def error(self) -> float | None:
        """Forecast minus actual. Positive = wind over-forecast = buyer is short of power."""
        if self.actual is None or self.forecast is None:
            return None
        return self.forecast - self.actual

    @property
    def lead_hours(self) -> float | None:
        if self.forecast_published is None:
            return None
        return (self.start_time - self.forecast_published).total_seconds() / 3600


def decision_cutoff(delivery_day: date, cutoff_time: time = DEFAULT_CUTOFF) -> datetime:
    """The moment (UTC) the buyer must decide for `delivery_day`: cutoff_time UK local on the day before."""
    local = datetime.combine(delivery_day - timedelta(days=1), cutoff_time, tzinfo=UK)
    return local.astimezone(timezone.utc)


def delivery_slots(delivery_day: date) -> list[datetime]:
    """All 30-minute slot start times (UTC) of a UK delivery day (handles 46/50-slot clock-change days)."""
    start = datetime.combine(delivery_day, time(0), tzinfo=UK).astimezone(timezone.utc)
    end = datetime.combine(delivery_day + timedelta(days=1), time(0), tzinfo=UK).astimezone(timezone.utc)
    slots, t = [], start
    while t < end:
        slots.append(t)
        t += SLOT
    return slots


def day_points(store: DataStore, delivery_day: date, cutoff_time: time = DEFAULT_CUTOFF) -> list[Point]:
    """Actuals for every half hour of the day, plus the decision-time forecast where one exists (hourly)."""
    cutoff = decision_cutoff(delivery_day, cutoff_time)
    points = []
    for slot in delivery_slots(delivery_day):
        fc = store.latest_forecast_before(slot, cutoff)
        points.append(Point(
            start_time=slot,
            actual=store.actuals.get(slot),
            forecast=fc.generation if fc else None,
            forecast_published=fc.publish_time if fc else None,
        ))
    return points


def delivery_days(first: date = FIRST_DELIVERY_DAY, last: date = LAST_DELIVERY_DAY) -> list[date]:
    return [first + timedelta(days=i) for i in range((last - first).days + 1)]


def evaluation_points(store: DataStore, cutoff_time: time = DEFAULT_CUTOFF,
                      first: date = FIRST_DELIVERY_DAY, last: date = LAST_DELIVERY_DAY) -> list[Point]:
    """Every slot in the period that has BOTH an actual and a decision-time forecast (i.e. can be scored)."""
    return [p for d in delivery_days(first, last) for p in day_points(store, d, cutoff_time) if p.error is not None]
