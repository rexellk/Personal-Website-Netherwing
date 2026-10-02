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
| Blender source | `../_blender/netherwing_anim.blend`; `../_blender/build_riftopen.py` (builds the `RiftOpen` clip, on `riftopen_lib.py`); `../_blender/compress_glb.sh` (export → site GLB) |
| References | `../_references/cinematic/` (see §6) |
| Old layers, now unused | `src/components/DragonScene.jsx`, `RiftCanvas.jsx`, `ClawScene.jsx`, `RiftParticles.jsx`, `VignetteOverlay.jsx` (not deleted yet; ask before deleting) |

**Commit state:** the RiftOpen rebuild of phase 2 and the smaller eyes are committed on `intro-prototype` (2026-10-02), not merged or pushed. The Blender scripts in `../_blender/` are outside the repo. Don't commit, merge or push unless the owner asks.

**Viewing:**
- Site: `npm run dev`, then http://localhost:5173/ (wait for loading, then scroll).
- Review page: same server, `/intro-prototype/`. Or run `python3 -m http.server 5199` from `Netherwing-Website/` and open http://127.0.0.1:5199/portfolio/intro-prototype/.
- Review page controls: Play/space, slider, ←/→ step.
- Review page URL flags:
  - `?nohud` hides the HUD.
  - `?nofx` hides the claw effects.
  - `?view=side|top|q34|back|low` is a debug orbit camera, with the rift hidden.
  - Tuning knobs: `?vibe=`, `?faceKey=`, `?wingShade=`, `?rim=`, `?bodyTone=`, `?eyeSink=`, `?eyeR=`, `?eyeDepth=`, `?eyeGlow=`, `?boltX=`, `?boltY=`, `?helperAt=`.

## 3. How the module works

- **Everything is a pure function of timeline time `t`** (0 → `DURATION` = 5.6) inside `applyTimeline(t)`. Any frame can be scrubbed. Keys are authored in timeline seconds.
- **Playback slowdown:** wall-clock time maps to timeline time through `toTimeline`. From `SLOW_FROM` = 0.9 on, it plays `SLOW`× slower (the owner set **1.4**, so about 7.5s real). The hero hand-off uses `toReal(5.3)`, so it follows automatically.
- **Camera:** `CAM` keys are `[pos xyz, target xyz, fov, headTrack]`, interpolated by `smoothTrack()`, a C1 Hermite spline with no stop at keys. Impact shakes come from `IMPULSES`.
- **Dragon root:** `DRAGON` keys are `[x, y, z, pitch]`, interpolated by `track()` with a per-key ease.
- **Animation clips** (`clipPlan`):
  - `StandBy` (idle) → **`RiftOpen`** (0.7 → 2.825: the whole rift opening, one authored clip, played in real timeline time) → `Skill02` (from its frame 14, the open pose) → `Skill22` (roar).
  - Custom Blender clips: **`RiftOpen`** (see §4a), `Flap` (held for the roar "wing crown"), `Flight` (bolt).
  - `Skill03` is no longer used by the intro (DragonFly_2 still uses it). `Grip`, `Skill01`, `Skill21` are dropped from the shipped GLB by `compress_glb.sh`.
- **Procedural layers on top** (much thinner since RiftOpen):
  1. Clips.
  2. Rig transform (`DRAGON` track) and bolt yaw/pitch. No body squaring: RiftOpen is authored square to the rift.
  3. `followShoulder` (upper-arm skin helper pinned 55% up the upper arm, from 0.75s on).
  4. **Head aim last**: `aimHead`, spread over Neck1 → Neck3 → Head. Off while RiftOpen plays (the clip stabilises its own head on the lens); on for the idle and from 2.42 for Skill02/roar.
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

## 4a. RiftOpen (the rift opening, built in Blender)

`_blender/build_riftopen.py` builds it from scratch on top of the game's own poses (so every pose is anatomically valid) and bakes it to one action:
- **Key poses** (`KEYS`, timeline s): 0.70 idle → 1.00 coil (reared back, right claw cocked by the cheek, wings folded) → 1.27 strike (lunges in behind the right claw, chest twisted into it) → 1.40 both claws hooked → 1.62 load (sinks back, pelvis tucks, thighs up, shoulders hunch, head low) → 1.745 breakdown (60% of the drive) → 2.00 drive (rises and pushes toward the fabric, blades protract) → 2.30 peak (chest proud, wings cocked) → 2.40 gather (dip, wings at the top of the upstroke) → 2.54 burst (end of the downstroke, turning 15° into Skill02's heading) → 2.825 = Skill02 frame 14 exactly.
- Bodies come from Skill02 frame 8 squared to the rift (`square`), placed by shoulder-mid (`at`), then edited with world-space ops (`pitch/yaw/roll`, `pelvis`, `hips`, `knees`, `adduct`, `scap`, `retract`, `tail`, `tailseg`). Wings come from library frames mirrored side to side (`wing_from`, `mirror_wing`).
- **Overlap:** per-bone key offsets (`offset()`: chest +0.7f, neck +1.2f, wings +2.5f, tail +1.5…6f, feathers +3f), capped so they never crowd the next key; the wings have no lag on the gather/burst keys (they drive the burst).
- **Arms are solved every frame** (`solve_frame`): two-bone IK that bends the elbow only about its anatomical hinge (local Z), elbows mostly out (`POLE`), reach capped at 95%. Targets (`arm_plan`): wind-up → strike through the crack (right 1.27, left 1.36) → hooked on the tear edges riding outward (one ease, 1.48→2.36) → release 2.38: carried out/back with the shoulders, elbows folding to ~105°, then into Skill02's arms by 2.62. Knuckles along the edge and talons over the lip (`align_hand`, `clamp_fingers`, ports of the old site code).
- Also per frame: head stabilised on the lens (`aim_head`), and the model's left elbow blade swung 50° so it doesn't hang below the arm like a rod.
- The site's `DRAGON` keys must match `RIG` in the script (the claws are solved against them): rig x 0.12, z −1.3 from 1.3 to 2.40, then the smootherstep lunge through to 2.68.
- **Rebuild:** in Blender (MCP) `exec(open('…/_blender/build_riftopen.py').read()); build(); export('<scratch>/ro_raw.glb')`, then `../_blender/compress_glb.sh` (drops unused clips, WebP q90 + Draco → `public/intro/netherwing_pollux_flap.glb`, ~3.6 MB). Previews: `render_seq(tag, times, ("cam", "side"))` renders from the site camera (`RO_Cam`, from the copied `CAM` keys) or debug cams into `_blender/frames/<tag>`.

## 4. Shot list (timeline seconds; real ≈ ×1.4 after 0.9)

1. **0–0.9, anticipation.** Push-in on the hairline crack, crack pulses at 0.5 and 0.9, letterbox in. The fabric is flat violet-black (no cloth texture until the tear opens).
2. **0.7–1.3, coil and strike** (RiftOpen). The right claw punches through the crack at 1.27, the left hooks at 1.36. The `DRAGON` track closes on the fabric (−2.0 → −1.3, 1.05–1.3).
3. **1.3–2.4, the pull** (RiftOpen). Both claws ride the tear's edges outward in **one confident ease** while the body loads, then drives up and forward into the gap.
   - The edges are measured from the hands every frame, so the tear only ever widens.
   - Claw FX: soft glow, pixel flecks, pink cracks (`kGrip`, 1.2–1.45 in, 2.38–2.5 out).
   - Camera: a gentle push-in.
4. **2.38–2.7, burst** (RiftOpen → Skill02 from 2.62). The claws let go, the wings' downstroke launches it up; the body lunges through (2.40→2.68, smootherstep); the camera recoils slightly.
5. **2.9–4.2, roar.** The camera glides to the owner's favourite low 3/4 head angle (peak 3.45, `CAM` keys 3.4/4.2). Wing "crown", shockwave, eyes flare.
6. **4.2–4.95, bolt.** The camera holds; the dragon coils, then bolts head-on toward and just past the camera (`BOLT_DIR`). Speed smear.
7. **4.4–5.3, home.** The camera pans back to the exact opening shot and holds. The tear narrows to a readable rip (5.0–5.4). The hero fades back over it.

## 5. Owner's rules (non-negotiable, learned the hard way)

- **Camera shows only the rift.** It's a 2D screen in a 3D world: never its edge, never anything beside it. One continuous take; no cuts, no jumps.
- **Breach:** only the claw crosses first. The body is square to the rift and in line with the face **from frame 0**; it never turns into it.
- **The pull is confident, not a struggle.** No heave/slip back-and-forth, no tremor, no heave shakes (all removed; they read as choppy when slowed). No camera impact shake at the 1.3 strike either (it read as the neck glitching as the head first appears).
- **Alive but in place** during the pull: the whole body works (pelvis, legs, tail, chest, wings) and stays connected to the claws, without over-animating or misaligned joints. No sines/noise; one beat per key, no reversals. History: the owner rejected a frozen body ("body frozen while the arms spread", "body looks detached from the arms") and the old procedural fix layers; on 2026-10-01 they asked to start from scratch with a genuinely animated clip, which is RiftOpen (§4a).
- **The model's left elbow blade** sticks out of the elbow point (the right one lies along the upper arm). With the elbows down it hangs like a rod (owner rejected that); RiftOpen keeps the elbows mostly out and swings the blade 50°.
- **Claws:** keep the game clip's own curled claw (wrist and fingers aren't overridden by Grip), with knuckles along the lip and talons hooked over it. Claw mesh always visible. Joints must never bend or twist unnaturally; elbows are solved with a **signed** angle about the idle hinge.
- **No jaw opening during the grip** (head-on it reads as a second mini mouth).
- **Head never glitches.** Aim it after everything that moves the chest.
- **Keep the roar angle.** Flight must never look like the sitting idle pose.
- **Dragon lighting:** front-lit and readable, **no shadowed/silhouetted dragon**. Only a subtle backlit shade on the wings (`WING_SHADE` 0.3) and a thin fresnel edge rim.
- **Colour:** rift energy and dragon graded **differently**. The rift is electric violet-magenta with white-pink cores; the dragon is cooler lilac/indigo, lit by violet rims.
  - The owner rejected *both* the over-saturated pass (mean saturation ~0.8, hot pink, crushed blacks) *and* the grey under-saturated pass (~0.45). The approved band is a **mean saturation of about 0.60–0.68**.
  - The fabric and black floor match the site hero's violet-black (≈ rgb 9,3,20).
- **Never add:** halo, ring outlines around the claws, lens-bokeh butterflies.
- **Eyes:** subtle (brightness 4.5, about 75% of the original), small and seated in the sockets (owner asked twice: they bulged out). Each is a flat almond lens: radius `EYE_R` 0.024, depth `EYE_DEPTH` 0.6 along the eye bone's local x (which points out of the face; the old 1.3 made a capsule sticking forward), no sink (sinking deeper hides them at 3/4 views). Always-on faint glow sprite, `EYE_GLOW` 0.09. URL knobs: `?eyeR=`, `?eyeDepth=`, `?eyeSink=`, `?eyeGlow=`.
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
- **Rebuild RiftOpen:** see §4a. (`build_grip.py` is the old, retired Grip clip.)
- **Export:** `export()` in the build script (glTF, ACTIONS mode, force sampling, Draco, the `RO_*` stage helpers excluded), then `compress_glb.sh`. Then save the `.blend`.
- **Gotchas:**
  - New actions need `id_root = 'OBJECT'`, or the exporter drops them; Blender 4.4+ also needs the action **slot** assigned (`assign()` in `riftopen_lib.py`), or nothing evaluates.
  - Turn `use_nla` off while evaluating (NLA strips leak into bones the active action doesn't key); `riftopen_lib.py` does this and `export()` restores it.
  - Skill03 is body-static (only its arms move, from frame 36). Elbows hinge about their local Z axis; bend them only about that.

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

- Commit the RiftOpen work on `intro-prototype`; then, when the owner approves, merge into `main` and push (that deploys live).
- Intro music (`Netherwing-Intro-2.mp3`) isn't re-timed to the ~7.5s cinematic.
- Delete the five old, unused layer components once the owner OKs it.
- The head turns quickly at ~4.13–4.23 (the deliberate turn into the bolt); slow it if the owner calls it a glitch.
- Cyan butterfly accents barely register (additive blending over violet); needs a sprite/blend change, not the grade.
- The bright rift sits behind the hero text after the intro; the subtle drop shadow mitigates it. Alternatives: narrow/dim the tear at the end.
- Pre-existing lint errors in untouched files (`Hero.jsx` setState-in-effect, `TronDecor.jsx`, old `DragonScene.jsx`, `RiftCanvas_Legacy.jsx`); not from this work.
