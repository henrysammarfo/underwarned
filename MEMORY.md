# Memory

- Product: Underwarned. DATANOVA 2026, DN-OP-01.
- Model: gfs_seamless on Previous Runs. Observation: ERA5. Day 0 is never truth.
- Cities: phoenix, houston, madrid, delhi. Seasons: 2024 and 2025, 1 May to 30 September.
- Ingest: `python3 scripts/ingest.py`. Tests: `python3 -m unittest discover -s tests -v`.
- IEM cross check, extra cities, second model, and demo video are deferred to 25 Nov if shortlisted.
- Grid distances (km): Phoenix 3.40, Houston 2.31, Madrid 11.66, Delhi 8.36.
- Spotlight miss: Phoenix 2024-07-01, 40.7 vs 37.7 at lead 3.
