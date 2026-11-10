#!/usr/bin/env python3
"""Fetch Previous Runs and ERA5, compute Underwarned artifacts. No API keys."""

from __future__ import annotations

import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path

# Allow running from repo root or scripts/
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))
import metrics as M

PR_URL = "https://previous-runs-api.open-meteo.com/v1/forecast"
ERA5_URL = "https://archive-api.open-meteo.com/v1/archive"
MODEL = "gfs_seamless"
USER_AGENT = "Underwarned/1.0 (DATANOVA 2026; reproducible audit)"

CITIES = [
    {
        "id": "phoenix",
        "name": "Phoenix, US",
        "lat": 33.4484,
        "lon": -112.0740,
        "timezone": "America/Phoenix",
        "asos": "KPHX",
    },
    {
        "id": "houston",
        "name": "Houston, US",
        "lat": 29.7604,
        "lon": -95.3698,
        "timezone": "America/Chicago",
        "asos": "KIAH",
    },
    {
        "id": "madrid",
        "name": "Madrid, Spain",
        "lat": 40.4168,
        "lon": -3.7038,
        "timezone": "Europe/Madrid",
        "asos": None,
    },
    {
        "id": "delhi",
        "name": "Delhi, India",
        "lat": 28.6139,
        "lon": 77.2090,
        "timezone": "Asia/Kolkata",
        "asos": None,
    },
]

SEASONS = [
    {"id": "2024", "label": "May to September 2024", "start": "2024-05-01", "end": "2024-09-30"},
    {"id": "2025", "label": "May to September 2025", "start": "2025-05-01", "end": "2025-09-30"},
]

CLIM_START = "1991-01-01"
CLIM_END = "2020-12-31"

TEMP_THRESHOLDS = [
    {"id": "t35", "variable": "temperature_2m", "value": 35.0, "label": "35 °C daily maximum"},
    {"id": "t40", "variable": "temperature_2m", "value": 40.0, "label": "40 °C daily maximum"},
    {"id": "t45", "variable": "temperature_2m", "value": 45.0, "label": "45 °C daily maximum"},
]
APPARENT_THRESHOLDS = [
    {
        "id": "at406",
        "variable": "apparent_temperature",
        "value": 40.6,
        "label": "40.6 °C daily maximum apparent temperature (105 °F heat index reference)",
    },
]

HOURLY_VARS = ",".join(
    ["temperature_2m"]
    + [f"temperature_2m_previous_day{L}" for L in M.LEADS]
    + ["apparent_temperature"]
    + [f"apparent_temperature_previous_day{L}" for L in M.LEADS]
)


def fetch_json(url: str, retries: int = 4) -> tuple[dict, str]:
    last_err = None
    for i in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=90) as resp:
                body = resp.read()
            data = json.loads(body)
            if data.get("error"):
                raise RuntimeError(data.get("reason") or "API error")
            return data, url
        except (urllib.error.URLError, TimeoutError, RuntimeError, json.JSONDecodeError) as e:
            last_err = e
            time.sleep(1.5 * (i + 1))
    raise RuntimeError(f"Failed to fetch {url}: {last_err}")


def pr_url(city: dict, start: str, end: str) -> str:
    q = urllib.parse.urlencode(
        {
            "latitude": city["lat"],
            "longitude": city["lon"],
            "hourly": HOURLY_VARS,
            "start_date": start,
            "end_date": end,
            "timezone": city["timezone"],
            "models": MODEL,
        }
    )
    return f"{PR_URL}?{q}"


def era5_hourly_url(city: dict, start: str, end: str) -> str:
    q = urllib.parse.urlencode(
        {
            "latitude": city["lat"],
            "longitude": city["lon"],
            "hourly": "temperature_2m,apparent_temperature",
            "start_date": start,
            "end_date": end,
            "timezone": city["timezone"],
        }
    )
    return f"{ERA5_URL}?{q}"


def era5_clim_url(city: dict) -> str:
    q = urllib.parse.urlencode(
        {
            "latitude": city["lat"],
            "longitude": city["lon"],
            "daily": "temperature_2m_max,apparent_temperature_max",
            "start_date": CLIM_START,
            "end_date": CLIM_END,
            "timezone": city["timezone"],
        }
    )
    return f"{ERA5_URL}?{q}"


def grid_of(payload: dict) -> dict:
    return {
        "latitude": payload.get("latitude"),
        "longitude": payload.get("longitude"),
        "elevation": payload.get("elevation"),
        "timezone": payload.get("timezone"),
        "utc_offset_seconds": payload.get("utc_offset_seconds"),
    }


def climatology_maps(payload: dict) -> dict:
    days = payload["daily"]["time"]
    t = payload["daily"]["temperature_2m_max"]
    a = payload["daily"]["apparent_temperature_max"]
    buckets_t: dict[str, list[float]] = {}
    buckets_a: dict[str, list[float]] = {}
    all_t = [v for v in t if v is not None]
    all_a = [v for v in a if v is not None]
    for date, tv, av in zip(days, t, a):
        key = M.month_day(date)
        if tv is not None:
            buckets_t.setdefault(key, []).append(tv)
        if av is not None:
            buckets_a.setdefault(key, []).append(av)
    mean_t = {k: M.mean(vs) for k, vs in buckets_t.items()}
    mean_a = {k: M.mean(vs) for k, vs in buckets_a.items()}
    all_t.sort()
    all_a.sort()
    return {
        "temperature_2m": {
            "by_month_day": mean_t,
            "p95": M.percentile(all_t, 95),
            "p99": M.percentile(all_t, 99),
            "n_days": len(all_t),
        },
        "apparent_temperature": {
            "by_month_day": mean_a,
            "p95": M.percentile(all_a, 95),
            "p99": M.percentile(all_a, 99),
            "n_days": len(all_a),
        },
    }


def season_metrics(pr: dict, era5: dict, clim: dict, season: dict) -> dict:
    pr_h = pr["hourly"]
    er_h = era5["hourly"]
    era_t = {t: v for t, v in zip(er_h["time"], er_h["temperature_2m"])}
    era_a = {t: v for t, v in zip(er_h["time"], er_h["apparent_temperature"])}

    def series(var: str, lead: int | None) -> list[tuple[str, float | None, float | None]]:
        key = var if lead is None else f"{var}_previous_day{lead}"
        rows = []
        dropped = 0
        for t, fv in zip(pr_h["time"], pr_h[key]):
            ov = era_t[t] if var == "temperature_2m" else era_a.get(t)
            # If valid time missing on either side, drop
            if t not in (era_t if var == "temperature_2m" else era_a):
                dropped += 1
                continue
            rows.append((t, fv, ov))
        return rows

    # Use temperature alignment for dropped-hour count
    obs_index = set(era_t.keys())
    pr_times = pr_h["time"]
    dropped_hours = sum(1 for t in pr_times if t not in obs_index) + sum(
        1 for t in era_t if t not in set(pr_times)
    )

    daily = {}
    hourly_stats = {}
    for var in ("temperature_2m", "apparent_temperature"):
        obs_hours = [
            (t, era_t[t] if var == "temperature_2m" else era_a[t])
            for t in pr_times
            if t in era_t
        ]
        obs_daily = M.daily_max_from_hourly(obs_hours)
        lead_daily = {}
        lead_hourly_pairs = {}
        for L in M.LEADS:
            rows = series(var, L)
            fcst_hours = [(t, fv) for t, fv, ov in rows]
            lead_daily[L] = M.daily_max_from_hourly(fcst_hours)
            lead_hourly_pairs[L] = [(fv, ov) for t, fv, ov in rows if fv is not None and ov is not None]
        daily[var] = {"obs": obs_daily, "leads": lead_daily}
        hourly_stats[var] = lead_hourly_pairs

    # Persistence: previous complete observed daily max
    def persistence_map(obs_daily: dict) -> dict[str, float | None]:
        days = sorted(obs_daily.keys())
        out = {}
        prev = None
        for d in days:
            out[d] = prev
            if obs_daily[d]["complete"] and obs_daily[d]["max"] is not None:
                prev = obs_daily[d]["max"]
            # If today incomplete, persistence for tomorrow still uses last complete
        return out

    thresholds = []
    for spec in TEMP_THRESHOLDS + APPARENT_THRESHOLDS:
        thresholds.append(spec)
    # Local percentiles
    for var, label in (
        ("temperature_2m", "daily maximum 2 m temperature"),
        ("apparent_temperature", "daily maximum apparent temperature"),
    ):
        thresholds.append(
            {
                "id": f"{var}_p95",
                "variable": var,
                "value": clim[var]["p95"],
                "label": f"Local 95th percentile {label} (ERA5 1991 to 2020)",
                "kind": "percentile",
            }
        )
        thresholds.append(
            {
                "id": f"{var}_p99",
                "variable": var,
                "value": clim[var]["p99"],
                "label": f"Local 99th percentile {label} (ERA5 1991 to 2020)",
                "kind": "percentile",
            }
        )

    days_out = []
    obs_t = daily["temperature_2m"]["obs"]
    obs_a = daily["apparent_temperature"]["obs"]
    pers_t = persistence_map(obs_t)
    pers_a = persistence_map(obs_a)
    all_days = sorted(set(obs_t) | set(obs_a))

    for day in all_days:
        rec = {
            "date": day,
            "temperature_2m": {
                "obs": obs_t.get(day, {}).get("max"),
                "obs_complete": obs_t.get(day, {}).get("complete", False),
                "obs_hours": obs_t.get(day, {}).get("n", 0),
                "persistence": pers_t.get(day),
                "climatology": clim["temperature_2m"]["by_month_day"].get(M.month_day(day)),
                "leads": {},
            },
            "apparent_temperature": {
                "obs": obs_a.get(day, {}).get("max"),
                "obs_complete": obs_a.get(day, {}).get("complete", False),
                "obs_hours": obs_a.get(day, {}).get("n", 0),
                "persistence": pers_a.get(day),
                "climatology": clim["apparent_temperature"]["by_month_day"].get(M.month_day(day)),
                "leads": {},
            },
        }
        for var in ("temperature_2m", "apparent_temperature"):
            for L in M.LEADS:
                dlead = daily[var]["leads"][L].get(day, {})
                rec[var]["leads"][str(L)] = {
                    "max": dlead.get("max"),
                    "complete": dlead.get("complete", False),
                    "hours": dlead.get("n", 0),
                }
        days_out.append(rec)

    def stats_for(var: str, lead: int, thresh_value: float | None = None) -> dict:
        pairs_hourly = hourly_stats[var][lead]
        day_pairs = []
        pers_pairs = []
        clim_pairs = []
        for rec in days_out:
            block = rec[var]
            leadb = block["leads"][str(lead)]
            complete = block["obs_complete"] and leadb["complete"]
            if not complete or block["obs"] is None or leadb["max"] is None:
                continue
            day_pairs.append((leadb["max"], block["obs"]))
            if block["persistence"] is not None:
                pers_pairs.append((block["persistence"], block["obs"]))
            if block["climatology"] is not None:
                clim_pairs.append((block["climatology"], block["obs"]))
        mae = M.mean_absolute_error(day_pairs)
        return {
            "n_hours": len(pairs_hourly),
            "hourly_mean_error": M.round_or_none(M.mean_error(pairs_hourly)),
            "hourly_mae": M.round_or_none(M.mean_absolute_error(pairs_hourly)),
            "hourly_rmse": M.round_or_none(M.root_mean_square_error(pairs_hourly)),
            "n_complete_days": len(day_pairs),
            "daily_mean_error": M.round_or_none(M.mean_error(day_pairs)),
            "daily_mae": M.round_or_none(mae),
            "daily_rmse": M.round_or_none(M.root_mean_square_error(day_pairs)),
            "skill_vs_persistence": M.round_or_none(
                M.skill_score(mae, M.mean_absolute_error(pers_pairs))
            ),
            "skill_vs_climatology": M.round_or_none(
                M.skill_score(mae, M.mean_absolute_error(clim_pairs))
            ),
            "n_persistence_days": len(pers_pairs),
            "n_climatology_days": len(clim_pairs),
        }

    leads_out = {}
    for var in ("temperature_2m", "apparent_temperature"):
        leads_out[var] = {str(L): stats_for(var, L) for L in M.LEADS}

    events_out = []
    threshold_scores = []
    for spec in thresholds:
        var = spec["variable"]
        value = spec["value"]
        if value is None:
            continue
        by_lead = {}
        for L in M.LEADS:
            labels = []
            shortfalls = []
            event_rows = []
            for rec in days_out:
                block = rec[var]
                leadb = block["leads"][str(L)]
                complete = block["obs_complete"] and leadb["complete"]
                label = M.classify_event(block["obs"], leadb["max"], value, complete)
                labels.append(label)
                shortfall = None
                if label == "miss" and block["obs"] is not None and leadb["max"] is not None:
                    shortfall = block["obs"] - leadb["max"]
                    shortfalls.append(shortfall)
                if label in ("hit", "miss", "false_alarm", "incomplete") and (
                    (block["obs"] is not None and block["obs"] >= value)
                    or (leadb["max"] is not None and leadb["max"] >= value)
                    or label == "incomplete"
                    and block["obs_complete"]
                    and block["obs"] is not None
                    and block["obs"] >= value
                ):
                    event_rows.append(
                        {
                            "date": rec["date"],
                            "label": label,
                            "obs": M.round_or_none(block["obs"], 2),
                            "forecast": M.round_or_none(leadb["max"], 2),
                            "shortfall": M.round_or_none(shortfall, 2),
                        }
                    )
                elif label in ("hit", "miss", "false_alarm"):
                    event_rows.append(
                        {
                            "date": rec["date"],
                            "label": label,
                            "obs": M.round_or_none(block["obs"], 2),
                            "forecast": M.round_or_none(leadb["max"], 2),
                            "shortfall": M.round_or_none(shortfall, 2),
                        }
                    )
            scores = M.event_scores(labels)
            scores["mean_shortfall_on_misses"] = M.round_or_none(M.mean(shortfalls), 3)
            scores["lead"] = L
            # Round rates
            for k in ("pod", "far", "csi", "miss_rate"):
                scores[k] = M.round_or_none(scores[k], 4)
            by_lead[str(L)] = {"scores": scores, "days": event_rows}
        threshold_scores.append(
            {
                "id": spec["id"],
                "variable": var,
                "value": M.round_or_none(value, 3),
                "label": spec["label"],
                "kind": spec.get("kind", "fixed"),
                "by_lead": {k: v["scores"] for k, v in by_lead.items()},
                "days_by_lead": {k: v["days"] for k, v in by_lead.items()},
            }
        )

    # Hourly series for event dates only (union of observed threshold days at any fixed temp threshold)
    event_dates = set()
    for rec in days_out:
        t = rec["temperature_2m"]["obs"]
        a = rec["apparent_temperature"]["obs"]
        if rec["temperature_2m"]["obs_complete"] and t is not None and t >= 35:
            event_dates.add(rec["date"])
        if rec["apparent_temperature"]["obs_complete"] and a is not None and a >= 40.6:
            event_dates.add(rec["date"])
        # also include percentile events later via days lists; 35/40.6 covers drilldown needs
        if rec["temperature_2m"]["obs_complete"] and t is not None:
            p95 = clim["temperature_2m"]["p95"]
            if p95 is not None and t >= p95:
                event_dates.add(rec["date"])

    hourly_events = {}
    pr_index = {t: i for i, t in enumerate(pr_h["time"])}
    for date in sorted(event_dates):
        hours = []
        # collect 24 local hours
        times = [t for t in pr_h["time"] if t.startswith(date)]
        for t in times:
            i = pr_index[t]
            hours.append(
                {
                    "time": t,
                    "temperature_2m_obs": era_t.get(t),
                    "apparent_temperature_obs": era_a.get(t),
                    "temperature_2m_leads": {
                        str(L): pr_h[f"temperature_2m_previous_day{L}"][i] for L in M.LEADS
                    },
                    "apparent_temperature_leads": {
                        str(L): pr_h[f"apparent_temperature_previous_day{L}"][i] for L in M.LEADS
                    },
                }
            )
        hourly_events[date] = hours

    last_valid = all_days[-1] if all_days else None
    n_incomplete_t = sum(1 for rec in days_out if not rec["temperature_2m"]["obs_complete"])

    return {
        "season": season,
        "dropped_hours": dropped_hours,
        "n_days": len(days_out),
        "n_incomplete_obs_days_temperature": n_incomplete_t,
        "last_valid_date": last_valid,
        "leads": leads_out,
        "thresholds": threshold_scores,
        "days": days_out,
        "hourly_events": hourly_events,
        "status": "success" if dropped_hours == 0 and n_incomplete_t == 0 else "partial",
    }


def fetch_city(city: dict) -> dict:
    log = []
    # climatology
    cu = era5_clim_url(city)
    clim_raw, cu = fetch_json(cu)
    log.append({"kind": "era5_climatology", "url": cu, "grid": grid_of(clim_raw)})
    clim = climatology_maps(clim_raw)
    seasons_out = {}
    pr_grid = None
    era_grid = None
    status = "success"
    notes = []
    for season in SEASONS:
        try:
            pu = pr_url(city, season["start"], season["end"])
            eu = era5_hourly_url(city, season["start"], season["end"])
            pr_raw, pu = fetch_json(pu)
            era_raw, eu = fetch_json(eu)
            log.append({"kind": "previous_runs", "season": season["id"], "url": pu, "grid": grid_of(pr_raw)})
            log.append({"kind": "era5_hourly", "season": season["id"], "url": eu, "grid": grid_of(era_raw)})
            pr_grid = grid_of(pr_raw)
            era_grid = grid_of(era_raw)
            seasons_out[season["id"]] = season_metrics(pr_raw, era_raw, clim, season)
            if seasons_out[season["id"]]["status"] != "success":
                status = "partial"
        except Exception as e:
            status = "partial" if seasons_out else "error"
            notes.append(f"{season['id']}: {e}")
            seasons_out[season["id"]] = {
                "season": season,
                "status": "error",
                "error": str(e),
                "dropped_hours": None,
                "n_days": 0,
                "leads": {},
                "thresholds": [],
                "days": [],
                "hourly_events": {},
            }
    dist = None
    if pr_grid and era_grid and pr_grid["latitude"] is not None and era_grid["latitude"] is not None:
        dist = M.round_or_none(
            M.haversine_km(pr_grid["latitude"], pr_grid["longitude"], era_grid["latitude"], era_grid["longitude"]),
            2,
        )
    return {
        "id": city["id"],
        "name": city["name"],
        "requested": {"latitude": city["lat"], "longitude": city["lon"]},
        "timezone": city["timezone"],
        "asos": city["asos"],
        "previous_runs_grid": pr_grid,
        "era5_grid": era_grid,
        "grid_distance_km": dist,
        "model": MODEL,
        "climatology": {
            "start": CLIM_START,
            "end": CLIM_END,
            "temperature_2m_p95": M.round_or_none(clim["temperature_2m"]["p95"], 3),
            "temperature_2m_p99": M.round_or_none(clim["temperature_2m"]["p99"], 3),
            "apparent_temperature_p95": M.round_or_none(clim["apparent_temperature"]["p95"], 3),
            "apparent_temperature_p99": M.round_or_none(clim["apparent_temperature"]["p99"], 3),
            "n_days_temperature": clim["temperature_2m"]["n_days"],
            "n_days_apparent": clim["apparent_temperature"]["n_days"],
        },
        "seasons": seasons_out,
        "status": status,
        "notes": notes,
        "request_log": log,
    }


def slim_city(full: dict) -> dict:
    """City file for the app: daily series, events, hourly for event days, no 30y maps."""
    seasons = {}
    for sid, s in full["seasons"].items():
        if s.get("status") == "error":
            seasons[sid] = s
            continue
        # Drop climatology maps already summarized
        seasons[sid] = {
            "season": s["season"],
            "status": s["status"],
            "dropped_hours": s["dropped_hours"],
            "n_days": s["n_days"],
            "n_incomplete_obs_days_temperature": s.get("n_incomplete_obs_days_temperature"),
            "last_valid_date": s["last_valid_date"],
            "leads": s["leads"],
            "thresholds": [
                {
                    "id": t["id"],
                    "variable": t["variable"],
                    "value": t["value"],
                    "label": t["label"],
                    "kind": t["kind"],
                    "by_lead": t["by_lead"],
                    "days_by_lead": t["days_by_lead"],
                }
                for t in s["thresholds"]
            ],
            "days": [
                {
                    "date": d["date"],
                    "temperature_2m": {
                        "obs": M.round_or_none(d["temperature_2m"]["obs"], 2),
                        "obs_complete": d["temperature_2m"]["obs_complete"],
                        "persistence": M.round_or_none(d["temperature_2m"]["persistence"], 2),
                        "climatology": M.round_or_none(d["temperature_2m"]["climatology"], 2),
                        "leads": {
                            k: {
                                "max": M.round_or_none(v["max"], 2),
                                "complete": v["complete"],
                            }
                            for k, v in d["temperature_2m"]["leads"].items()
                        },
                    },
                    "apparent_temperature": {
                        "obs": M.round_or_none(d["apparent_temperature"]["obs"], 2),
                        "obs_complete": d["apparent_temperature"]["obs_complete"],
                        "persistence": M.round_or_none(d["apparent_temperature"]["persistence"], 2),
                        "climatology": M.round_or_none(d["apparent_temperature"]["climatology"], 2),
                        "leads": {
                            k: {
                                "max": M.round_or_none(v["max"], 2),
                                "complete": v["complete"],
                            }
                            for k, v in d["apparent_temperature"]["leads"].items()
                        },
                    },
                }
                for d in s["days"]
            ],
            "hourly_events": s["hourly_events"],
        }
    return {
        "id": full["id"],
        "name": full["name"],
        "requested": full["requested"],
        "timezone": full["timezone"],
        "asos": full["asos"],
        "previous_runs_grid": full["previous_runs_grid"],
        "era5_grid": full["era5_grid"],
        "grid_distance_km": full["grid_distance_km"],
        "model": full["model"],
        "climatology": full["climatology"],
        "seasons": seasons,
        "status": full["status"],
        "notes": full["notes"],
        "request_log": full["request_log"],
    }


def build_summary(cities: list[dict], generated_at: str) -> dict:
    city_summaries = []
    for c in cities:
        season_briefs = {}
        for sid, s in c["seasons"].items():
            if s.get("status") == "error":
                season_briefs[sid] = {"status": "error", "error": s.get("error")}
                continue
            # Headline: 40C for phoenix, 35C otherwise, plus apparent 40.6, lead 3
            def pick(tid: str):
                for t in s["thresholds"]:
                    if t["id"] == tid:
                        return t
                return None

            t35 = pick("t35")
            t40 = pick("t40")
            at = pick("at406")
            season_briefs[sid] = {
                "status": s["status"],
                "n_days": s["n_days"],
                "dropped_hours": s["dropped_hours"],
                "last_valid_date": s["last_valid_date"],
                "temperature_leads": s["leads"]["temperature_2m"],
                "apparent_leads": s["leads"]["apparent_temperature"],
                "t35": t35["by_lead"] if t35 else None,
                "t40": t40["by_lead"] if t40 else None,
                "t45": pick("t45")["by_lead"] if pick("t45") else None,
                "at406": at["by_lead"] if at else None,
                "t_p95": pick("temperature_2m_p95")["by_lead"] if pick("temperature_2m_p95") else None,
                "t_p95_value": pick("temperature_2m_p95")["value"] if pick("temperature_2m_p95") else None,
                "t_p99": pick("temperature_2m_p99")["by_lead"] if pick("temperature_2m_p99") else None,
                "t_p99_value": pick("temperature_2m_p99")["value"] if pick("temperature_2m_p99") else None,
            }
        city_summaries.append(
            {
                "id": c["id"],
                "name": c["name"],
                "timezone": c["timezone"],
                "requested": c["requested"],
                "previous_runs_grid": c["previous_runs_grid"],
                "era5_grid": c["era5_grid"],
                "grid_distance_km": c["grid_distance_km"],
                "asos": c["asos"],
                "status": c["status"],
                "notes": c["notes"],
                "climatology": c["climatology"],
                "seasons": season_briefs,
            }
        )
    return {
        "generated_at": generated_at,
        "model": MODEL,
        "observation": "ERA5 from the Open-Meteo Historical Weather archive. Day 0 of Previous Runs is never used as the observation.",
        "seasons": SEASONS,
        "cities": city_summaries,
        "sources": {
            "previous_runs": PR_URL,
            "era5": ERA5_URL,
            "docs_previous_runs": "https://open-meteo.com/en/docs/previous-runs-api",
            "docs_era5": "https://open-meteo.com/en/docs/historical-weather-api",
        },
    }


def main() -> int:
    generated_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    raw_dir = ROOT / "data" / "raw"
    art_dir = ROOT / "data" / "artifacts"
    pub_dir = ROOT / "public" / "data"
    raw_dir.mkdir(parents=True, exist_ok=True)
    art_dir.mkdir(parents=True, exist_ok=True)
    pub_dir.mkdir(parents=True, exist_ok=True)

    cities = []
    errors = []
    with ThreadPoolExecutor(max_workers=4) as pool:
        futs = {pool.submit(fetch_city, c): c for c in CITIES}
        for fut in as_completed(futs):
            city = futs[fut]
            try:
                result = fut.result()
                cities.append(result)
                print(f"OK {result['id']} status={result['status']} notes={result['notes']}", flush=True)
            except Exception as e:
                errors.append((city["id"], str(e)))
                print(f"FAIL {city['id']}: {e}", flush=True)

    cities.sort(key=lambda c: [x["id"] for x in CITIES].index(c["id"]))
    # Write per-city artifacts
    slims = []
    for c in cities:
        slim = slim_city(c)
        slims.append(slim)
        path = pub_dir / f"{c['id']}.json"
        path.write_text(json.dumps(slim, separators=(",", ":")))
        print(f"wrote {path} ({path.stat().st_size // 1024} KB)", flush=True)

    summary = build_summary(slims, generated_at)
    (pub_dir / "summary.json").write_text(json.dumps(summary, indent=2))
    (art_dir / "summary.json").write_text(json.dumps(summary, indent=2))
    print(f"wrote summary, cities={len(slims)} errors={errors}", flush=True)
    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
