"""End-to-end API tests against the real cached January data."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    assert client.get("/api/health").json() == {"status": "ok"}


def test_meta():
    body = client.get("/api/meta").json()
    assert body["first_delivery_day"] == "2026-01-02"
    assert body["default_cutoff"] == "09:20"


def test_day_view_uses_forecast_from_before_cutoff():
    body = client.get("/api/day/2026-01-15").json()
    assert len(body["points"]) == 48
    assert body["decision_time"].startswith("2026-01-14T09:20")
    # The forecast used must have been published before the decision
    assert body["forecast_published"] <= body["decision_time"]
    hourly = [p for p in body["points"] if p["forecast"] is not None]
    assert len(hourly) == 24
    assert all(p["band_low"] <= p["forecast"] - body["band"]["p10"] for p in hourly)


def test_day_outside_range_is_404():
    assert client.get("/api/day/2026-03-01").status_code == 404


def test_invalid_cutoff_is_422():
    assert client.get("/api/day/2026-01-15?cutoff=25:00").status_code == 422


def test_accuracy_report_shape():
    body = client.get("/api/accuracy").json()
    assert body["overall"]["count"] == 31 * 24  # 31 delivery days x 24 hourly forecasts
    assert len(body["by_hour"]) == 24
    assert len(body["by_day"]) == 31
    assert len(body["series"]) == 31 * 24
    first = body["series"][0]
    assert first["time"].startswith("2026-01-02T00:00") and first["forecast"] > 0 and first["actual"] > 0


def test_accuracy_range_validation():
    assert client.get("/api/accuracy?start=2026-01-20&end=2026-01-10").status_code == 422


def test_horizon_error_grows_with_lead_time():
    buckets = client.get("/api/horizon").json()
    assert buckets[-1]["mae"] > buckets[0]["mae"]
