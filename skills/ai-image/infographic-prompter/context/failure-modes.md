# Failure Modes (per model) and the CAVEATS line

Phase 4 reads this to write `## CAVEATS`. Name the model's text risk and one post-generation check.

## midjourney

- Risk: garbles or invents multi-line text and numbers. It is a low-fidelity text renderer.
- CAVEATS line: "Midjourney will garble multi-line text. Add the labels in an editor after
  generation. Verify the layout and palette, not the words."
- Verify after generation: the visual frame and spacing are usable as a base.

## gpt-image

- Risk: strong but not perfect on very dense text. Above roughly eight short text blocks it starts
  to drop or merge labels.
- CAVEATS line: "gpt-image renders quoted text well up to about eight blocks. Re-run if any label
  is missing or merged."
- Verify after generation: every quoted string is present and spelled correctly.

## gemini-nano-banana

- Risk: occasional spelling drift on long numbers; fix it by editing rather than re-rolling.
- CAVEATS line: "Gemini renders exact text and hex well. If a long number drifts, ask it to fix
  that one value instead of regenerating."
- Verify after generation: the hex accent matches and the numbers are exact.

## ideogram / recraft / flux

- Risk: ideogram and recraft are high fidelity; flux is medium and degrades past moderate density.
- CAVEATS line: "Keep text density moderate on flux. Ideogram and recraft hold typography well."
- Verify after generation: labels are legible and the aspect is correct.

## Universal checks

- Did any data string get paraphrased instead of quoted? If yes, the model may have invented a
  value. Re-compile with the literal string quoted.
- Did the aspect land? If the image is square when portrait was requested, the aspect was emitted
  in the wrong model's syntax.
