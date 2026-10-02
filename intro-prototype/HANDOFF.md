# Dragon intro: handoff for the next Claude session

Read this first. It's the current state of the Netherwing dragon intro (as of 2026-10-01): what it is, where the code lives, the vocabulary the owner and I use, the owner's rules, and the knobs. `NOTES.md` next to this file has the longer history; where they disagree, **this file wins**.

## 1. What it is

A ~7.5s WebGL cinematic that plays on the portfolio site (rexellkurniawan.com) when the visitor first scrolls. A dragon, behind a flat dark "fabric", punches a claw through a crack, pulls the tear open with both claws, bursts through with its wings, roars, bolts past the camera, and the camera pans back to the opening shot. The site's hero (REXELL KURNIAWAN) then fades back in over the open rift.

## 2. Where things are

All paths are relative to `Netherwing-Website/portfolio/` (the git repo). Work happens on branch **`intro-prototype`**; `main` = live site (pushing `main` deploys via Netlify).

| What | Path |
|---|---|
| **The cinematic (single source of truth)** | `src/intro/netherwingIntro.js`, which exports `mountIntro(container, opts)`, `DURATION`, `SHOTS`, `SLOW`, `toReal`/`toTimeline` |
| Site wrapper | `src/components/IntroCinematic.jsx`: mounts it, fires `dragonReady`, sets `window.startDragonAnimation`, fires `dragonSceneDone` |
| Site wiring | `src/App.jsx`: first scroll/swipe/key starts it; the hero comes back at `toReal(5.3)` (`riftFlashDone`) |
| Review page (HUD, scrub) | `intro-prototype/index.html` + `main.js`, a thin HUD around the same module |
| Assets | `public/intro/netherwing_pollux_flap.glb` (model + custom clips), `public/intro/butterfly*.png` |
| Blender source | `../_blender/netherwing_anim.blend`, `../_blender/build_grip.py` (builds the `Grip` clip) |
| References | `../_references/cinematic/` (see §6) |
| Old layers, now unused | `src/components/DragonScene.jsx`, `RiftCanvas.jsx`, `ClawScene.jsx`, `RiftParticles.jsx`, `VignetteOverlay.jsx` (not deleted yet; ask before deleting) |

**Commit state:** the last commit is `3f4c54d`. Everything since (the site port, colour, smoothness, hero shadow, and so on) is **uncommitted**. Don't commit, merge or push unless the owner asks.

**Viewing:**
- Site: `npm run dev`, then http://localhost:5173/ (wait for loading, then scroll).
- Review page: same server, `/intro-prototype/`. Or run `python3 -m http.server 5199` from `Netherwing-Website/` and open http://127.0.0.1:5199/portfolio/intro-prototype/.
- Review page controls: Play/space, slider, ←/→ step.
- Review page URL flags:
  - `?nohud` hides the HUD.
  - `?nofx` hides the claw effects.
  - `?view=side|top|q34|back|low` is a debug orbit camera, with the rift hidden.
  - `?nolife` turns off the pull's body-life layer (A/B).
  - Tuning knobs: `?vibe=`, `?faceKey=`, `?wingShade=`, `?rim=`, `?bodyTone=`, `?eyeSink=`, `?boltX=`, `?boltY=`, `?helperAt=`.

## 3. How the module works

- **Everything is a pure function of timeline time `t`** (0 → `DURATION` = 5.6) inside `applyTimeline(t)`. Any frame can be scrubbed. Keys are authored in timeline seconds.
- **Playback slowdown:** wall-clock time maps to timeline time through `toTimeline`. From `SLOW_FROM` = 0.9 on, it plays `SLOW`× slower (the owner set **1.4**, so about 7.5s real). The hero hand-off uses `toReal(5.3)`, so it follows automatically.
- **Camera:** `CAM` keys are `[pos xyz, target xyz, fov, headTrack]`, interpolated by `smoothTrack()`, a C1 Hermite spline with no stop at keys. Impact shakes come from `IMPULSES`.
- **Dragon root:** `DRAGON` keys are `[x, y, z, pitch]`, interpolated by `track()` with a per-key ease.
- **Animation clips** (`clipPlan`):
  - `StandBy` (idle) → `Skill03` (claw strike) → `Skill02` (wing burst) → `Skill22` (roar).
  - Custom Blender clips: `Flap` (held for the roar "wing crown"), `Flight` (bolt), and `Grip` (arms forcing the tear, scrubbed by the `GRIP` curve).
- **Procedural layers on top**, in this order (order matters):
  1. Clips.
  2. Rig transform, with body squaring (`wSquare`) and bolt yaw/pitch.
  3. Grip: `applyGrip`, then **`applyLife`** (animator-spec'd breath/chest rise, scapula load, wings cocked back for the burst, neck trailing the chest; single slow eases, all additive, faded out by the Skill02 burst; `restoreLife()` undoes it at the top of every frame because Spine1/Chest aren't keyed by every clip and offsets would accumulate), then `alignHand`, `clampFingers`, `followShoulder`.
  4. **Head aim last**: `aimHead`, spread over Neck1 → Neck3 → Head. It must stay after the grip, because the Grip clip also moves the chest.
- **Rift** = a 120-unit plane at z=0 with a `discard` tear shader (`TEAR_GLSL`: `t_spine`, `t_half`, with grip terms `uGripW/uGripC/uGripY/uGripK`).
  - The **veil** clips any dragon fragment in front of the plane unless it's inside the tear. `uSealed` = only the claw mesh passes during the breach.
  - **Rift-only guard** `frustumOnRift()`: all four frustum corners must land on the plane, otherwise the aim tips back. The camera may never show the plane's edge or anything beside it.
- **Post chain:** Render → half-res Bloom → Afterimage (bolt smear) → **OutputPass → Grade** (the grade runs in display space, after tone mapping). The grade has:
  - the split-tone;
  - energy-keyed saturation (`e`) with base `VIBE`;
  - S-curve, black floor and white-pink cores;
  - chromatic aberration keyed to bright pixels;
  - 24fps grain;
  - vignette and shockwave.

## 4. Shot list (timeline seconds; real ≈ ×1.4 after 0.9)

1. **0–0.9, anticipation.** Push-in on the hairline crack, crack pulses at 0.5 and 0.9, letterbox in. The fabric is flat violet-black (no cloth texture until the tear opens).
2. **0.9–1.3, strike.** Skill03: the claws punch the crack. The body eases into the breach (eIO, never a dead stop).
3. **1.3–2.45, the pull.** Both claws grip the tear's edges and pull it open in **one confident smooth motion** (`GRIP` = single ease 0.1→1.0, 1.3→2.4).
   - The edges are measured from the hands every frame, so the tear only ever widens.
   - Claw FX: soft glow, pixel flecks, pink cracks.
   - Camera: a gentle push-in.
4. **2.36–2.7, burst.** The wings burst (Skill02) and rip the tear wide. The claws let go 2.46–2.72. The body lunges through (2.42→2.68); the camera recoils slightly.
5. **2.9–4.2, roar.** The camera glides to the owner's favourite low 3/4 head angle (peak 3.45, `CAM` keys 3.4/4.2). Wing "crown", shockwave, eyes flare.
6. **4.2–4.95, bolt.** The camera holds; the dragon coils, then bolts head-on toward and just past the camera (`BOLT_DIR`). Speed smear.
7. **4.4–5.3, home.** The camera pans back to the exact opening shot and holds. The tear narrows to a readable rip (5.0–5.4). The hero fades back over it.

## 5. Owner's rules (non-negotiable, learned the hard way)

- **Camera shows only the rift.** It's a 2D screen in a 3D world: never its edge, never anything beside it. One continuous take; no cuts, no jumps.
- **Breach:** only the claw crosses first. The body is square to the rift and in line with the face **from frame 0**; it never turns into it.
- **The pull is confident, not a struggle.** No heave/slip back-and-forth, no tremor, no heave shakes (all removed; they read as choppy when slowed). No camera impact shake at the 1.3 strike either (it read as the neck glitching as the head first appears). Skill03's built-in wing flick (clip 1.30–1.47) is held out (`holdWingFlick`).
- **Alive but in place** during the pull: the body breathes and drives (`applyLife`), but stays in the same spot. Keep amplitudes small (chest ≤4°, wings ≤7°, scapula ≤4°), no sines/noise. Second review applied: shoulders rise and bunch (scapula +3.5° about Z) with the head sunk a bit more (`strain` −0.26), wings lift 7° and barely fold (1.5°), elbows are no longer flexed additively; instead (owner: "body looks detached from the arms"):
  - **Elbow swing:** the arm chain is rotated about the shoulder→wrist axis so the elbows point down/back (`ELBOW_POLE`, `?poleBack=`), giving a visible "W" head-on. The forearm is un-rolled by the same angle so the elbow spur doesn't hang down like a rod (`?unroll=`, `?noswing`).
  - **Body rise with pinned claws:** the body rises `RISE` 0.1 (`?rise=`) between its claws over 1.4–2.3. The wrists are pinned where the grip pose put them, and a two-bone IK (`armIK`) bends the shoulders and elbows to absorb the rise plus all torso motion (`?nopin`). Tear width is unaffected, measured. Burst hand-off spread out: `wSquare` releases over 2.3–2.65, life fades 2.40–2.68, Skill02 time `eOut(seg(2.36, 2.72))` starts with its weight ramp (an eIO there put the clip's wing whip at full weight, 3× the acceleration; measured, rejected).
- **Claws:** keep the game clip's own curled claw (wrist and fingers aren't overridden by Grip), with knuckles along the lip and talons hooked over it. Claw mesh always visible. Joints must never bend or twist unnaturally; elbows are solved with a **signed** angle about the idle hinge.
- **No jaw opening during the grip** (head-on it reads as a second mini mouth).
- **Head never glitches.** Aim it after everything that moves the chest.
- **Keep the roar angle.** Flight must never look like the sitting idle pose.
- **Dragon lighting:** front-lit and readable, **no shadowed/silhouetted dragon**. Only a subtle backlit shade on the wings (`WING_SHADE` 0.3) and a thin fresnel edge rim.
- **Colour:** rift energy and dragon graded **differently**. The rift is electric violet-magenta with white-pink cores; the dragon is cooler lilac/indigo, lit by violet rims.
  - The owner rejected *both* the over-saturated pass (mean saturation ~0.8, hot pink, crushed blacks) *and* the grey under-saturated pass (~0.45). The approved band is a **mean saturation of about 0.60–0.68**.
  - The fabric and black floor match the site hero's violet-black (≈ rgb 9,3,20).
- **Never add:** halo, ring outlines around the claws, lens-bokeh butterflies.
- **Eyes:** subtle (brightness 4.5, about 75% of the original), sunk into the sockets (`EYE_SINK` 0.008), with an always-on faint glow sprite.
- **Site:** the petals and dust (`ButterflyCanvas`) and the hero text drop shadow appear **only after** `dragonSceneDone`. The hero shadow is subtle (the owner halved it once).
- **Process:** don't commit or push without being asked. When asked for reviews, spawn reviewer agents (cinematographer, animator, lighting, colourist) and **give them the guardrails above** so they don't recommend rejected directions.

## 6. Vocabulary (owner ↔ code)

| Owner says | Means / code |
|---|---|
| "phase 1 / opening shot" | CAM key at t=0 (and the identical t=5.3 end key) |
| "phase 2 / opens the rift" | the strike + pull, 0.9–2.45 |
| "fully open rift pose" (owner likes it, ~2.5–2.8) | the Skill02 wing burst |
| "phase 4 / roar angle" | CAM keys 3.4–4.2 |
| "bolt" | the 4.2–4.95 dash past the camera (`BOLT_DIR`, `BOLT_END`) |
| "rift-only" | `frustumOnRift` guard |
| "veil / phasing through" | dragon fragments in front of the plane outside the tear (veil discards them) |
| "claw effect / pixel particles / cracks" | `clawFx` (fabric shader), `auras`, `flecks` |
| "rod through the neck" | the upper-arm skin helper `ElbowUpper_*`; fixed by `followShoulder()` (helper pinned 55% along the upper arm) |
| "choppy" | motion discontinuities (dead stops, instant full speed, short blends); see §8 |
| "too vibrant" / "under-saturated" | see the colour band in §5 |

References in `../_references/cinematic/`:
- `owner-rift-grip-reference.png`: the target grip look.
- `owner-color-vibe-reference-2.png`: the current colour target.
- `owner-color-tone-reference.png`: superseded; the muted pass made from it overshot.
- `owner-dragon-flight-views.png`: flight anatomy.
- HSR / HotD / BG3 stills: cinematic language. Memory note `cinematic-dragon-references.md` says what to take from them.

## 7. Blender workflow (Blender MCP)

- **Launch:** `../_blender/launch-blender-mcp.command`. Never call `read_factory_settings`; it kills the MCP server.
- **Rebuild the grip:** `exec(open('…/_blender/build_grip.py').read())`, with optional globals `UP_Z`, `RENDER`. It renders a five-angle turnaround to `_blender/frames/grip3/`.
- **Export GLB to** `portfolio/public/intro/netherwing_pollux_flap.glb`: glTF, ACTIONS mode, force sampling, Draco on. Then save the `.blend`.
- **Gotchas:**
  - New actions need `id_root = 'OBJECT'`, or the exporter drops them.
  - Skill03 doesn't key Spine1/Chest/Tail, so reset pose bones to rest before evaluating.
  - Elbow bends must be **signed** about the idle hinge.

## 8. Verification habits that worked

- **Render frames** with Playwright (`browser_run_code_unsafe`): open the review page with `?nohud`, set `window.__setT(t)`, take screenshots, then build a contact sheet with `intro-prototype/sheet.py <tag>`. The owner's complaints always reference specific seconds; render those.
- **Measure, don't eyeball.** `window.__probe(t)` returns head screen position, rift-guard hits and `tear` (effective tear width).
  - Smoothness: per-frame bone speeds (e.g. `Wrist_L_0111` world position × 60), looking for spikes and dead stops.
  - Head glitches: per-frame head world-quaternion angle.
  - Colour: PIL mean luminance and HSV saturation, with the letterbox cropped.
- **Smoothness rules** (owner: "choppy"):
  - never an `eIn` into a hold;
  - never an `eOut` starting a clip at full speed;
  - no pose blend shorter than ~0.3s;
  - no `track()` through back-and-forth keys (use `smoothTrack`);
  - overlap consecutive motions.
- **Site end-to-end:** load http://127.0.0.1:5173/, wait for `dragonReady` plus ~9s of loading screen, `mouse.wheel(0,300)`, then capture frames. Check `riftFlashDone` / `dragonSceneDone` timings.

## 9. Open / possible next steps (none requested yet)

- Commit the current work on `intro-prototype`; then, when the owner approves, merge into `main` and push (that deploys live).
- Intro music (`Netherwing-Intro-2.mp3`) isn't re-timed to the ~7.5s cinematic.
- Delete the five old, unused layer components once the owner OKs it.
- The head turns quickly at ~4.13–4.23 (the deliberate turn into the bolt); slow it if the owner calls it a glitch.
- Cyan butterfly accents barely register (additive blending over violet); needs a sprite/blend change, not the grade.
- The bright rift sits behind the hero text after the intro; the subtle drop shadow mitigates it. Alternatives: narrow/dim the tear at the end.
- Pre-existing lint errors in untouched files (`Hero.jsx` setState-in-effect, `TronDecor.jsx`, old `DragonScene.jsx`, `RiftCanvas_Legacy.jsx`); not from this work.
