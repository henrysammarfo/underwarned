import math
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import metrics as M


class SignedErrorTests(unittest.TestCase):
    def test_too_cool_is_negative(self):
        self.assertEqual(M.signed_error(37.7, 40.7), -3.0)

    def test_too_warm_is_positive(self):
        self.assertEqual(M.signed_error(43.0, 40.0), 3.0)


class ErrorStatsTests(unittest.TestCase):
    def test_empty_is_none(self):
        self.assertIsNone(M.mean_error([]))
        self.assertIsNone(M.mean_absolute_error([]))
        self.assertIsNone(M.root_mean_square_error([]))

    def test_known_set(self):
        pairs = [(37.7, 40.7), (40.0, 40.0), (41.0, 40.0)]
        # errors: -3.0, 0.0, 1.0
        self.assertAlmostEqual(M.mean_error(pairs), -2.0 / 3)
        self.assertAlmostEqual(M.mean_absolute_error(pairs), 4.0 / 3)
        self.assertAlmostEqual(M.root_mean_square_error(pairs), math.sqrt((9 + 0 + 1) / 3))


class SkillTests(unittest.TestCase):
    def test_perfect_forecast(self):
        self.assertEqual(M.skill_score(0.0, 2.0), 1.0)

    def test_same_as_reference(self):
        self.assertEqual(M.skill_score(2.0, 2.0), 0.0)

    def test_worse_than_reference(self):
        self.assertEqual(M.skill_score(4.0, 2.0), -1.0)

    def test_zero_reference_is_none(self):
        self.assertIsNone(M.skill_score(1.0, 0.0))
        self.assertIsNone(M.skill_score(None, 1.0))


class DailyMaxTests(unittest.TestCase):
    def test_computes_max_and_complete(self):
        hours = [(f"2024-07-01T{h:02d}:00", float(h)) for h in range(24)]
        out = M.daily_max_from_hourly(hours)
        self.assertEqual(out["2024-07-01"]["max"], 23.0)
        self.assertTrue(out["2024-07-01"]["complete"])
        self.assertEqual(out["2024-07-01"]["n"], 24)

    def test_incomplete_when_too_few_hours(self):
        hours = [(f"2024-07-01T{h:02d}:00", 40.0) for h in range(10)]
        out = M.daily_max_from_hourly(hours)
        self.assertFalse(out["2024-07-01"]["complete"])
        self.assertEqual(out["2024-07-01"]["max"], 40.0)

    def test_nulls_are_dropped_not_zeroed(self):
        hours = [("2024-07-01T00:00", None)] + [
            (f"2024-07-01T{h:02d}:00", 30.0 + h) for h in range(1, 24)
        ]
        out = M.daily_max_from_hourly(hours)
        self.assertEqual(out["2024-07-01"]["n"], 23)
        self.assertTrue(out["2024-07-01"]["complete"])
        self.assertEqual(out["2024-07-01"]["max"], 53.0)
        self.assertNotEqual(out["2024-07-01"]["max"], 0.0)


class EventClassificationTests(unittest.TestCase):
    def test_hit_miss_false_alarm_non_event(self):
        self.assertEqual(M.classify_event(41.0, 40.5, 40.0, True), "hit")
        self.assertEqual(M.classify_event(40.7, 37.7, 40.0, True), "miss")
        self.assertEqual(M.classify_event(38.0, 41.0, 40.0, True), "false_alarm")
        self.assertEqual(M.classify_event(38.0, 37.0, 40.0, True), "non_event")

    def test_incomplete_never_scored_as_miss(self):
        self.assertEqual(M.classify_event(41.0, None, 40.0, False), "incomplete")
        self.assertEqual(M.classify_event(41.0, 37.0, 40.0, False), "incomplete")
        self.assertEqual(M.classify_event(None, 37.0, 40.0, True), "incomplete")

    def test_threshold_is_inclusive(self):
        self.assertEqual(M.classify_event(40.0, 40.0, 40.0, True), "hit")
        self.assertEqual(M.classify_event(40.0, 39.9, 40.0, True), "miss")


class EventScoreTests(unittest.TestCase):
    def test_counts_and_rates(self):
        labels = ["hit", "hit", "miss", "false_alarm", "non_event", "incomplete"]
        s = M.event_scores(labels)
        self.assertEqual(s["hits"], 2)
        self.assertEqual(s["misses"], 1)
        self.assertEqual(s["false_alarms"], 1)
        self.assertEqual(s["observed_events"], 3)
        self.assertAlmostEqual(s["pod"], 2 / 3)
        self.assertAlmostEqual(s["far"], 1 / 3)
        self.assertAlmostEqual(s["csi"], 2 / 4)
        self.assertAlmostEqual(s["miss_rate"], 1 / 3)

    def test_no_events_rates_are_none(self):
        s = M.event_scores(["non_event", "non_event"])
        self.assertIsNone(s["pod"])
        self.assertIsNone(s["miss_rate"])
        self.assertEqual(s["observed_events"], 0)


class Day0GuardTests(unittest.TestCase):
    def test_leads_do_not_include_zero(self):
        self.assertNotIn(0, M.LEADS)
        self.assertEqual(M.LEADS, (1, 2, 3, 4, 5, 6, 7))


class ClimatologyKeyTests(unittest.TestCase):
    def test_leap_day_maps_to_28_feb(self):
        self.assertEqual(M.month_day("2024-02-29"), "02-28")
        self.assertEqual(M.month_day("2024-07-01"), "07-01")


class PercentileAndDistanceTests(unittest.TestCase):
    def test_percentile_known(self):
        vals = list(range(1, 101))
        self.assertAlmostEqual(M.percentile(vals, 0), 1.0)
        self.assertAlmostEqual(M.percentile(vals, 100), 100.0)
        self.assertAlmostEqual(M.percentile([10.0, 20.0], 50), 15.0)
        self.assertIsNone(M.percentile([], 95))

    def test_phoenix_grid_distance_matches_ingest(self):
        # Values from the live API check and the ingest artifact
        km = M.haversine_km(33.440266, -112.06021, 33.427063, -112.02719)
        self.assertAlmostEqual(km, 3.4, places=1)


class ArtifactConsistencyTests(unittest.TestCase):
    """Lock a real computed miss so the UI cannot drift from the engine."""

    def test_phoenix_1_july_2024_lead_3_is_a_40c_miss(self):
        path = Path(__file__).resolve().parents[1] / "public" / "data" / "phoenix.json"
        data = __import__("json").loads(path.read_text())
        th = next(t for t in data["seasons"]["2024"]["thresholds"] if t["id"] == "t40")
        row = next(d for d in th["days_by_lead"]["3"] if d["date"] == "2024-07-01")
        self.assertEqual(row["label"], "miss")
        self.assertEqual(row["obs"], 40.7)
        self.assertEqual(row["forecast"], 37.7)
        self.assertEqual(row["shortfall"], 3.0)

    def test_day_0_is_absent_from_city_leads(self):
        path = Path(__file__).resolve().parents[1] / "public" / "data" / "phoenix.json"
        data = __import__("json").loads(path.read_text())
        day = data["seasons"]["2024"]["days"][0]
        self.assertNotIn("0", day["temperature_2m"]["leads"])

    def test_madrid_45c_has_zero_events(self):
        path = Path(__file__).resolve().parents[1] / "public" / "data" / "madrid.json"
        data = __import__("json").loads(path.read_text())
        for sid in ("2024", "2025"):
            th = next(t for t in data["seasons"][sid]["thresholds"] if t["id"] == "t45")
            self.assertEqual(th["by_lead"]["3"]["observed_events"], 0)


if __name__ == "__main__":
    unittest.main()
