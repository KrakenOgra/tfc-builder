#!/usr/bin/env bash
# replay-aggregate.sh — Wave 4 (v3, W-V5): reduce N eval-report samples to a stability verdict.
#
# A single eval RUN is Claude-driven and therefore non-deterministic; one lucky run could mint a
# lane and one unlucky run could revoke it. This aggregates N reports' behavioral_score into
# {n, mean, stdev, min, pass_threshold, stable}. stable = (stdev <= 0.05) AND (min >= threshold):
# promotion should require behavior that is STABLE across samples, not high in a single run.
#
# Usage:  replay-aggregate.sh <eval-report.1.json> <eval-report.2.json> ...
# Pure bash + python3 math; no model API (INV-1). Reads only the passed report files.
set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo '{"error":"usage: replay-aggregate.sh <report.json> [report.json ...]"}' >&2
  exit 1
fi

python3 - "$@" <<'PY'
import sys, json, statistics

files = sys.argv[1:]
scores = []
threshold = None
for f in files:
    try:
        with open(f) as fh:
            d = json.load(fh)
    except Exception as e:
        print(json.dumps({"error": f"cannot read {f}: {e}"}))
        sys.exit(1)
    s = d.get("behavioral_score")
    if not isinstance(s, (int, float)):
        print(json.dumps({"error": f"{f}: no numeric behavioral_score"}))
        sys.exit(1)
    scores.append(float(s))
    t = d.get("pass_threshold")
    if isinstance(t, (int, float)):
        threshold = float(t)

n = len(scores)
mean = sum(scores) / n
stdev = statistics.pstdev(scores) if n > 1 else 0.0
mn = min(scores)
pt = threshold if threshold is not None else 0.8
stable = (stdev <= 0.05) and (mn >= pt)
print(json.dumps({
    "n": n,
    "mean": round(mean, 4),
    "stdev": round(stdev, 4),
    "min": mn,
    "pass_threshold": pt,
    "stable": stable,
}))
PY
