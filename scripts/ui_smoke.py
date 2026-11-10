#!/usr/bin/env python3
"""UI smoke against a running server. Usage: UW_SMOKE_URL=http://127.0.0.1:3100 python3 scripts/ui_smoke.py"""
import os
import sys
import urllib.request

BASE = os.environ.get("UW_SMOKE_URL", "http://127.0.0.1:3100").rstrip("/")
ROUTES = ["/", "/audit", "/events", "/compare", "/method", "/limitations", "/legal", "/data/summary.json"]

def get(path):
    req = urllib.request.Request(BASE + path, headers={"User-Agent": "Underwarned-smoke/1.0"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.status, r.read()

failed = 0
for path in ROUTES:
    try:
        status, body = get(path)
    except Exception as e:
        print(f"FAIL {path}: {e}")
        failed += 1
        continue
    if status != 200:
        print(f"FAIL {path}: HTTP {status}")
        failed += 1
        continue
    if path.endswith(".json"):
        if b"phoenix" not in body or b"generated_at" not in body:
            print(f"FAIL {path}: missing expected keys")
            failed += 1
            continue
    else:
        if path == "/" and b"missed at a 3 day lead" not in body:
            # home is a client page; HTML shell should still include the app root
            if b"Underwarned" not in body:
                print(f"FAIL {path}: missing Underwarned")
                failed += 1
                continue
        if b"<html" not in body.lower() and path != "/data/summary.json":
            print(f"FAIL {path}: not html")
            failed += 1
            continue
    print(f"ok  {path} ({status}, {len(body)} bytes)")

# 404
try:
    urllib.request.urlopen(urllib.request.Request(BASE + "/this-is-not-a-page", headers={"User-Agent": "Underwarned-smoke/1.0"}), timeout=20)
    print("FAIL /this-is-not-a-page: expected 404")
    failed += 1
except urllib.error.HTTPError as e:
    if e.code == 404:
        print("ok  /this-is-not-a-page (404)")
    else:
        print(f"FAIL /this-is-not-a-page: HTTP {e.code}")
        failed += 1

if failed:
    print(f"{failed} smoke checks failed")
    sys.exit(1)
print("all smoke checks passed")
