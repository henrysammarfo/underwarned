#!/usr/bin/env python3
"""Rubric-mapped Underwarned slide deck. Figures are from public/data only."""
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.oxml.ns import nsmap, qn
from lxml import etree
from pathlib import Path

BG = RGBColor(0xF6, 0xF1, 0xE8)
SURFACE = RGBColor(0xFF, 0xFA, 0xF4)
TEXT = RGBColor(0x1C, 0x19, 0x17)
MUTED = RGBColor(0x53, 0x4E, 0x47)
ACCENT = RGBColor(0xC2, 0x3B, 0x22)
GOLD = RGBColor(0xC4, 0xA0, 0x35)
FORECAST = RGBColor(0x3F, 0x5B, 0x73)

prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)

def fill_slide(slide, color=BG):
    bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
    bg.line.fill.background()
    bg.fill.solid()
    bg.fill.fore_color.rgb = color
    # send to back
    spTree = slide.shapes._spTree
    sp = bg._element
    spTree.remove(sp)
    spTree.insert(2, sp)
    return slide

def add_text(slide, l, t, w, h, text, size=18, color=TEXT, bold=False, font="Georgia", align=PP_ALIGN.LEFT):
    box = slide.shapes.add_textbox(Inches(l), Inches(t), Inches(w), Inches(h))
    tf = box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.alignment = align
    run = p.add_run()
    run.text = text
    run.font.size = Pt(size)
    run.font.color.rgb = color
    run.font.bold = bold
    run.font.name = font
    return box

def add_paras(slide, l, t, w, h, lines, size=18, color=TEXT, font="Calibri", leading=None):
    box = slide.shapes.add_textbox(Inches(l), Inches(t), Inches(w), Inches(h))
    tf = box.text_frame
    tf.word_wrap = True
    for i, line in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.space_after = Pt(8)
        run = p.add_run()
        run.text = line
        run.font.size = Pt(size)
        run.font.color.rgb = color
        run.font.name = font
    return box

# 1 Title
s = fill_slide(prs.slides.add_slide(prs.slide_layouts[6]))
add_text(s, 0.8, 0.35, 11, 0.5, "Underwarned", size=22, font="Georgia")
add_text(s, 0.8, 1.3, 12, 1.8, "11.2%", size=120, color=ACCENT, font="Georgia")
add_text(s, 0.8, 3.15, 12, 0.7, "missed at a 3 day lead", size=32, font="Georgia")
add_text(s, 0.8, 3.95, 11.5, 1.1, "Of 169 Phoenix days at or above 40 °C across May to September 2024 and 2025, 19 were forecast too cool to cross the mark. Mean shortfall on those misses: 1.4 °C.", size=18, font="Calibri")
add_text(s, 0.8, 6.5, 11.5, 0.6, "DATANOVA 2026, problem DN-OP-01. A GFS seamless audit at 1 to 7 day leads, against ERA5. Live demo: https://underwarned.vercel.app", size=14, color=MUTED, font="Calibri")

# 2 The miss
s = fill_slide(prs.slides.add_slide(prs.slide_layouts[6]))
add_text(s, 0.8, 0.4, 11, 0.5, "One day in Phoenix", size=16, color=MUTED, font="Calibri")
add_text(s, 0.8, 0.9, 12, 1.0, "1 July 2024: the heat arrived 3.0 °C hotter than the 3 day forecast.", size=28, font="Georgia")
for i, (val, cap, col) in enumerate([
    ("37.7 °C", "GFS forecast, 3 day lead", FORECAST),
    ("40.7 °C", "ERA5 daily maximum", TEXT),
    ("3.0 °C", "Shortfall, and below the 40 °C mark", ACCENT),
]):
    left = 0.8 + i * 4.0
    rule = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(left), Inches(2.35), Inches(3.5), Inches(0.015))
    rule.fill.solid()
    rule.fill.fore_color.rgb = RGBColor(0xD9, 0xD0, 0xC4)
    rule.line.fill.background()
    add_text(s, left, 2.5, 3.5, 1.0, val, size=40, color=col, font="Georgia")
    add_text(s, left, 3.5, 3.5, 0.6, cap, size=14, color=MUTED, font="Calibri")
# miss ribbon bar
bar = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(4.4), Inches(4.25), Inches(4.5), Inches(0.28))
bar.fill.solid()
bar.fill.fore_color.rgb = ACCENT
bar.line.fill.background()
tick = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(7.15), Inches(4.12), Inches(0.04), Inches(0.54))
tick.fill.solid()
tick.fill.fore_color.rgb = GOLD
tick.line.fill.background()
add_text(s, 0.8, 5.05, 11.5, 1.8, "This is one computed day, not an illustration. Across both summers, Phoenix had 169 days at or above 40 °C. The 3 day forecast missed 19 of them (11.2 percent), by 1.44 °C on average when it missed. At a 7 day lead it missed 23 days (13.6 percent), by 2.52 °C.", size=16, font="Calibri")

# 3 Why it matters  Problem 15, Impact 15
s = fill_slide(prs.slides.add_slide(prs.slide_layouts[6]))
add_text(s, 0.8, 0.4, 11, 0.5, "Problem and impact", size=16, color=MUTED, font="Calibri")
add_text(s, 0.8, 0.9, 12, 1.0, "Warnings are timed off forecasts. A cool bias on a hot day starts the response late.", size=28, font="Georgia")
add_paras(s, 0.8, 2.3, 11.5, 4.5, [
    "The CDC counted 2,391 heat related deaths in the United States in 2024 (MMWR, 3 September 2026). A JAMA analysis of the same family of certificate codes counted 2,325 such deaths in 2023, the highest year in that 1999 to 2023 series. Certificate counts are a lower bound.",
    "Ford, Schoof, Bader, and Dirmeyer (NOAA, 2018) found that NCEP heat wave forecasts fail to persist heat waves as readily as is observed, that this worsens at longer leads, and that skill is particularly poor over the Southwest United States.",
    "Underwarned turns that question into a public, repeatable audit: how often, by how many degrees, and at which lead, on a recent four city sample that anyone can re-run.",
], size=18)

# 4 Method  Technical 25, Data rigor 15
s = fill_slide(prs.slides.add_slide(prs.slide_layouts[6]))
add_text(s, 0.8, 0.4, 11, 0.5, "Method. Technical and data rigor", size=16, color=MUTED, font="Calibri")
add_text(s, 0.8, 0.9, 12, 0.8, "Fixed 1 to 7 day leads from Previous Runs, scored against ERA5.", size=26, font="Georgia")
add_paras(s, 0.8, 2.0, 11.5, 5, [
    "Forecasts: Open-Meteo Previous Runs, models=gfs_seamless. Hourly fields temperature_2m_previous_day1 through temperature_2m_previous_day7, and the same names for apparent_temperature.",
    "Observation: Open-Meteo ERA5 archive, hourly temperature_2m and apparent_temperature. Day 0 of Previous Runs is never treated as truth. The Historical Forecast API is not used.",
    "Daily maxima at each lead are computed from the hourly lead series. The Previous Runs daily field temperature_2m_max_previous_day1 does not exist (HTTP 400 on 10 November 2026).",
    "Cities: Phoenix, Houston, Madrid, Delhi. Window: 1 May to 30 September in 2024 and in 2025. A day is complete when at least 20 local hours are paired. Incomplete days are not scored as misses.",
    "No API key. Artifacts are frozen in the repo as public/data/*.json and can be rebuilt with python3 scripts/ingest.py.",
], size=16)

# 5 Metrics
s = fill_slide(prs.slides.add_slide(prs.slide_layouts[6]))
add_text(s, 0.8, 0.4, 11, 0.5, "Metrics. Technical and data rigor", size=16, color=MUTED, font="Calibri")
add_text(s, 0.8, 0.9, 12, 0.8, "Event scores first, average bias second.", size=26, font="Georgia")
add_paras(s, 0.8, 2.0, 11.5, 5, [
    "Signed error is forecast minus observation. Negative means the forecast was too cool. We also report MAE and RMSE on hours and on daily maxima.",
    "Skill is 1 minus forecast MAE over a reference MAE. References are persistence (yesterday's observed daily maximum) and climatology (the 1991 to 2020 ERA5 mean for that calendar day).",
    "A miss is a day when ERA5 reached the threshold and the forecast stayed below it. We report miss rate, hits, false alarms, and the mean shortfall on missed days only.",
    "Thresholds: 35, 40, and 45 °C daily maximum; 40.6 °C apparent temperature (a 105 °F heat index reference; we do not claim this is the official heat index); and the local 95th and 99th percentiles of ERA5 daily maxima, 1991 to 2020.",
    "A warm monthly mean can hide missed peaks. That is why the headline figures are conditional on threshold events.",
], size=16)

# 6 Findings  Innovation, rigor, impact
s = fill_slide(prs.slides.add_slide(prs.slide_layouts[6]))
add_text(s, 0.8, 0.35, 12, 0.4, "Findings from the frozen artifacts, not estimates", size=16, color=MUTED, font="Calibri")
add_text(s, 0.8, 0.7, 12, 0.7, "Phoenix underpredicts 40 °C days as lead grows. Houston and Delhi run too warm.", size=24, font="Georgia")

# table-like rows
rows = [
    ("Phoenix, 40 °C, 169 events", "Lead 1: 2.4% missed (4).  Lead 3: 11.2% missed (19), shortfall 1.44 °C.  Lead 7: 13.6% missed (23), shortfall 2.52 °C."),
    ("Phoenix, 40.6 °C apparent, 131 events", "Lead 3: 19.8% missed (26), shortfall 2.03 °C.  Lead 7: 26.7% missed (35), shortfall 2.94 °C."),
    ("Madrid, 35 °C, 86 events", "Lead 3: 5.8% missed (5).  Lead 7: 19.8% missed (17), shortfall 2.88 °C.  All 4 days at 40 °C were misses at every lead (small sample)."),
    ("Houston and Delhi, daily maximum at lead 3", "Mean error about +3.2 to +3.7 °C (too warm). Many 35 °C false alarms. Skill versus persistence is negative: yesterday beat the forecast on MAE."),
    ("Delhi, 40.6 °C apparent, 112 events", "Lead 7 still underpredicts: 22.3% missed (25), shortfall 3.34 °C. Apparent temperature is where the humid cities still show a miss."),
]
y = 1.55
for title, body in rows:
    add_text(s, 0.8, y, 11.7, 0.3, title, size=15, bold=True, font="Calibri")
    add_text(s, 0.8, y + 0.28, 11.7, 0.7, body, size=14, color=TEXT, font="Calibri")
    y += 1.05

# 7 What is new  Innovation 20
s = fill_slide(prs.slides.add_slide(prs.slide_layouts[6]))
add_text(s, 0.8, 0.4, 11, 0.5, "What is new. Innovation", size=16, color=MUTED, font="Calibri")
add_text(s, 0.8, 0.9, 12, 1.0, "A public, fixed lead audit of underprediction, not a nowcast dashboard.", size=28, font="Georgia")
add_paras(s, 0.8, 2.2, 11.5, 4.5, [
    "Most weather sites show the latest forecast. Underwarned shows how often earlier runs were too cool on the days that actually got hot, at the exact leads a warning would use.",
    "The Open-Meteo Previous Runs API is built for this comparison. We do not use the Historical Forecast API, which is a near nowcast style archive.",
    "The product is honest about mixed results. A Phoenix miss rate that grows with lead is reported next to a Houston and Delhi warm bias, not hidden behind a single headline.",
    "Every number is in the repo, covered by unit tests, and can be rebuilt without keys.",
], size=18)

# 8 Who uses it  Impact 15
s = fill_slide(prs.slides.add_slide(prs.slide_layouts[6]))
add_text(s, 0.8, 0.4, 11, 0.5, "Who uses it. Impact and feasibility", size=16, color=MUTED, font="Calibri")
add_text(s, 0.8, 0.9, 12, 1.0, "A planner or journalist can open a city, pick a threshold, and see whether a 3 day or 7 day warning would have been late.", size=26, font="Georgia")
add_paras(s, 0.8, 2.4, 11.5, 4.2, [
    "The demo already does that for four cities and two summers, with event lists and hourly drill-downs.",
    "If shortlisted, the 25 November path adds an IEM MOS and ASOS check at Phoenix (KPHX) and Houston (KIAH), so a miss against ERA5 can be confirmed at a thermometer.",
    "The method is cheap to extend: any Open-Meteo city, any later season, and a second model such as ECMWF IFS, without changing the scoring rules.",
], size=18)

# 9 Limits  Data rigor, Presentation
s = fill_slide(prs.slides.add_slide(prs.slide_layouts[6]))
add_text(s, 0.8, 0.4, 11, 0.5, "Limits. Data rigor", size=16, color=MUTED, font="Calibri")
add_text(s, 0.8, 0.9, 12, 0.8, "What this build does not claim.", size=28, font="Georgia")
add_paras(s, 0.8, 2.0, 11.5, 5, [
    "ERA5 is reanalysis, not a station reading. We never call it the airport thermometer.",
    "The forecast and observation sit on different grids. Distances in this ingest: Phoenix 3.40 km, Houston 2.31 km, Madrid 11.66 km, Delhi 8.36 km. Madrid's gap is a material caveat.",
    "Results are for GFS seamless only, in four cities, over two northern warm seasons.",
    "Apparent temperature is the Open-Meteo variable, not a self computed National Weather Service heat index.",
    "This ingest completed with zero dropped hours. IEM confirmation, extra cities, a second model, and a demo video are planned only if we are shortlisted for 25 November.",
], size=18)

# 10 Close  Presentation
s = fill_slide(prs.slides.add_slide(prs.slide_layouts[6]))
add_text(s, 0.8, 0.4, 11, 0.4, "Underwarned", size=22, font="Georgia")
add_text(s, 0.8, 1.3, 12, 1.6, "11.2%", size=96, color=ACCENT, font="Georgia")
add_text(s, 0.8, 2.95, 12, 0.5, "missed at a 3 day lead", size=28, font="Georgia")
add_text(s, 0.8, 3.5, 12, 0.4, "How often the forecast is too cool when the heat actually arrives.", size=18, font="Georgia")
add_paras(s, 0.8, 4.2, 11.5, 2.6, [
    "DATANOVA 2026, problem DN-OP-01. Live demo: https://underwarned.vercel.app",
    "Repository: https://github.com/henrysammarfo/underwarned",
    "Re-run: python3 -m unittest discover -s tests -v, then python3 scripts/ingest.py",
    "Team: Henry Marfo. Please add any teammate on Devpost before submit.",
], size=16, color=TEXT)

out1 = Path("/workspace/Underwarned-DATANOVA-deck.pptx")
out2 = Path("/workspace/underwarned/docs/Underwarned-DATANOVA-deck.pptx")
out2.parent.mkdir(parents=True, exist_ok=True)
prs.save(str(out1))
prs.save(str(out2))
print("wrote", out1, out1.stat().st_size)
