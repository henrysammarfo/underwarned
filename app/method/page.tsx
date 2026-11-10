import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Method" };

export default function MethodPage() {
  return (
    <div className="prose">
      <h1>Method</h1>
      <p>
        Underwarned measures forecast underprediction of extreme heat at fixed lead times. For each city,
        each local day, and each lead L from 1 to 7 days, the daily maximum of the Open-Meteo Previous
        Runs series <code>temperature_2m_previous_dayL</code> is compared with the ERA5 daily maximum at
        the same valid date. The same rule is applied to <code>apparent_temperature</code>.
      </p>
      <h2>Why daily maxima are computed from hourly values</h2>
      <p>
        A live check of the Previous Runs API on 10 November 2026 showed that
        <code> temperature_2m_max</code> and <code>apparent_temperature_max</code> work for day 0 only.
        Requests for <code>temperature_2m_max_previous_day1</code> and
        <code>temperature_2m_previous_day1_max</code> returned HTTP 400. Daily maxima at each lead are
        therefore the maximum of the hourly lead series in the city timezone. A day is complete when at
        least 20 of the local hours have both a forecast and an ERA5 value. Incomplete days are never
        scored as misses.
      </p>
      <h2>What is not used</h2>
      <p>
        Day 0 (<code>temperature_2m</code> without a previous_day suffix) is a model run, not the
        observation. The Open-Meteo Historical Forecast API is not used, because it is not a fixed 1 to 7
        day lead archive.
      </p>
      <h2>Endpoints and parameters</h2>
      <div style={{ overflowX: "auto" }}>
        <table className="data">
          <thead>
            <tr>
              <th>Source</th>
              <th>Endpoint</th>
              <th>Parameters</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Previous Runs</td>
              <td>
                <a href="https://previous-runs-api.open-meteo.com/v1/forecast">
                  previous-runs-api.open-meteo.com/v1/forecast
                </a>
              </td>
              <td>
                Hourly <code>temperature_2m</code>, <code>temperature_2m_previous_day1</code> through
                <code> temperature_2m_previous_day7</code>, and the same names for
                <code> apparent_temperature</code>. <code>start_date</code>, <code>end_date</code>,{" "}
                <code>timezone</code>, <code>models=gfs_seamless</code>. Units °C.
              </td>
            </tr>
            <tr>
              <td>ERA5 archive</td>
              <td>
                <a href="https://archive-api.open-meteo.com/v1/archive">
                  archive-api.open-meteo.com/v1/archive
                </a>
              </td>
              <td>
                Hourly <code>temperature_2m</code>, <code>apparent_temperature</code>. Daily maxima for
                climatology (1991 to 2020): <code>temperature_2m_max</code>,{" "}
                <code>apparent_temperature_max</code>. Units °C.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <h2>Metrics</h2>
      <p>
        Signed error is forecast minus observation. A negative value means the forecast was too cool. We
        report mean error, mean absolute error, and root mean square error on hourly pairs and on daily
        maxima. Skill against persistence (yesterday&apos;s observed daily maximum) and climatology (the
        1991 to 2020 ERA5 mean for that calendar day, with 29 February mapped to 28 February) is 1 minus
        forecast MAE over reference MAE.
      </p>
      <p>
        Threshold events use the daily maximum. A hit is forecast and observation both at or above the
        threshold. A miss is observation at or above it while the forecast stays below. A false alarm is
        the reverse. We report probability of detection, false alarm ratio, critical success index, miss
        rate, and the mean shortfall (observation minus forecast) on missed days only. Headline claims are
        conditional on those events, because a warm monthly bias can hide missed peaks.
      </p>
      <h2>Thresholds and sample</h2>
      <p>
        Fixed marks: 35 °C, 40 °C, and 45 °C daily maximum 2 m temperature, and 40.6 °C daily maximum
        apparent temperature (equal to 105 °F, a common National Weather Service excessive heat reference;
        we do not claim this is the official heat index). Local 95th and 99th percentiles come from ERA5
        daily maxima at the same city for 1991 to 2020.
      </p>
      <p>
        Cities: Phoenix, Houston, Madrid, and Delhi. Window: 1 May to 30 September in 2024 and in 2025.
        Model: <code>gfs_seamless</code>. Artifacts were generated on 10 November 2026. Every request URL
        is stored in the city JSON files under <code>request_log</code>.
      </p>
      <p>
        Re-run: from the repo, <code>python3 scripts/ingest.py</code> then <code>python3 -m unittest
        discover -s tests -v</code>. No API key is required. See the README for exact steps. The{" "}
        <Link href="/limitations">limitations</Link> page lists what this build does not cover.
      </p>
    </div>
  );
}
