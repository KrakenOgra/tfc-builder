# Prompt Patterns (per-model emit templates)

Phase 3 fills one of these. Quote every literal data string. Replace only the angle-bracket slots
with the user's content, then remove the brackets. The emitted prompt is paste-ready.

## gpt-image (ChatGPT image) — quote-honor, size param

```
A clean modern infographic titled "<TITLE>". <LAYOUT: e.g. three evenly spaced stat blocks in a
vertical column>. The blocks read, exactly: "<DATA STRING 1>", "<DATA STRING 2>", "<DATA STRING 3>".
Flat vector style, generous spacing, <PALETTE or brand hex>. Render all text exactly as written,
clean sans-serif, high legibility. Portrait composition, 1024x1536.
```

## gemini-nano-banana (Nano Banana 2 / Gemini 3 image) — conversational, hex-exact

```
Create a clean infographic titled "<TITLE>". Show <N> data points, each rendered exactly as
written: "<DATA STRING 1>", "<DATA STRING 2>", "<DATA STRING 3>". Use the brand color <HEX> for
accents and a neutral background. Strong typography, each label crisp and legible. Use a tall 2:3
portrait aspect ratio. Keep the numbers exactly as given.
```

## midjourney (v7) — minimize-and-offload, keyword stack + flags

```
clean flat-design infographic layout, <N> empty labeled slots arranged <vertically/grid>,
<palette> palette, generous negative space, title space at top, modern vector style --ar 2:3
--style raw --v 7
```

On-image text is the title at most. Put the actual data strings in CAVEATS as offload guidance:
the user adds "<DATA STRING 1>", "<DATA STRING 2>", ... in an editor after generation.

## ideogram — typography-first

```
Infographic poster titled "<TITLE>", typography-led. The text reads exactly: "<DATA STRING 1>",
"<DATA STRING 2>", "<DATA STRING 3>". Clean grid, <palette>, crisp legible type. Aspect 2:3.
```

## recraft — flat-vector brand

```
Flat vector infographic, design-system style, titled "<TITLE>". Sections: "<DATA STRING 1>",
"<DATA STRING 2>", "<DATA STRING 3>". Brand palette <HEX>, consistent icon style, even spacing.
Portrait 2:3.
```

## flux — moderate density prose

```
A flat infographic titled "<TITLE>" showing "<DATA STRING 1>", "<DATA STRING 2>", "<DATA STRING 3>"
in evenly spaced blocks. Clean type, <palette>, legible. Portrait 2:3 aspect.
```
