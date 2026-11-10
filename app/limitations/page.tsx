import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Limitations" };

export default function LimitationsPage() {
  return (
    <div>
      <h1>Limitations</h1>
      <p>Dated 10 November 2026, Accra time (GMT). This list is part of the submitted method, not a footnote.</p>
      <ul>
        <li>
          ERA5 is a reanalysis, not a station thermometer. It can be smoother and slightly offset from an
          airport sensor. The user interface calls it the observation, never the measured airport
          temperature. An IEM MOS and ASOS cross check for Phoenix (KPHX) and Houston (KIAH) is planned
          if this project is shortlisted for 25 November, and is not in tonight&apos;s build.
        </li>
        <li>
          Previous Runs and ERA5 use different grids. In this ingest the cells were 3.40 km apart in
          Phoenix, 2.31 km in Houston, 11.66 km in Madrid, and 8.36 km in Delhi. The drill-down page
          prints both coordinates. Madrid&apos;s larger gap is a material caveat for that city.
        </li>
        <li>
          Results are for GFS seamless only. A miss or a false alarm is about this model family, not about
          every forecast a person might have read. Other models wait until 25 November if shortlisted.
        </li>
        <li>
          The sample is four cities and two northern warm seasons. It is not a global climatology.
          Adelaide and other cities are not included tonight.
        </li>
        <li>
          Apparent temperature is the Open-Meteo variable. The 40.6 °C threshold was chosen to match a
          105 °F heat index reference point. We do not compute the National Weather Service heat index
          ourselves.
        </li>
        <li>
          In Houston and Delhi, GFS daily maxima were too warm on average (about 3 °C at a 3 day lead),
          with many false alarms at 35 °C. Underprediction is not the only error, and this audit reports
          the warm bias rather than hiding it.
        </li>
        <li>
          Persistence skill can be negative when the model is badly biased, as it is in Houston and
          Delhi. That is a real result: yesterday&apos;s observation beat the 3 day forecast on daily
          maximum MAE.
        </li>
        <li>
          Null hours are dropped, never filled with zero. This ingest completed with zero dropped hours
          in all four cities and both seasons.
        </li>
        <li>
          No on-demand city search is offered tonight. Every published figure comes from the frozen JSON
          artifacts in this repository.
        </li>
      </ul>
      <p>
        <Link href="/method">Method</Link> · <Link href="/legal">Legal and sources</Link>
      </p>
    </div>
  );
}
