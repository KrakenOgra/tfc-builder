# Eval Design (how to score a compiled prompt)

The golden tasks in evals.yaml score what APPEARS in the output, never "looks good". A compiled
prompt is correct when these observable properties hold.

## What a correct compile contains

1. The four sections in order: `## GROUND`, `## MODEL PROFILE`, `## COMPILED PROMPT`, `## CAVEATS`.
2. Every literal data string the user supplied, quoted verbatim, inside the COMPILED PROMPT (for
   high and medium fidelity models) or in the CAVEATS offload list (for midjourney).
3. The aspect ratio in the target model's own syntax: a size param like `1024x1536` for gpt-image,
   an `--ar` flag for midjourney, a conversational line for gemini.
4. A model-specific text risk named in CAVEATS.

## What signals a failure

- An `--ar` flag in a gpt-image, gemini, ideogram, recraft, or flux prompt: wrong mechanism.
- A `1024x` size param in a midjourney prompt: wrong mechanism.
- A paraphrased data point instead of a quoted literal: invites the model to invent numbers.
- A compiled prompt emitted when no data was supplied: should have stopped with NEEDS_CONTEXT.
- A midjourney prompt that quotes many data strings as render-exact: ignores the text ceiling.

## Golden task coverage

- gpt-image-quote-honor: high-fidelity quote path + size param + no flag.
- midjourney-minimize-offload: low-fidelity frame path + `--ar --style raw` + editor offload note.
- gemini-exact-strings-hex: exact strings + brand hex + conversational aspect.
- missing-data-ground-stop: the GROUND STOP fires NEEDS_CONTEXT instead of inventing data.

A passing report over these at pass_threshold 0.8 earns the eval_proven lane. Lanes are recomputed
from disk by tfc_lane, never asserted in spec.yaml.
