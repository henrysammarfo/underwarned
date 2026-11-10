# Underwarned

How often the forecast is too cool when the heat actually arrives.

Underwarned is a forecast heat underprediction audit built for DATANOVA 2026, problem DN-OP-01 Open Innovation. It compares Open-Meteo Previous Runs (GFS seamless) at fixed 1 to 7 day leads with ERA5, in Phoenix, Houston, Madrid, and Delhi, for May to September 2024 and 2025.

This is not a dashboard of live weather. Every figure in the app is computed in advance and stored as static JSON. Judges can run the demo without an API key.

## What we found (computed 10 November 2026, UTC)

These numbers come from `public/data/`. They are not estimates.

In Phoenix, 169 days reached a 40 °C ERA5 daily maximum across the two summers. At a 3 day lead the GFS forecast stayed below 40 °C on 19 of those days (11.2 percent), and the mean shortfall on those misses was 1.44 °C. At a 7 day lead there were 23 misses (13.6 percent) and a mean shortfall of 2.52 °C. One clear case: on 1 July 2024 Phoenix reached 40.7 °C, while the 3 day forecast was 37.7 °C.

The pattern is not the same everywhere. In Houston and Delhi the same model ran too warm on average (about 3 °C at a 3 day lead on daily maxima). Dry bulb misses were rare there, and false alarms at 35 °C were common. Apparent temperature still shows underprediction at longer leads: in Delhi, 25 of 112 days at or above 40.6 °C apparent temperature were missed at a 7 day lead (22.3 percent), with a mean shortfall of 3.34 °C.

Read the in-app Limitations page for grid mismatch, the fact that ERA5 is reanalysis not a station, and the other caveats.

## Who it is for

A heat health planner, journalist, or city operations lead who needs to know whether warnings timed off a 3 day or 7 day forecast would have been late.

## Stack

- Next.js and TypeScript for the demo
- Python 3 for ingest and metrics (`scripts/ingest.py`, `scripts/metrics.py`)
- Static JSON in `public/data/`
- Hosted on Vercel

No secrets are required. Do not add API keys.

## Exact re-run steps

You need Python 3.10 or newer, Node.js 20 or newer, and a network path to Open-Meteo.

```bash
git clone https://github.com/henrysammarfo/underwarned.git
cd underwarned
python3 -m unittest discover -s tests -v
python3 scripts/ingest.py
npm install
npm run dev
```

`python3 scripts/ingest.py` rebuilds `public/data/summary.json` and the four city files from the live APIs. It takes under a minute in our checks. Then refresh the app.

```bash
npm run build
npm start
```

builds the production server.

## Screens

- `/` landing, with the 1 July 2024 Phoenix example
- `/audit` city, season, threshold, and lead
- `/events` hit, miss, and false alarm lists
- `/events/[city]/[date]` hourly drill-down
- `/compare` all four cities
- `/method` parameter names and formulas
- `/limitations` honest limits
- `/legal` sources and attribution

To review loading, empty, error, and partial treatments without inventing figures, append `?demo=loading`, `?demo=empty`, `?demo=error`, or `?demo=partial`. The empty state also appears naturally (for example Madrid at 45 °C).

## Tests

```bash
python3 -m unittest discover -s tests -v
```

The suite locks signed error, daily maxima from hourly values, hit and miss rules, skill scores, the rule that incomplete days are not misses, the rule that day 0 is not a lead, and the stored 1 July 2024 Phoenix miss.

## Licence and credit

Code in this repository is available for the contest and for review. Weather data remains subject to Open-Meteo terms and to Copernicus and ECMWF credit for ERA5. See `/legal`.
