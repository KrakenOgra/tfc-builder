# Genius AI Protocol

> **Load this skill when:** you want to use AI dramatically better for a specific goal, you keep getting generic outputs, or you want to compound AI results across sessions.

---

## PREAMBLE

```bash
_SKILL_ID="genius-ai" _SKILL_CAT="ai"
source /home/roshish/.future-code/runtime/preamble.sh
```

---

## PHASE 0 — DIAGNOSTIC (run first, always)

Ask the user exactly these three questions before proceeding. Do not map to a Law until all three are answered.

```
1. GOAL    — What specific outcome are you trying to produce? (be concrete: deliverable, not aspiration)
2. TRIED   — What have you already asked the AI to do? What happened?
3. BLOCKED — Where exactly does the output fall short? (too generic / wrong format / missing depth / wrong voice / other)
```

**Gate:** If GOAL is vague ("help me use AI better", "improve things"), ask:
> "If this worked perfectly, what would you have in 30 days that you don't have now?"
Do not proceed to Phase 1 until the goal is specific and measurable.

---

## THE 7 LAWS OF AI LEVERAGE

| Law | Name | Core Insight | When it applies |
|---|---|---|---|
| **1** | **Context Maximization** | The model can only return what it can infer — missing context is the #1 source of generic output | User gave a thin prompt; output feels generic |
| **2** | **Role Assignment** | A model told it IS an expert produces expert output; a model told to BE HELPFUL produces average output | Outputs lack domain depth or authority |
| **3** | **Decomposition** | Complex tasks broken into atomic steps produce 10x better results than one-shot prompts | Task is multi-step; user tried one long prompt |
| **4** | **Compounding** | AI output fed back as input compounds — one session alone is the worst AI lever | User asks once, accepts, moves on |
| **5** | **Constraint Design** | Tight output constraints (format, length, voice, audience) prevent the model from averaging | Outputs are "everything and nothing" |
| **6** | **Adversarial Testing** | Having the model critique, steelman, or red-team its own output surfaces the gap between good and great | Output seems fine but feels hollow |
| **7** | **Bottleneck Focus** | Identify the one constraint limiting the whole system; AI effort on non-bottlenecks is waste | User is doing many things with AI, none compounding |

---

## THE 25-PATTERN LIBRARY

### Law 1 — Context Maximization
| Code | Pattern | One-line description |
|---|---|---|
| P01 | Expert Role | Open with "You are a [specific expert] with [specific context]" |
| P02 | Context Dump | Paste your raw material before the question — give the model your world |
| P03 | Example-First | Show one ideal example before asking for output |
| P04 | Negative Space | State what you do NOT want alongside what you do |

### Law 2 — Role Assignment
| Code | Pattern | One-line description |
|---|---|---|
| P05 | Domain Expert Lock | Assign a precise role with credentials, not just a title |
| P06 | Persona Frame | "You are advising your best client on this decision" |
| P07 | Stakeholder Simulation | Ask the model to respond as a specific person the user knows |

### Law 3 — Decomposition
| Code | Pattern | One-line description |
|---|---|---|
| P08 | Step-by-Step Chain | Break output into numbered stages; ask for one at a time |
| P09 | Chain of Thought | Ask model to reason explicitly before answering |
| P11 | Atomic Units | Reduce the task until each prompt has exactly one job |

### Law 4 — Compounding
| Code | Pattern | One-line description |
|---|---|---|
| P10 | Iteration Ladder | Ask → critique → revise → repeat; never accept draft 1 |
| P12 | Output→Input Chain | Feed this session's best output into the next prompt as context |
| P13 | Self-Critique Loop | After any output: "What are the 3 weakest parts of that?" |
| P14 | Memory Thread | Start each session by pasting the key decision from the last one |

### Law 5 — Constraint Design
| Code | Pattern | One-line description |
|---|---|---|
| P15 | Format Lock | Specify output format explicitly (bullets/table/prose/JSON) |
| P16 | Word Count Gate | "In exactly 50 words or fewer" — constraint forces compression |
| P17 | Audience Pin | "Write this for a [specific person] who knows [specific thing]" |
| P18 | Constraint Cascade | Add constraints progressively until the output is precise |

### Law 6 — Adversarial Testing
| Code | Pattern | One-line description |
|---|---|---|
| P19 | Devil's Advocate | "Argue strongly against this" — surfaces assumptions |
| P20 | Red Team | "Find every way this could fail" — stress test before committing |
| P21 | Steel Man | "Make the strongest possible version of the opposing view" |
| P22 | Pressure Test | "What would a skeptical expert say about this?" |

### Law 7 — Bottleneck Focus
| Code | Pattern | One-line description |
|---|---|---|
| P23 | Constraint Mapping | "List all the things currently limiting [goal] in order of impact" |
| P24 | 10x Move | "What one change would make this 10x better?" — forces prioritization |
| P25 | One-Lever Rule | "If you could only improve one thing here, what would it be?" |

---

## PHASE 1 — LAW MAPPING

Map the BLOCKED answer to the primary law:

| If the user says... | Primary Law |
|---|---|
| "Too generic / vague / shallow" | Law 1 (Context) |
| "Doesn't sound like an expert" | Law 2 (Role) |
| "Can't handle the whole task at once" | Law 3 (Decomp) |
| "I ask once and get one shot" | Law 4 (Compounding) |
| "Output goes in every direction" | Law 5 (Constraint) |
| "Seems fine but hollow / I'm not sure it's right" | Law 6 (Adversarial) |
| "Doing lots of AI things, none compounding" | Law 7 (Bottleneck) |

Select **1 primary law**. Pick 2 patterns from it. Pick 1 pattern from the most adjacent law. Maximum 3 patterns per session.

---

## PHASE 2 — LEVERAGE POINT

State in one sentence: "The gap between what you're getting and what's possible is [specific constraint]."

This is the user's leverage point. Be precise — vague leverage points produce vague prompts.

---

## PHASE 3 — READY-TO-USE OUTPUT

Produce exactly one of:
- **Elite prompt** — paste-and-run, using the 3 selected patterns
- **Compound workflow** — 2–4 step chain with prompts for each step

Label it clearly. Make it copy-paste ready with no further editing needed.

---

## PHASE 4 — MENTAL MODEL INSTALL

End every session with the mental model tied to the governing Law. One sentence. Imperative.

Then call:
```
mind_remember(
  user_id="550e8400-e29b-41d4-a716-446655440000",
  content="[Law N] — [the mental model sentence]",
  content_type="preference",
  temporal_level=3,
  salience=0.9
)
```

**Standard mental models by law:**
- Law 1: "Always give AI your world before asking for its words."
- Law 2: "Tell AI who it IS, not what you need — expertise follows identity."
- Law 3: "One prompt, one job. Complexity belongs to the chain, not the prompt."
- Law 4: "Draft 1 is research. The real output is draft 3."
- Law 5: "Constrain the output format before you constrain the content."
- Law 6: "Make AI argue against its own answer before you act on it."
- Law 7: "Find the one thing. AI effort on non-bottlenecks is zero leverage."

---

## OUTPUT FORMAT BLOCK

```
## DIAGNOSTIC
Goal     : [specific, measurable outcome]
Tried    : [what they asked + what happened]
Blocked  : [where output fell short]

## LAW MAPPED: Law [N] — [Name]

## PATTERNS SELECTED: [P##] [P##] [P##]

## LEVERAGE POINT:
[one sentence: the gap between current and possible]

## READY-TO-USE PROMPT / WORKFLOW:
[paste-ready prompt or labeled step chain]

## MENTAL MODEL INSTALL:
[one sentence — the law's core insight as a personal rule]
```

---

## SHARP EDGES

**Vague goal breaks law mapping.** A goal of "help me use AI better" makes all 7 laws look plausible — law mapping becomes arbitrary and pattern selection produces generic output. Run the diagnostic gate. If still vague: "If this worked perfectly, what would you have in 30 days?"

**Pattern overload.** Selecting 5+ patterns fragments attention. Three patterns = cognitive limit per session. Pick 1 primary law, 2 patterns from it, 1 adjacent law pattern.

**Skipping the mental model.** The prompt helps now. The mental model compounds. Law 4 (Compounding) installed as a mental model gets 10x more value from every future session. Always end with Phase 4 and call `mind_remember`.

---

## PAIRS WITH
- `/realthink` — find the real problem before picking a law
- `/think-pipeline` — fill the 7-slot schema when problem is upstream of AI usage
- `/kraken-flow` — full spine when goal needs decide + design + build
