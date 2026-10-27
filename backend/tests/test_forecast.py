from datetime import date, datetime, time, timezone

from app.services.data_store import DataStore
from app.services.forecast import day_points, decision_cutoff, delivery_slots


def utc(*args) -> datetime:
    return datetime(*args, tzinfo=timezone.utc)


def make_store() -> DataStore:
    """Mirrors the picnic example: several forecasts for 2 Jan 15:00, some published after the cutoff."""
    target = "2026-01-02T15:00:00Z"
    forecasts = [
        {"publishTime": "2025-12-31T20:00:00Z", "startTime": target, "generation": 9000},
        {"publishTime": "2026-01-01T07:30:00Z", "startTime": target, "generation": 8200},
        {"publishTime": "2026-01-01T09:30:00Z", "startTime": target, "generation": 7600},  # after 09:20 cutoff
        {"publishTime": "2026-01-02T12:00:00Z", "startTime": target, "generation": 7100},  # on delivery day
    ]
    actuals = [{"startTime": target, "generation": 7000}, {"startTime": "2026-01-02T15:30:00Z", "generation": 7050}]
    return DataStore(actuals, forecasts)


def test_cutoff_is_day_before_in_uk_time():
    assert decision_cutoff(date(2026, 1, 2)) == utc(2026, 1, 1, 9, 20)       # GMT in winter
    assert decision_cutoff(date(2026, 7, 2)) == utc(2026, 7, 1, 8, 20)       # BST in summer


def test_uses_latest_forecast_published_before_cutoff():
    store = make_store()
    fc = store.latest_forecast_before(utc(2026, 1, 2, 15), decision_cutoff(date(2026, 1, 2)))
    assert fc.generation == 8200  # not the later, more accurate 7600 / 7100 ones


def test_later_cutoff_picks_newer_forecast():
    store = make_store()
    fc = store.latest_forecast_before(utc(2026, 1, 2, 15), decision_cutoff(date(2026, 1, 2), time(11, 0)))
    assert fc.generation == 7600


def test_no_forecast_before_cutoff_returns_none():
    store = make_store()
    assert store.latest_forecast_before(utc(2026, 1, 2, 15), utc(2025, 12, 30)) is None


def test_day_points_error_and_lead_time():
    points = {p.start_time: p for p in day_points(make_store(), date(2026, 1, 2))}
    p = points[utc(2026, 1, 2, 15)]
    assert p.error == 1200                 # forecast 8200 - actual 7000: buyer would be short
    assert p.lead_hours == 31.5            # published 1 Jan 07:30, target 2 Jan 15:00
    assert points[utc(2026, 1, 2, 15, 30)].forecast is None   # forecasts are hourly


def test_delivery_slots_handle_clock_changes():
    assert len(delivery_slots(date(2026, 1, 15))) == 48
    assert len(delivery_slots(date(2026, 3, 29))) == 46   # clocks go forward
    assert len(delivery_slots(date(2026, 10, 25))) == 50  # clocks go back
