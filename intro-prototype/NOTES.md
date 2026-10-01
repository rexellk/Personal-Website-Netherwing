# Netherwing intro prototype — handoff notes

Standalone cinematic prototype for the site intro (not yet ported into `portfolio/`).
Lives in git on the `intro-prototype` branch of `portfolio/` (committed 2026-09-30 as the owner-approved state). Iterate here; the old `../../_intro-prototype/` folder is only an archive of review frames/backups.
View: `cd portfolio && npm run dev` → http://localhost:5173/intro-prototype/ (or `python3 -m http.server 5199` from `Netherwing-Website/` → http://127.0.0.1:5199/portfolio/intro-prototype/)
(Play / space, slider scrub, ←/→ step, `?nohud` hides HUD). Everything is a pure function of timeline `t` (0–5.6s).

## Now in the site (2026-10-01)
The cinematic is the shared module `src/intro/netherwingIntro.js` (`mountIntro(container, opts)` → play/setT/onDone/probe/dispose). The site mounts it via `src/components/IntroCinematic.jsx` (replaces DragonScene + RiftCanvas + ClawScene + RiftParticles + VignetteOverlay; fires `dragonReady`, exposes `window.startDragonAnimation`, fires `dragonSceneDone`; reduced-motion jumps to the last frame; stops rendering once scrolled past the hero). App.jsx starts it on the first scroll and hands back to the hero at 5.3s (no flash). Assets: `public/intro/`. This review page (`intro-prototype/main.js`) is now a thin HUD around the same module, so tweaks land in both. Fabric/black floor tuned to the hero's violet-black (~rgb 9,3,20).

## Rift opening (owner, 2026-10-01)
NO struggle: one confident pull. GRIP is a single smooth ease 1.3→2.4 (no heave/slip keys, no heave shakes/lurch/flares, no tremor); the tear only ever widens (checked with `intro.probe(t).tear`), the claws let go 2.46–2.72 as the wing burst takes the tear.

## Smoothness rules (owner: "choppy")
Measured with per-frame wrist speed. Never: an eIn into a hold (dead stop), an eOut starting a clip at full speed, a <0.3s pose blend, or stepwise `track()` through back-and-forth keys (dead stops at each key) — use eIO, `smoothTrack`, and overlap consecutive motions. Current: breach lunge eIO, Skill03 ramp eIO 1.3–2.1, grip blend 1.16–1.6 / release 2.36–2.66, GRIP via smoothTrack. Playback is 20% slower after 0.9s (`SLOW`, `toTimeline/toReal`).

## Files
- `main.js` — the prototype. Earlier passes: git history (pre-git backups `main.v3.js` … `main.v13.js` are in the archive folder). `window.__probe(t)` returns head world/screen pos + guard hits.
- `netherwing_pollux_flap.glb` — model + two Blender-authored clips: `Flap` (hover-based wingbeat, used held at t=0.30 for the roar "wing crown") and `Flight` (flight posture: level body, legs tucked back, forelegs folded, tail straight with sway, wingbeat; 72f @24fps = 4 beats).
- `../../_blender/netherwing_anim.blend` — Blender source for those clips. Blender MCP: launch `../../_blender/launch-blender-mcp.command` (or `open -na Blender --args --python _blender/start_mcp.py`). Don't use `read_factory_settings` — it kills the MCP server.
- `frames-v*/`, `sheet-v*.png` — rendered review frames per pass.
- `../../_references/cinematic/` — reference frames (HSR Pollux, HotD, BG3).

## Current shot list (pass 10) — ONE continuous take, no cuts (owner)
Camera = `smoothTrack()` (C1 Hermite spline) through CAM keys; rift guard corrects in fine steps so it never pops. Only intentional motion spikes are impact shakes (1.3, 2.55, 3.45).
1. 0–0.9 anticipation: push-in on crack, letterbox, desaturate.
2. 0.9–1.3 strike: both claws punch through the crack together (Skill03). 1.3–2.45 FORCE (owner: claws must visibly drive the opening, joints must never bend/twist weirdly): Blender-authored `Grip` clip (built by `../../_blender/build_grip.py`, keys f0 close / f6 / f12 flared) is layered over Skill03 for scapulae, shoulders, elbows, tail and chest/jaw ONLY — wrists and fingers keep the original clip's curled claw (owner: grip, don't point) — elbows bend ONLY about their idle hinge axis, the shoulder twists so the forearm points at the edge. `applyGrip(u)` scrubs it by the `GRIP` heave curve (heave 1.68, slip, 2.02, slip, 2.36). The tear edges are measured every frame from each hand's OUTERMOST point (wrist + 4 talon tips), projected onto the rift plane along the camera ray (hands sit behind the plane — without this, parallax puts the lip ~50px outboard), edge 0.04 inside so the claws hook over it (`uGripW/uGripC/uGripY`); the veil lets the hand draw over the lip within `uClawR`, the rim is choked where they grip (`pinch`), base `uHalfOpen` stays tiny; wing burst rips it wide at 2.42+. Claw FX (owner ref: glow + pixel particles + cracks at the claws, fading with distance): FX centre is 0.09 outboard of the claw contact (where talons pierce the fabric) so the claw stays visible; `?nofx` disables FX for checking the pose. `kClaw` (puncture burst 1.18–1.55, held with the grip, flares on heaves) drives (a) fabric `clawFx` — jagged radial glowing cracks + glow — and `clawDent` warping the weave toward each fingertip (`uClaw0/1`), (b) `auras` camera-facing quads with a soft core only (owner: NO ring outlines), (c) `flecks` square additive points drifting out and flickering. Keep the core soft so the talons stay readable. Effort: elbows dropped ~20° so the bend reads from the front, spine curls 8° (jaw track NOT used in JS: head-on it reads as a duplicate mini mouth), whole tail swept down; in JS the head tucks down (`strain`) and head+arms tremble 2.2–2.42 (`tremor`). Lessons: solve elbows with a SIGNED angle about the idle hinge (unsigned picks hyperextension half the time); swing-only aims roll the elbow and fling its spur/helper bones into a 'rod'; Skill03 doesn't key Spine1/Chest/Tail — reset bones to rest before evaluating in Blender; new actions need `id_root='OBJECT'` or the glTF exporter drops them.
   Before: ONLY the claw mesh (Object_12) crosses the rift; body sealed behind (veil `uSealed`). `aimHead()` (Neck1→Neck3→Head) keeps the face looking straight out at camera from 0.75s until the 2.95 cut.
3. 1.9–2.95 emergence: body stays upright and square to the rift, IN LINE with the face (owner: no roll along the tear); from FRAME 0 until 2.3 the rig cancels the measured spine heading (Spine1→Neck) every frame so the body INITS square to the rift in line with the face (owner: never turn into it) — `aimHead` is also full strength from frame 0; both release over 2.3–2.5 / 2.85–3.2 so the owner's favourite 2.5s pose is unchanged; body HOLDS behind the rift plane until the tear is fully open, starts 0.3 right of centre (`DX`), then lunges a SHORT distance (rig z −0.2→0.55) over ~0.26s (2.42→2.68, soft ease) with the wing burst blended over 2.36–2.72, then creeps forward into the roar (owner: keep the speed, but a long jump looked unrealistic) — never drift forward earlier (owner: it phases through); camera glides round from 2.3 to arrive at the roar angle by 3.4.
4. 3.4–4.2 roar: the owner's favourite head angle (cam [2.63,0.49,4.05]→[2.45,0.52,3.8], fov 34→32, headTrack 1); Skill22 peak 3.45; wing crown = Flap@0.30 weight 0.55.
5. 4.2–4.95 bolt (owner, pass 11): roar camera angle HOLDS (aim frozen, doesn't chase); dragon coils 4.2–4.32 then bolts on `BOLT_DIR` straight at the camera, just over its left shoulder, accelerating (eIn), wingbeat >2× — fills frame ~4.55, wing sweeps past the lens ~4.75, gone by ~4.8 (<0.8s). Afterimage smear on the bolt.
6. 4.4–5.4 pan home: camera returns to the EXACT opening shot [0.3,0.1,5.2 → 0,0,-2, fov 45], flat on the rift; tear settles to a readable width, letterbox/grade ease out. No flash — the intro ends on this frame (5.6s).

## Owner's rift-grip reference (pass 27)
`../../_references/cinematic/owner-rift-grip-reference.png` — the target look for 1.3–2.45. Built so far: wide 'W' arms (upper arm out & down, elbow opens ~110°→~143°, elbow tip out-down-back, forearm level-to-rising, scapula hunched + protract→retract, chest pitched 12° forward) in `build_grip.py`; C-clamp fingers in JS (`clampFingers`: digits reach toward camera over the lip then curl 45/115/170° cumulative; thumb stays behind) after `alignHand` (knuckles along the edge); crystalline faceted lip + bevel, violet rim with pink-magenta inner glow (white core cut ~60%), pink cracks, magenta/violet vortex `swirl` behind the tear. NOT yet: hands at jaw height (model's long neck — they sit at shoulder height), raised half-folded wings filling the tear, floating shard debris, lip bulging toward each hand, body easing 0.45→0.35 behind the plane. `?view=side|top|q34|back|low` = debug turnaround (rift hidden), `?nofx` = no claw FX.

- Arm rod fix: `ElbowUpper_*` (upper-arm skin helper, parented to the elbow) overshoots past the shoulder in the grip pose and stretched the right upper arm into a rod through the neck; `followShoulder()` pins it 55% of the way from elbow to shoulder during the grip (`?helperAt=` to test).

## Colour look (pass 34)
Owner refs: `owner-color-tone-reference.png` (muted HSR key art — pass 33 overshot into grey, owner said UNDER-saturated) then `owner-color-vibe-reference-2.png` (current target: dark shadowy dragon, electric violet/magenta energy with white-pink cores, cyan butterfly accents). Owner rule: rift and dragon must NOT look monotone with each other.
Roles: rift energy = electric violet→magenta, white-pink cores; void = deep blue-indigo; fabric = near-black indigo; dragon = cool slate-indigo shape lit only by violet/magenta rims (rimLight 0xd27cff, pinkBack 0xff6ad8, backKey 0xb070ff; hemi 0x262a40, fill 0x8a96b8, headKey 0xb8c4e0); wings dark with magenta edge glow; eyes crimson/pink; 2-in-5 butterflies cyan.
Grade (after OutputPass): split-tone indigo/violet-magenta, saturation keyed to ENERGY `e = smoothstep(lum)*smoothstep(sat)` → mix(0.85, 1.75, e) + red lean on hot pixels, soft S-curve, indigo black lift, white-pink core rolloff, CA keyed to bright pixels (max 0.003). Exposure 1.05.

## Dragon lighting (pass 36)
Owner: dragon looked blended into the light (pass 34), then "worse" when darkened into a silhouette (pass 35) — wants NO shadow on the dragon. Now: body albedo at full (`?bodyTone=` 1.0), hemi 0.30 / fill 0.1→0.25, wings ×0.8 after 2.5s, plus a soft lavender front key `faceKey` 0xd8ccff from (1.5,3,6), ×1.3 from 1.2s (`?faceKey=`). Kept: rays/tearCore pushed to z −4.5 (were washing over the wings), haze depth-tested, thin fresnel edge rim (`?rim=`). Don't darken the dragon into a silhouette.

## Owner's rules (non-negotiable)
- Camera must only ever show the rift: it's a 2D screen in a 3D world. Enforced by `frustumOnRift()` guard each frame (all frustum corners must hit the 120-unit rift plane at z=0). The void seen through the tear is fine.
- No thorn halo (removed on request).
- No static blurry lens-bokeh butterflies (removed on request). The burst swarm + brief rushers remain.
- Keep the roar head angle; dragon must never look "sitting" when flying; claw-only breach like the original site.
- Don't commit/push without asking.

## Open issues / next ideas
- Claw mesh (Object_12) must ALWAYS be visible (owner) — it was hidden after 2.3s, which made forearms look like bare poles. The veil hides it before the tear opens.
- Owner's flight-anatomy reference: `../../_references/cinematic/owner-dragon-flight-views.png` (dorsal/posterior/lateral/ventral/frontal): forelegs tucked forward under the chest with claws curled, hind legs trailing, tail straight back, wings in a wide bat-like span.
- Owner (pass 9 request): face must be perpendicular to the rift while opening; head must face UP in take-off (never twisted down); arms must not phase into the body; don't travel up.
- 2.8s emergence still shows the idle-ish lower body (legs/arm on hip) and a pale shoulder blade — candidates: tuck legs, tint the blade.
- A dark straight rod still shows along the lower body in take-off (likely a limb/spike, not verified); jaw doesn't open.
- Tried an edge-rim emissive on the wings: the `ramp` term is ~1 over the whole skinned membrane, so it flattened them — reverted. Real rim glow needs a UV- or vertex-based edge mask.
- Polish: soft motes instead of hairline suction streaks, wing translucency gradient.
- Port into site: replaces DragonScene + RiftCanvas + ClawScene layers; needs audio sync (intro track), skip on scroll/tap, portrait/mobile framing, reduced-motion fallback, perf budget.
