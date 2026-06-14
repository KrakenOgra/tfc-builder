#!/usr/bin/env bash
# learnings-log.sh — the reliable §4.3 learning appender (Wave 3, V2).
#
# Replaces the fragile inline `echo '{...}' >> learnings.jsonl` each skill hand-rolled
# (which produced 0 files across 6 commits). One call, schema-correct, quote-safe.
#
# Usage:  learnings-log.sh <category> <name> <type> <note...>
#   type ∈ operational | sharp_edge | routing | timing
# Appends {"ts","type","note","consumed_in":null} to the skill's learnings.jsonl.
# Exit 0 on append; exit 1 on bad args/type/missing skill (never writes a malformed line).
set -euo pipefail

CAT="${1:-}"
NAME="${2:-}"
TYPE="${3:-}"
if [ -n "$TYPE" ]; then shift 3; else shift "$#"; fi
NOTE="${*:-}"

if [ -z "$CAT" ] || [ -z "$NAME" ] || [ -z "$TYPE" ] || [ -z "$NOTE" ]; then
  echo "learnings-log: usage: learnings-log.sh <category> <name> <type> <note...>" >&2
  exit 1
fi

case "$TYPE" in
  operational|sharp_edge|routing|timing) ;;
  *)
    echo "learnings-log: invalid type '$TYPE' (operational|sharp_edge|routing|timing)" >&2
    exit 1
    ;;
esac

TFC_HOME="${TFC_HOME:-$HOME/.future-code}"
SKILL_DIR="$TFC_HOME/skills/$CAT/$NAME"
if [ ! -d "$SKILL_DIR" ]; then
  echo "learnings-log: no skill dir $SKILL_DIR" >&2
  exit 1
fi

# python3 json.dumps keeps the note quote/newline-safe — never hand-build JSON.
LINE=$(TFC_TYPE="$TYPE" TFC_NOTE="$NOTE" python3 -c '
import os, json, datetime
print(json.dumps({
    "ts": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "type": os.environ["TFC_TYPE"],
    "note": os.environ["TFC_NOTE"],
    "consumed_in": None,
}))')

printf '%s\n' "$LINE" >> "$SKILL_DIR/learnings.jsonl"
echo "learnings-log: appended $TYPE learning to $CAT/$NAME"
