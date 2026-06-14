#!/usr/bin/env bash
# lane-gate.sh — the DETERMINISTIC judge of an eval-report.json (Wave 2, V3).
#
# Claude is the engine of the RUN (it executes the tfc_eval prompt); this gate is the
# judge of the REPORT. It never asks a model anything — it validates shape + threshold
# from disk and exits non-zero on a malformed or below-threshold report. This is the
# eval-theater firewall: a report only counts if it is structurally honest.
#
# Usage:  bash runtime/lane-gate.sh <path/to/eval-report.json>
# Exit 0  → report is valid AND behavioral_score >= pass_threshold.
# Exit 1  → usage/IO error.   Exit 2 → report invalid or below threshold.
set -euo pipefail

REPORT="${1:-}"
if [ -z "$REPORT" ]; then
  echo "lane-gate: usage: lane-gate.sh <eval-report.json>" >&2
  exit 1
fi
if [ ! -f "$REPORT" ]; then
  echo "lane-gate: no such file: $REPORT" >&2
  exit 1
fi

# Sibling evals.yaml (same skill dir) — checked so a report can't pass against a
# malformed eval definition (a golden task with no observable must/must_not).
EVALS="$(dirname "$REPORT")/evals.yaml"

python3 - "$REPORT" "$EVALS" <<'PY'
import json, sys, os

report_path, evals_path = sys.argv[1], sys.argv[2]
errors = []

# ── 1. report is valid JSON ──────────────────────────────────────────────────
try:
    with open(report_path) as f:
        rep = json.load(f)
except Exception as e:
    print(f"lane-gate: eval-report is not valid JSON: {e}", file=sys.stderr)
    sys.exit(2)

if not isinstance(rep, dict):
    print("lane-gate: eval-report must be a JSON object", file=sys.stderr)
    sys.exit(2)

# ── 2. skill_version present and non-empty ───────────────────────────────────
sv = rep.get("skill_version")
if not isinstance(sv, str) or not sv.strip():
    errors.append("skill_version missing or empty")

# ── 3. pass_threshold is a number in 0..1 (default 0.8 if absent) ─────────────
threshold = rep.get("pass_threshold", 0.8)
if not isinstance(threshold, (int, float)) or not (0.0 <= float(threshold) <= 1.0):
    errors.append(f"pass_threshold not a number in 0..1: {threshold!r}")
    threshold = None

# ── 4. behavioral_score is a number in 0..1 ──────────────────────────────────
score = rep.get("behavioral_score")
if not isinstance(score, (int, float)) or not (0.0 <= float(score) <= 1.0):
    errors.append(f"behavioral_score not a number in 0..1: {score!r}")
    score = None

# ── 5. per_task is an array of >=3, each with a boolean pass ──────────────────
per = rep.get("per_task")
if not isinstance(per, list):
    errors.append("per_task is not an array")
    per = []
elif len(per) < 3:
    errors.append(f"per_task has {len(per)} tasks; >=3 required for eval_proven")
for i, t in enumerate(per):
    if not isinstance(t, dict):
        errors.append(f"per_task[{i}] is not an object")
        continue
    if not isinstance(t.get("pass"), bool):
        errors.append(f"per_task[{i}] (id={t.get('id')!r}) has no boolean 'pass'")

# ── 6. behavioral_score consistent with per_task pass count ──────────────────
if score is not None and per and all(isinstance(t, dict) for t in per):
    passed = sum(1 for t in per if t.get("pass") is True)
    expected = passed / len(per)
    if abs(expected - float(score)) > 1e-6:
        errors.append(
            f"behavioral_score {score} != passed/total {passed}/{len(per)}={expected:.4f}"
        )

# ── 7. sibling evals.yaml: every golden task has observable must/must_not ─────
if os.path.exists(evals_path):
    try:
        import yaml
        with open(evals_path) as f:
            evals = yaml.safe_load(f) or {}
        tasks = evals.get("golden_tasks") or []
        for t in tasks:
            tid = (t or {}).get("id", "?")
            must = (t or {}).get("must") or []
            must_not = (t or {}).get("must_not") or []
            if not must and not must_not:
                errors.append(f"evals.yaml task {tid!r} has no must/must_not (eval-theater)")
    except Exception as e:
        errors.append(f"evals.yaml unreadable: {e}")

# ── 8. threshold gate (only meaningful if shape is sound) ─────────────────────
if not errors and threshold is not None and score is not None:
    if float(score) < float(threshold):
        print(
            f"lane-gate: behavioral_score {score} < pass_threshold {threshold} — "
            f"valid shape, below floor (stays authored)",
            file=sys.stderr,
        )
        sys.exit(2)

if errors:
    print("lane-gate: REPORT INVALID", file=sys.stderr)
    for e in errors:
        print(f"  - {e}", file=sys.stderr)
    sys.exit(2)

print(f"lane-gate: OK — behavioral_score {score} >= threshold {threshold}, "
      f"{len(per)} tasks, version {sv}")
PY
