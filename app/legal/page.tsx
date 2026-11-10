import type { Metadata } from "next";

export const metadata: Metadata = { title: "Legal and sources" };

export default function LegalPage() {
  return (
    <div>
      <h1>Legal and sources</h1>
      <p>
        Underwarned is a student project for DATANOVA 2026. It has no accounts and stores no personal
        data in the app.
      </p>
      <h2>Weather data</h2>
      <p>
        Forecast leads come from the Open-Meteo Previous Runs API, used under Open-Meteo&apos;s non
        commercial terms for the hosted API. Historical observations and the 1991 to 2020 climatology come
        from the Open-Meteo Historical Weather archive, which serves ERA5. ERA5 is produced by ECMWF as
        part of the Copernicus Climate Change Service. Please credit Open-Meteo, Copernicus, and ECMWF
        when you reuse these figures.
      </p>
      <p>
        An IEM MOS and ASOS cross check is planned later. Iowa Environmental Mesonet asks for
        attribution when that data is used. It is not used in the tonight artifacts.
      </p>
      <h2>Mortality and research citations</h2>
      <ul>
        <li>
          CDC MMWR, 3 September 2026: 2,391 heat related deaths in the United States in 2024.{" "}
          <a href="https://www.cdc.gov/mmwr/volumes/75/wr/mm7534a3.htm">
            https://www.cdc.gov/mmwr/volumes/75/wr/mm7534a3.htm
          </a>
        </li>
        <li>
          JAMA, 26 August 2024, heat related deaths 1999 to 2023 (2,325 in 2023).{" "}
          <a href="https://jamanetwork.com/journals/jama/fullarticle/2822854">
            https://jamanetwork.com/journals/jama/fullarticle/2822854
          </a>
        </li>
        <li>
          Ford, Schoof, Bader, and Dirmeyer, NOAA repository, 2018, evaluation of heat wave forecasts.{" "}
          <a href="https://repository.library.noaa.gov/view/noaa/24168">
            https://repository.library.noaa.gov/view/noaa/24168
          </a>
        </li>
      </ul>
      <h2>Fonts</h2>
      <p>
        Newsreader and IBM Plex Sans and Mono are self hosted from the app bundle. They are not loaded
        from Google&apos;s servers.
      </p>
      <p>
        Official contest pages:{" "}
        <a href="https://datanova-2026-global-data-thon.devpost.com">Devpost</a> and{" "}
        <a href="https://datanovathon.com/">datanovathon.com</a>. Previous Runs docs:{" "}
        <a href="https://open-meteo.com/en/docs/previous-runs-api">
          https://open-meteo.com/en/docs/previous-runs-api
        </a>
        . Historical Weather docs:{" "}
        <a href="https://open-meteo.com/en/docs/historical-weather-api">
          https://open-meteo.com/en/docs/historical-weather-api
        </a>
        .
      </p>
    </div>
  );
}
