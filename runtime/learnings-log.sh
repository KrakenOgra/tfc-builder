#!/usr/bin/env bash
# TFC Learnings Log helper
# Usage: source this then call tfc_log_learning "KEY" "INSIGHT" [type]
# Or call directly: bash ~/.future-code/runtime/learnings-log.sh KEY "INSIGHT" [type]
#
# Required env: _SKILL_ID, _SKILL_CAT, _PROJECT (set by preamble.sh)

tfc_log_learning() {
  local key="${1:?key required}"
  local insight="${2:?insight required}"
  local type="${3:-operational}"     # operational | sharp_edge | timing | routing
  local confidence="${4:-0.8}"
  local _TFC_HOME="${TFC_HOME:-$HOME/.future-code}"
  local _SKILL_ID="${_SKILL_ID:-unknown}"
  local _SKILL_CAT="${_SKILL_CAT:-unknown}"
  local _PROJECT="${_PROJECT:-$(basename "$(git rev-parse --show-toplevel 2>/dev/null)" 2>/dev/null || echo unknown)}"

  local learn_file="$_TFC_HOME/skills/$_SKILL_CAT/$_SKILL_ID/learnings.jsonl"
  mkdir -p "$(dirname "$learn_file")"

  local insight_safe="${insight//\"/\\\"}"
  echo "{\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"skill\":\"$_SKILL_ID\",\"type\":\"$type\",\"key\":\"$key\",\"insight\":\"$insight_safe\",\"confidence\":$confidence,\"source\":\"observed\",\"project\":\"$_PROJECT\"}" \
    >> "$learn_file"

  local line_count
  line_count=$(wc -l < "$learn_file" 2>/dev/null | tr -d ' ')
  if [ "${line_count:-0}" -gt 1000 ]; then
    tail -1000 "$learn_file" > "${learn_file}.tmp" && mv "${learn_file}.tmp" "$learn_file"
  fi
}

# If called directly (not sourced)
if [ "${BASH_SOURCE[0]}" = "$0" ]; then
  tfc_log_learning "$@"
fi
