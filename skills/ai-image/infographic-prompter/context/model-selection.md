# Model Selection Registry

The profile for each supported image model. Phase 2 reads this to fill `## MODEL PROFILE`.
Text fidelity is the ceiling on how much dense on-image text the model renders legibly.

| Model id | Text fidelity | Dialect | Aspect mechanism | Best for |
|---|---|---|---|---|
| gpt-image | high | natural-language scene-as-instruction; quote exact strings | size param: 1024x1024, 1024x1536 (portrait), 1536x1024 (landscape) | legible labeled stats, instruction-following |
| gemini-nano-banana | high | conversational structured description; honors hex + exact text; strong edits | conversational line ("use a tall 2:3 portrait aspect") | data-dense infographics, brand hex, edit iteration |
| ideogram | high | natural language + explicit "typography" and "text reads exactly" cues | aspect param (1:1, 2:3, 3:2, 16:9) | typography-first; fallback when gpt/gemini unavailable |
| recraft | high | design-system language; flat vector; named brand palette | size/aspect param | clean flat-vector brand infographics |
| flux | medium | prose adherence, decent text; keep density moderate | aspect param | moderate-text visuals, prose prompts |
| midjourney | low | terse keyword stacks, not sentences; flags | flag: `--ar W:H` plus `--style raw --v 7` | the visual frame; text added in an editor |

## Picking when model=auto

1. If the data has more than a title's worth of text (the usual infographic case), pick the
   highest-fidelity model available: gpt-image or gemini-nano-banana.
2. If the user named a brand hex and wants exact color, prefer gemini-nano-banana or recraft.
3. If the user wants a purely aesthetic poster with almost no text, midjourney is acceptable.
4. State the pick and the reason in the GROUND block so the user can override.

## Aspect ratio quick map

- Square feed post: gpt-image 1024x1024 | midjourney `--ar 1:1` | gemini "square 1:1".
- Portrait story or carousel: gpt-image 1024x1536 | midjourney `--ar 2:3` | gemini "tall 2:3 portrait".
- Landscape slide or banner: gpt-image 1536x1024 | midjourney `--ar 3:2` or `--ar 16:9` | gemini "wide 16:9".

Never emit an aspect in a syntax the target model does not parse. A flag sent to gpt-image, or a
pixel size sent to midjourney, is dropped and the image returns square.
