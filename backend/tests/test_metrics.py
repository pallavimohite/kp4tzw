import pytest

from app.services.metrics import histogram, percentile, summarise


def test_summarise_basic_metrics():
    m = summarise(errors=[100, -100, 300, -300], actuals=[1000, 1000, 1000, 1000])
    assert m["count"] == 4
    assert m["mae"] == 200
    assert m["rmse"] == pytest.approx(223.607, rel=1e-3)
    assert m["bias"] == 0
    assert m["nmae_pct"] == 20
    assert m["max_over_forecast"] == 300
    assert m["max_under_forecast"] == -300


def test_summarise_empty():
    assert summarise([], []) == {"count": 0}


def test_percentile_interpolates():
    assert percentile([0, 10, 20, 30, 40], 50) == 20
    assert percentile([0, 10], 90) == 9


def test_histogram_bins_cover_range():
    bins = histogram([-600, -100, 50, 450, 1200], bin_width=500)
    assert bins[0]["from"] == -1000 and bins[-1]["to"] == 1500
    assert sum(b["count"] for b in bins) == 5
