# TFC runtime preamble — SOURCED by an installed skill's managed hook block (Wave 3, V2).
# Never `set -e` / `exit` here: this runs inside the caller's shell and must not kill it.
#
# Args: $1=category $2=name.
# Effects: (1) surfaces prior learnings, (2) appends an invocation row to
# analytics/runs.jsonl (the deterministic "this skill ran" proof — closes CRACK-A's
# input side; if it ever silently fails the run row is simply absent, never faked),
# (3) exposes `tfc_learn <type> <note>` so logging a genuine learning is one reliable call.

_tfc_preamble() {
  local cat="$1" name="$2"
  local home="${TFC_HOME:-$HOME/.future-code}"
  local sdir="$home/skills/$cat/$name"
  local rt="$home/mcp/tfc-builder/runtime"

  # 1. surface prior learnings (load what past runs learned)
  local lf="$sdir/learnings.jsonl"
  if [ -f "$lf" ]; then
    local n
    n=$(grep -c . "$lf" 2>/dev/null || echo 0)
    echo "TFC: $n prior learning(s) for $cat/$name"
    [ "${n:-0}" -gt 0 ] && tail -3 "$lf" 2>/dev/null | python3 -c '
import sys, json
for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    try:
        d = json.loads(line)
        print("  -", d.get("type", "?"), ":", (d.get("note", "") or "")[:100])
    except Exception:
        pass
' 2>/dev/null || true
  else
    echo "TFC: 0 prior learnings for $cat/$name (the loop has not run yet)"
  fi

  # 2. run record — the "it ran" proof
  mkdir -p "$home/analytics" 2>/dev/null || true
  local ts
  ts=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  printf '{"ts":"%s","skill":"%s/%s","event":"invoked"}\n' "$ts" "$cat" "$name" \
    >> "$home/analytics/runs.jsonl" 2>/dev/null || true

  # 3. expose the reliable learning logger
  _TFC_LEARN_CAT="$cat"
  _TFC_LEARN_NAME="$name"
  _TFC_LEARN_RT="$rt"
  tfc_learn() {
    bash "$_TFC_LEARN_RT/learnings-log.sh" "$_TFC_LEARN_CAT" "$_TFC_LEARN_NAME" "$@"
  }
}

_tfc_preamble "${1:-}" "${2:-}"
