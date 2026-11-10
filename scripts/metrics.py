"""Pure metrics for Underwarned. No network. Used by ingest and tests."""

from __future__ import annotations

import math
from collections import defaultdict
from typing import Iterable, Optional


LEADS = (1, 2, 3, 4, 5, 6, 7)
MIN_HOURS_FOR_COMPLETE_DAY = 20


def signed_error(forecast: float, observation: float) -> float:
    """Forecast minus observation. Negative means the forecast was too cool."""
    return forecast - observation


def mean(values: Iterable[float]) -> Optional[float]:
    xs = list(values)
    if not xs:
        return None
    return sum(xs) / len(xs)


def mean_error(pairs: list[tuple[float, float]]) -> Optional[float]:
    if not pairs:
        return None
    return mean(signed_error(f, o) for f, o in pairs)


def mean_absolute_error(pairs: list[tuple[float, float]]) -> Optional[float]:
    if not pairs:
        return None
    return mean(abs(signed_error(f, o)) for f, o in pairs)


def root_mean_square_error(pairs: list[tuple[float, float]]) -> Optional[float]:
    if not pairs:
        return None
    return math.sqrt(mean(signed_error(f, o) ** 2 for f, o in pairs))  # type: ignore[arg-type]


def skill_score(mae_forecast: Optional[float], mae_reference: Optional[float]) -> Optional[float]:
    if mae_forecast is None or mae_reference is None or mae_reference == 0:
        return None
    return 1.0 - (mae_forecast / mae_reference)


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def month_day(date: str) -> str:
    """YYYY-MM-DD -> MM-DD for climatology keys. 29 Feb uses 28 Feb."""
    y, m, d = date.split("-")
    if m == "02" and d == "29":
        return "02-28"
    return f"{m}-{d}"


def daily_max_from_hourly(
    hours: list[tuple[str, Optional[float]]],
) -> dict[str, dict]:
    """Group (local ISO time, value) by local date and take the max.

    A day is complete when at least MIN_HOURS_FOR_COMPLETE_DAY hours have a value.
    Incomplete days are returned with complete=False and are not used as events.
    """
    by_day: dict[str, list[Optional[float]]] = defaultdict(list)
    for t, v in hours:
        by_day[t[:10]].append(v)
    out: dict[str, dict] = {}
    for day, vals in by_day.items():
        present = [v for v in vals if v is not None]
        complete = len(present) >= MIN_HOURS_FOR_COMPLETE_DAY
        out[day] = {
            "max": max(present) if present else None,
            "n": len(present),
            "expected": len(vals),
            "complete": complete and bool(present),
        }
    return out


def classify_event(
    observation_max: Optional[float],
    forecast_max: Optional[float],
    threshold: float,
    complete: bool,
) -> str:
    """Return hit, miss, false_alarm, non_event, or incomplete."""
    if not complete or observation_max is None or forecast_max is None:
        return "incomplete"
    obs_hot = observation_max >= threshold
    fcst_hot = forecast_max >= threshold
    if obs_hot and fcst_hot:
        return "hit"
    if obs_hot and not fcst_hot:
        return "miss"
    if not obs_hot and fcst_hot:
        return "false_alarm"
    return "non_event"


def event_scores(labels: list[str]) -> dict:
    hits = labels.count("hit")
    misses = labels.count("miss")
    false_alarms = labels.count("false_alarm")
    incomplete = labels.count("incomplete")
    observed = hits + misses
    forecasted = hits + false_alarms
    pod = (hits / observed) if observed else None
    far = (false_alarms / forecasted) if forecasted else None
    csi_den = hits + misses + false_alarms
    csi = (hits / csi_den) if csi_den else None
    miss_rate = (misses / observed) if observed else None
    return {
        "hits": hits,
        "misses": misses,
        "false_alarms": false_alarms,
        "incomplete_days": incomplete,
        "observed_events": observed,
        "pod": pod,
        "far": far,
        "csi": csi,
        "miss_rate": miss_rate,
    }


def percentile(sorted_vals: list[float], p: float) -> Optional[float]:
    if not sorted_vals:
        return None
    if len(sorted_vals) == 1:
        return sorted_vals[0]
    k = (len(sorted_vals) - 1) * (p / 100.0)
    f = math.floor(k)
    c = math.ceil(k)
    if f == c:
        return sorted_vals[int(k)]
    return sorted_vals[f] * (c - k) + sorted_vals[c] * (k - f)


def round_or_none(value: Optional[float], ndigits: int = 3) -> Optional[float]:
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return None
    return round(value, ndigits)
