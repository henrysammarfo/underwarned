# Docs notes

- Previous Runs docs: https://open-meteo.com/en/docs/previous-runs-api
- Endpoint: https://previous-runs-api.open-meteo.com/v1/forecast
- Hourly leads: temperature_2m_previous_day1 ... temperature_2m_previous_day7 (same for apparent_temperature).
- Most models archived from January 2024. GFS 2 m temperature from March 2021.
- Historical Weather / ERA5: https://open-meteo.com/en/docs/historical-weather-api
- Endpoint: https://archive-api.open-meteo.com/v1/archive
- temperature_2m_max_previous_day1 is invalid (HTTP 400). Compute daily max from hourly leads.
- Open-Meteo hosted API is non commercial. Credit Copernicus and ECMWF for ERA5.
- IEM MOS: https://mesonet.agron.iastate.edu/cgi-bin/request/mos.py
- IEM ASOS: https://mesonet.agron.iastate.edu/cgi-bin/request/asos.py
- Not used tonight, documented for the 25 Nov path.
