#!/usr/bin/env bash
# TFC Preamble v1 — source this at the top of any TFC skill's preamble bash block
# Usage: source <(cat ~/.future-code/runtime/preamble.sh)
# Or paste the block directly into SKILL.md (current approach until TFC CLI exists)

# Required env before sourcing:
#   _SKILL_ID   — the skill's id (matches spec.yaml id and directory name)
#   _SKILL_CAT  — the skill's category directory

_TFC_HOME="${TFC_HOME:-$HOME/.future-code}"
_SESSION_ID="$$-$(date +%s)"
_TEL_START=$(date +%s)
_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
_PROJECT=$(basename "$(git rev-parse --show-toplevel 2>/dev/null)" 2>/dev/null || echo "unknown")

echo "BRANCH: $_BRANCH | PROJECT: $_PROJECT | SESSION: $_SESSION_ID"

# Model tier from spec
_MODEL_TIER=$(grep '^model_tier:' "$_TFC_HOME/skills/$_SKILL_CAT/$_SKILL_ID/spec.yaml" 2>/dev/null \
  | awk '{print $2}' | tr -d '"' || echo "sonnet")
echo "MODEL_TIER: $_MODEL_TIER"

# Learnings surface
_LEARN_FILE="$_TFC_HOME/skills/$_SKILL_CAT/$_SKILL_ID/learnings.jsonl"
if [ -f "$_LEARN_FILE" ]; then
  _LC=$(wc -l < "$_LEARN_FILE" 2>/dev/null | tr -d ' ')
  echo "LEARNINGS: $_LC entries loaded"
  if [ "${_LC:-0}" -gt 0 ] 2>/dev/null; then
    tail -5 "$_LEARN_FILE" 2>/dev/null | python3 -c "
import sys, json
for line in sys.stdin:
    line = line.strip()
    if not line: continue
    try:
        d = json.loads(line)
        print('  •', d.get('insight','')[:120])
    except: pass
" 2>/dev/null | head -3 || tail -1 "$_LEARN_FILE"
  fi
else
  echo "LEARNINGS: 0"
fi

# Skill version
_SPEC_VER=$(grep '^version:' "$_TFC_HOME/skills/$_SKILL_CAT/$_SKILL_ID/spec.yaml" 2>/dev/null | awk '{print $2}')
echo "SKILL_VERSION: ${_SPEC_VER:-unknown}"

# Recovery check: surface unannotated structural records (hook-written, no insight)
if [ -f "$_LEARN_FILE" ] && [ "${_LC:-0}" -gt 0 ]; then
  _LAST_INSIGHT=$(tail -1 "$_LEARN_FILE" 2>/dev/null | python3 -c "
import sys, json
try:
    d = json.loads(sys.stdin.read().strip())
    print('yes' if d.get('insight','').strip() else 'no')
except: print('unknown')
" 2>/dev/null || echo "unknown")
  if [ "$_LAST_INSIGHT" = "no" ]; then
    echo "EXECUTION RECORD PENDING: last run has no insight — write the EXECUTION RECORD block to close the loop."
  fi
fi
