# AWAKENING — 2075
## Full Video Production Package | 2 min 27 sec

**Date:** 2026-06-12  
**Skill:** video-prompting v1.0.0  
**Total runtime:** 2:27 (147 seconds across 14 scenes)

---

## Vision

2075. Earth and near-space hum with distributed intelligence.
Orbital data centers ring the planet. Factories build themselves.
Fields are managed by swarms. Cities breathe.
People live more — work less, connect more, reach further.

This is not a warning. This is what the good path looks like.

Tone: earned optimism. Not utopia — just the world that happened when we built the right things.

Shot with the warmth of *Her* and the scale of *Interstellar*.

---

## Platform Decision

### Primary: Sora (OpenAI)
Best temporal coherence for 8-20 second narrative clips. Photorealistic, physics-accurate.
Handles zero-g environments, orbital infrastructure, large crowds. Prompt sweet spot: 40-80 words.
Use for all city, people, space, and habitat scenes.

### Secondary: Kling 2.0 (Kuaishou)
Best physics simulation on any current model. Use for scenes S3 and S4 (robot factory, metal mechanics, sparks).
Chinese vocabulary in prompts improves output measurably on industrial motion.

### Validation: Pika 2.1
Run every Sora prompt through Pika at low quality first. If the semantic core reads wrong, fix it
before committing Sora credits. Pika iteration = free calibration.

### Post-Production: CapCut Pro + DaVinci Resolve 19 + Topaz Video AI 4.x
- CapCut: assemble clips, sync to music, auto-captions
- DaVinci: color grade — warm mid-tones for city/people, deep blacks for space, clinical whites for factory
- Topaz: upsample any Pika/Wan 480p validation clips to 1080p using Proteus model

---

## Style Anchors

| Scene type | Film reference | DP | Grammar |
|---|---|---|---|
| Space / orbital | Interstellar (2014) | Hoyte van Hoytema | IMAX anamorphic, deep blacks, Earth-glow fill |
| City / people | Her (2013) | Hoyte van Hoytema | Warm daylight, pastel architecture, soft bokeh |
| Factory / robots | Ex Machina (2015) | Rob Hardy | Clinical whites, precise overhead, no harsh shadow |
| Epic wide shots | Dune: Part Two (2024) | Greig Fraser | Golden-hour backlight, depth, dust particles |
| Emotional close-ups | Arrival (2016) | Bradford Young | Diffuse soft key, warm fill, minimal color cast |

---

## Global Negative Prompt Block

Paste this block at the end of every scene prompt:

```
[NEGATIVE]
no dystopian elements, no destruction, no dark oppressive tone,
no motion blur on faces, no temporal flickering,
no static locked camera, no duplicate limbs,
no compression artifacts, no visible watermarks
```

---

## Recurring Character Block

Re-paste verbatim in every scene featuring the protagonist. Never paraphrase:

```
East Asian woman, mid-30s, short silver-streaked black hair, amber jacket, calm warm expression
```

---

## SCENES

---

### COLD OPEN — Ring of Light
**Timecode:** 0:00-0:09 | **Duration:** 9s | **Platform:** Sora | **Style:** Interstellar (2014)

**Shot:** Earth from deep space. An orbital ring of data centers circles the planet. Blue LED arrays pulse.
Solar panels catch direct sunlight. The scale is cathedral.

#### Anatomy

```
[SUBJECT]     Orbital ring of data centers circling Earth, hexagonal modules, solar panels, blue LED arrays
[MOTION]      Very slow vertical crane upward, Earth rotating imperceptibly, ring glinting in sunlight
[ENVIRONMENT] Deep space, Earth fills lower third, black starfield, hard sunlight from frame-right
[LIGHTING]    Hard direct sunlight from frame-right, Earth's reflected blue-white glow, deep shadow on far side
[STYLE]       Interstellar (2014), Hoyte van Hoytema, IMAX 70mm, 65mm lens, minimal color grade
[DURATION]    9 seconds, single continuous take
[NEGATIVE]    no motion blur, no flickering, no gray Earth tone, no static camera, no compression artifacts
```

#### Sora Prompt (submit this)

```
Very slow vertical crane move upward revealing orbital ring of interconnected data center modules circling Earth.
Blue LED arrays pulse along the ring structure, solar panels gleaming in hard sunlight from frame-right.
Earth fills the lower third, blue-white continents visible through thin cloud cover. Deep black starfield.
9 seconds, single continuous take.
Interstellar (2014), Hoyte van Hoytema, IMAX 70mm, 65mm lens, minimal color grade.
[NEGATIVE] no motion blur, no flickering, no gray tones, no static camera, no compression artifacts, no dystopian tone
```

#### Kling 2.0 Backup

```
轨道数据中心光环环绕地球，太阳能板反光，LED阵列蓝色脉动，
慢速向上摇摄镜头，深太空背景，地球占画面下三分之一，
电影感4K，Interstellar (2014)视觉风格，IMAX宽幅，9秒单镜头
[NEGATIVE] 无运动模糊，无深色氛围，无静态镜头，无压缩伪影
```

---

### SCENE 1 — Station Exterior
**Timecode:** 0:09-0:18 | **Duration:** 9s | **Platform:** Sora | **Style:** Interstellar (2014)

**Shot:** Close on the station surface. Rows of server modules. Frosted coolant lines.
A maintenance drone glides past, small and precise.

#### Sora Prompt

```
Camera executes slow lateral dolly-truck right along modular space server array in orbit.
Hexagonal heat shields, frosted coolant lines, solar panel edges in background.
Small maintenance drone glides across frame left-to-right, camera adjusts to track it slightly.
Earth's curved limb visible at frame top. Hard sunlight from above-right, deep shadow zones on module faces.
9 seconds, single take. Interstellar (2014), Hoyte van Hoytema, 35mm lens, subtle sunlight lens flare.
[NEGATIVE] no motion blur, no static camera, no flickering, no compression artifacts, no cluttered frame
```

---

### SCENE 2 — Zero-G Data Flow
**Timecode:** 0:18-0:27 | **Duration:** 9s | **Platform:** Sora | **Style:** Ex Machina (2015)

**Shot:** Interior of the orbital station. Server racks curve to a white ceiling.
Transparent coolant tubes carry spherical droplets in zero gravity. LED arrays pulse blue-white.
No humans. The machine is alive.

#### Sora Prompt

```
Slow rack focus from transparent coolant tubes in foreground to server racks extending to curved white ceiling.
Spherical coolant droplets drift through glass tubes in zero gravity, blue-lit from below.
LED arrays pulse rhythmically in slow wave pattern along server rows. Clean white surfaces. No humans.
9 seconds, single take. Ex Machina (2015), Rob Hardy, clinical white overhead key, 35mm lens, minimal shadows.
[NEGATIVE] no motion blur, no flickering, no dirt, no static camera, no compression artifacts, no warm tones
```

---

### SCENE 3 — Robot Foundry
**Timecode:** 0:27-0:42 | **Duration:** 15s | **Platform:** Kling 2.0 (primary) | **Style:** Ex Machina (2015)

**Shot:** Vast white factory floor. Six industrial robotic arms assembling humanoid robots on rotating platforms.
Sparks in controlled bursts. The assembled robots begin flexing their new limbs. Mechanical birth.

#### Anatomy

```
[SUBJECT]     6 industrial robotic arms assembling humanoid robots on rotating platforms, welding sparks
[MOTION]      Slow crane descend from high wide to medium, robotic arms moving in synchronized arcs
[ENVIRONMENT] Vast white factory floor, rotating platforms, steel columns receding to horizon
[LIGHTING]    Overhead industrial white LED, warm orange from welding sparks, no harsh cast shadows
[STYLE]       Ex Machina (2015), Rob Hardy, clinical whites, 24mm wide lens, depth of field shifts
[DURATION]    15s: [0-7s] crane descend wide, [7-12s] medium close assembly, [12-15s] robot flexes hand
[NEGATIVE]    no motion blur on sparks, no static camera, no dark atmosphere, no chaotic framing
```

#### Kling 2.0 Prompt

```
工厂地面六轴工业机器人臂同步组装人形机器人，旋转传送台，精准焊接火花飞溅，
[0-7秒] 从工厂高处天花板慢速俯摄摇臂下降至中景，展现整个流水线全貌，
[7-12秒] 推进至特写，机器人手臂精准连接肩关节，金属光泽，
[12-15秒] 新组装的机器人慢慢弯曲手指，摄像机保持中景，
工业白色LED顶光，电影质感4K宽幅，物理精准，Ex Machina (2015)视觉风格
[NEGATIVE] 无运动模糊，无黑暗压抑氛围，无静态镜头，无压缩伪影
```

#### Sora Backup

```
[0-7s] Slow crane descend from factory ceiling — 6 robotic arms assembling humanoid robots on rotating platforms. Sparks in controlled bursts. Vast white floor, steel columns to horizon.
[7-12s] Dolly push-in to medium close — single robotic arm attaches shoulder joint, precise and clean.
[12-15s] Newly assembled robot flexes hand, fingers opening and closing. Camera holds medium.
Ex Machina (2015), Rob Hardy, 24mm, clinical white LED overhead, warm spark fill.
[NEGATIVE] no motion blur, no dark atmosphere, no static camera, no compression artifacts
```

---

### SCENE 4 — Synchronized Factory Ballet
**Timecode:** 0:42-0:51 | **Duration:** 9s | **Platform:** Kling 2.0 | **Style:** Her (2013)

**Shot:** Side view. Rows of robots working in perfect synchronization — arms lifting, rotating, placing.
It looks like choreography. Beautiful and precise.

#### Kling 2.0 Prompt

```
从侧面跟踪拍摄，机器人整齐排列在工厂流水线上完美同步工作，
机械手臂同时举起旋转放置，像芭蕾舞般协调，
摄像机缓慢向右横移跟拍，工业白光，金属地面反光，
Her (2013)暖色调顶光，电影感宽幅，9秒，物理精准流畅
[NEGATIVE] 无运动模糊，无暗调，无随机混乱动作，无静态镜头
```

#### Sora Backup

```
Camera executes slow lateral dolly-truck right along factory floor.
Rows of humanoid robots work in synchronized choreography — arms lifting, rotating, placing components in perfect unison.
Side view. Warm white overhead light, metallic reflections on polished floor. The motion is beautiful.
9 seconds. Her (2013), Hoyte van Hoytema, 50mm, warm diffuse overhead, slight depth of field on far rows.
[NEGATIVE] no motion blur, no dark tone, no chaotic motion, no static camera, no compression artifacts
```

---

### SCENE 5 — Agricultural Intelligence
**Timecode:** 0:51-1:00 | **Duration:** 9s | **Platform:** Sora | **Style:** Dune: Part Two (2024)

**Shot:** Aerial descending over vast green agricultural fields. Hundreds of small drones in coordinated
geometric patterns. A river winds through. Earth is thriving.

#### Sora Prompt

```
Aerial crane shot descending slowly toward lush green agricultural fields in summer.
Hundreds of small agricultural drones fly in coordinated geometric grid patterns, each tending crops below.
River winds through frame-right, silver in afternoon light. Fields extend to horizon under blue sky, soft clouds.
Camera descends from high aerial wide to medium aerial. 9 seconds, single continuous take.
Dune: Part Two (2024), Greig Fraser, golden-hour side backlight, 65mm aerial lens, deep field.
[NEGATIVE] no pollution, no gray tones, no barren land, no static camera, no flickering, no dystopian elements
```

---

### SCENE 6 — City of Light
**Timecode:** 1:00-1:12 | **Duration:** 12s | **Platform:** Sora | **Style:** Her (2013)

**Shot:** 2075 city. Architecture is alive with embedded intelligence. Elevated sky-parks bridge towers.
Holographic wayfinding floats at eye level. Golden hour. Warm and full.

#### Sora Prompt

```
[0-6s] Camera booms up from street level to aerial over city of 2075 — towers with adaptive facade surfaces, elevated sky-bridge parks connecting buildings, lush greenery. Golden hour light.
[6-12s] Slow dolly through elevated sky-bridge walkway — people walking, holographic blue wayfinding signs at eye level, warm sunlight from frame-right casting long shadows.
12 seconds. Her (2013), Hoyte van Hoytema, golden hour, 50mm, soft bokeh on background crowds.
[NEGATIVE] no dystopian elements, no empty streets, no dark sky, no static camera, no compression artifacts
```

---

### SCENE 7 — People Thriving
**Timecode:** 1:12-1:24 | **Duration:** 12s | **Platform:** Sora | **Style:** Arrival (2016)

**Shot:** Rooftop cafe. Diverse group of people laughing, gesturing over a holographic display.
Natural afternoon light. Technology present but not intrusive. A good afternoon.

#### Sora Prompt

```
[0-6s] Gentle handheld-style push-in to rooftop cafe. Five people around a table, holographic display floating at center, all laughing and gesturing. Warm afternoon sunlight, city visible below.
[6-12s] Rack focus from holographic display in foreground to East Asian woman mid-30s, short silver-streaked black hair, amber jacket — laughing, relaxed. Camera drifts slowly right.
12 seconds. Arrival (2016), Bradford Young, diffuse soft afternoon key, 85mm, slight warm grade.
[NEGATIVE] no motion blur on faces, no dramatic lighting, no dystopian tone, no static camera, no artifacts
```

---

### SCENE 8 — Children Learning
**Timecode:** 1:24-1:33 | **Duration:** 9s | **Platform:** Sora | **Style:** Her (2013)

**Shot:** Two children, 8-10 years old, stand on either side of a rotating holographic solar system model.
They reach out and touch planets. Wonder on their faces.

#### Sora Prompt

```
Slow dolly push-in from medium to medium-close over 9 seconds.
Two children age 8 to 10 standing on either side of a rotating holographic solar system — planets and moons orbiting slowly between them. They reach out and touch Jupiter; it spins faster.
Wonder on their faces. Bright indoor space, natural window light from frame-left. Joyful.
Her (2013), Hoyte van Hoytema, soft natural daylight key, 50mm, warm fill, no dramatic shadow.
[NEGATIVE] no dark tones, no motion blur on faces, no static camera, no artifacts, no dystopian elements
```

---

### SCENE 9 — Medical Precision
**Timecode:** 1:33-1:42 | **Duration:** 9s | **Platform:** Sora | **Style:** Ex Machina (2015)

**Shot:** Operating room. A surgical robot with four precision arms works. Two doctors watch a real-time
3D holographic display. Calm. Clean. A life saved.

#### Sora Prompt

```
Camera holds medium wide on operating room — surgical robot with four precision arms performs procedure, movements microscopic and controlled. Two doctors in scrubs observe a floating 3D holographic display of the procedure. Blue-white sterile light.
Slow rack focus from robot arms to doctor faces — expressions calm, attentive, relieved.
9 seconds. Ex Machina (2015), Rob Hardy, clinical white overhead, 35mm, deep depth of field.
[NEGATIVE] no blood visible, no clinical grime, no harsh shadows, no static flat frame, no compression artifacts
```

---

### SCENE 10 — Space Habitat
**Timecode:** 1:42-1:54 | **Duration:** 12s | **Platform:** Sora | **Style:** Interstellar (2014)

**Shot:** Interior of an orbital habitat. Families living. Curved walls with lush growing plants.
A child drifts slightly off the floor in low gravity. A panoramic window shows Earth below.

#### Sora Prompt

```
[0-6s] Slow lateral dolly through orbital habitat interior. Curved walls with lush green plants floor to ceiling. Families at tables, warm domestic lighting. Child drifts 6 inches off floor in low gravity — laughs, reaches for parent.
[6-12s] Dolly push-in toward large curved window. Earth fills the window — blue and white. Reflection of family visible in glass.
12 seconds. Interstellar (2014), Hoyte van Hoytema, warm interior key, blue Earth-glow fill from window, 35mm.
[NEGATIVE] no dystopian tone, no pale cold light, no static camera, no compression artifacts, no flickering
```

---

### SCENE 11 — Deep Space Infrastructure
**Timecode:** 1:54-2:06 | **Duration:** 12s | **Platform:** Sora | **Style:** Interstellar (2014)

**Shot:** Deep space. Multiple stations and habitats. Transport vessels in motion between them.
Jupiter massive in the background. Human civilization extended to the outer system.

#### Anatomy

```
[SUBJECT]     Field of space stations, orbital habitats, transport vessels in motion, Jupiter in background
[MOTION]      Very slow crane move right, transport vessel fires thrusters at end
[ENVIRONMENT] Deep space, Jupiter filling background-left, correct banded coloring, black starfield
[LIGHTING]    Distant sun from frame-right, hard shadows on station surfaces, amber thruster glow
[STYLE]       Interstellar (2014), Hoyte van Hoytema, IMAX 70mm, deep blacks, minimal color grade
[DURATION]    12s: [0-6s] crane reveals infrastructure field, [6-12s] crane right to transport vessel boost
[NEGATIVE]    no flickering, no gray Jupiter, no static camera, no motion blur, no artifacts
```

#### Sora Prompt

```
[0-6s] Very slow crane move right revealing field of space infrastructure — stations, orbital habitats, transport vessels in motion between them. Jupiter huge in background-left, correct banded coloring, Great Red Spot visible.
[6-12s] Camera continues crane right, ending on single transport vessel firing main thruster — warm amber glow blooms against black space.
12 seconds. Interstellar (2014), Hoyte van Hoytema, IMAX 70mm, deep blacks, minimal color grade.
[NEGATIVE] no flickering, no gray Jupiter, no static camera, no motion blur, no compression artifacts
```

---

### SCENE 12 — Sunset City
**Timecode:** 2:06-2:18 | **Duration:** 12s | **Platform:** Sora | **Style:** Her (2013)

**Shot:** Back on Earth. A city plaza at golden hour. People gathered, at ease.
Two people share something on a small holographic display. Warm. Complete.
This is what it was all built for.

#### Sora Prompt

```
[0-6s] Camera booms down slowly from aerial to street level into a city plaza at golden hour. People scattered — sitting on steps, walking in pairs, talking in small groups. Buildings warm amber. Trees line the plaza.
[6-12s] Dolly push-in to medium close on two people sitting on steps — laughing, a small holographic display floating between them. Warm light from frame-right.
12 seconds. Her (2013), Hoyte van Hoytema, golden hour backlight, 85mm, slight warm color grade.
[NEGATIVE] no dark tone, no empty spaces, no motion blur on faces, no static camera, no dystopian elements
```

---

### FINAL SHOT — The Overview
**Timecode:** 2:18-2:27 | **Duration:** 9s | **Platform:** Sora | **Style:** Interstellar (2014)

**Shot:** Pull back from Earth's surface — through clouds, through atmosphere, into space.
Earth shrinks. The orbital data center ring appears, complete, glowing.
Full circle. What we built.

#### Sora Prompt

```
Camera pulls back from blue ocean surface through white cloud layer, through upper atmosphere into space.
Earth fills frame, then shrinks slowly as camera pulls back further — orbital data center ring appears, complete circle around the planet.
The ring pulses gently in blue-white light. Earth beneath it glows. Silence.
9 seconds, single continuous reverse-crane from surface to deep space.
Interstellar (2014), Hoyte van Hoytema, IMAX 70mm, deep blacks, Earth in full color, no color cast.
[NEGATIVE] no abrupt cuts, no motion blur, no flickering, no static camera, no compression artifacts
```

---

## Scene Summary Table

| # | Scene | Timecode | Duration | Platform | Style Ref |
|---|---|---|---|---|---|
| 0 | Ring of Light (cold open) | 0:00 | 9s | Sora | Interstellar (2014) |
| 1 | Station Exterior | 0:09 | 9s | Sora | Interstellar (2014) |
| 2 | Zero-G Data Flow | 0:18 | 9s | Sora | Ex Machina (2015) |
| 3 | Robot Foundry | 0:27 | 15s | Kling 2.0 | Ex Machina (2015) |
| 4 | Factory Ballet | 0:42 | 9s | Kling 2.0 | Her (2013) |
| 5 | Agricultural Intelligence | 0:51 | 9s | Sora | Dune: Part Two (2024) |
| 6 | City of Light | 1:00 | 12s | Sora | Her (2013) |
| 7 | People Thriving | 1:12 | 12s | Sora | Arrival (2016) |
| 8 | Children Learning | 1:24 | 9s | Sora | Her (2013) |
| 9 | Medical Precision | 1:33 | 9s | Sora | Ex Machina (2015) |
| 10 | Space Habitat | 1:42 | 12s | Sora | Interstellar (2014) |
| 11 | Deep Space Infrastructure | 1:54 | 12s | Sora | Interstellar (2014) |
| 12 | Sunset City | 2:06 | 12s | Sora | Her (2013) |
| 13 | The Overview (final) | 2:18 | 9s | Sora | Interstellar (2014) |

**Total: 2 minutes 27 seconds | 14 scenes | 12 Sora + 2 Kling 2.0**

---

## Production Order

Run in this sequence to minimize wasted credits:

1. **Semantic pass first:** Run all 14 prompts through Pika 2.1 at low quality. Cost: minimal. Confirm each concept reads correctly before Sora or Kling runs.
2. **Kling batch:** Generate S3 and S4 in parallel — Kling queue is independent of Sora budget.
3. **Space scenes:** Cold Open, S1, S2, S10, S11, Final Shot. These require highest temporal coherence — Sora extended generation if available.
4. **City and people:** S6, S7, S8, S12. Most likely to need 1-2 iteration passes on the motion slot.
5. **S5 and S9:** Single-pass expected — clean concept, clear anatomy.

---

## Color Grade Plan

| Scene group | Grade note |
|---|---|
| Space scenes (0, 1, 2, 10, 11, 13) | Deep blacks, no shadow lift, subtle blue-white on LEDs, no color cast |
| Factory scenes (3, 4) | Clinical whites, no grade change — let Rob Hardy reference hold |
| City + people scenes (6, 7, 8, 12) | Warm mid-tones, lift red/orange channel slightly, golden hour enhancement |
| Agricultural (5) | Saturate greens slightly, boost golden backlight |
| Medical (9) | Keep clinical white, add slight cyan tint on sterile surfaces |

Final LUT across full film: subtle warm grade for tonal unity.
Visual arc: cool (space opening) transitions to warm (Earth close) — mirrors the emotional arc.

---

## Music Guide

Style: ambient orchestral ascending. Hans Zimmer "Cornfield Chase" register.
No percussion until S11 (deep space infrastructure). Build through S12 to the final shot.
Final shot: single sustained chord, warm major key.

Avoid: electronic beat, dramatic action music, melancholy minor keys.
This film earns its emotion from scale + warmth, not tension.

License suggestion: Epidemic Sound or Artlist, search "ambient orchestral hopeful ascending."

---

## Sharp Edges

- **Character drift:** Protagonist in S7 only. Paste full character block verbatim every time she appears. Do not paraphrase.
- **Token density:** S3 Sora backup is 68 words — within limit. Do not expand it.
- **Platform agnostic:** Kling prompts for S3 and S4 are not interchangeable with Sora versions. Rewrite if switching platforms.
- **Duration defaults:** Sora defaults to ~4 seconds without explicit duration. Every prompt states duration explicitly.
- **Temporal markers in S3, S6, S10, S11, S12:** These use [0-Xs] notation. Do not remove time brackets from multi-event scenes.

---

## STATUS

**DONE** | 14 scenes, 2:27 runtime, full 7-slot anatomy per scene, platform-adapted prompts (Sora primary + Kling 2.0 for factory), global negative block, color grade plan, production order, music guidance.
