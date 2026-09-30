# Netherwing intro prototype — handoff notes

Standalone cinematic prototype for the site intro (not yet ported into `portfolio/`).
Lives in git on the `intro-prototype` branch of `portfolio/` (committed 2026-09-30 as the owner-approved state). Iterate here; the old `../../_intro-prototype/` folder is only an archive of review frames/backups.
View: `cd portfolio && npm run dev` → http://localhost:5173/intro-prototype/ (or `python3 -m http.server 5199` from `Netherwing-Website/` → http://127.0.0.1:5199/portfolio/intro-prototype/)
(Play / space, slider scrub, ←/→ step, `?nohud` hides HUD). Everything is a pure function of timeline `t` (0–5.6s).

## Files
- `main.js` — the prototype. Earlier passes: git history (pre-git backups `main.v3.js` … `main.v13.js` are in the archive folder). `window.__probe(t)` returns head world/screen pos + guard hits.
- `netherwing_pollux_flap.glb` — model + two Blender-authored clips: `Flap` (hover-based wingbeat, used held at t=0.30 for the roar "wing crown") and `Flight` (flight posture: level body, legs tucked back, forelegs folded, tail straight with sway, wingbeat; 72f @24fps = 4 beats).
- `../../_blender/netherwing_anim.blend` — Blender source for those clips. Blender MCP: launch `../../_blender/launch-blender-mcp.command` (or `open -na Blender --args --python _blender/start_mcp.py`). Don't use `read_factory_settings` — it kills the MCP server.
- `frames-v*/`, `sheet-v*.png` — rendered review frames per pass.
- `../../_references/cinematic/` — reference frames (HSR Pollux, HotD, BG3).

## Current shot list (pass 10) — ONE continuous take, no cuts (owner)
Camera = `smoothTrack()` (C1 Hermite spline) through CAM keys; rift guard corrects in fine steps so it never pops. Only intentional motion spikes are impact shakes (1.3, 2.55, 3.45).
1. 0–0.9 anticipation: push-in on crack, letterbox, desaturate.
2. 0.9–1.9 breach: ONLY the claw mesh (Object_12) crosses the rift; body sealed behind (veil `uSealed`). `aimHead()` (Neck1→Neck3→Head) keeps the face looking straight out at camera from 0.75s until the 2.95 cut.
3. 1.9–2.95 emergence: body stays upright and square to the rift, IN LINE with the face (owner: no roll along the tear); from FRAME 0 until 2.3 the rig cancels the measured spine heading (Spine1→Neck) every frame so the body INITS square to the rift in line with the face (owner: never turn into it) — `aimHead` is also full strength from frame 0; both release over 2.3–2.5 / 2.85–3.2 so the owner's favourite 2.5s pose is unchanged; body HOLDS behind the rift plane until the tear is fully open, starts 0.3 right of centre (`DX`), then lunges a SHORT distance (rig z −0.2→0.55) over ~0.26s (2.42→2.68, soft ease) with the wing burst blended over 2.36–2.72, then creeps forward into the roar (owner: keep the speed, but a long jump looked unrealistic) — never drift forward earlier (owner: it phases through); camera glides round from 2.3 to arrive at the roar angle by 3.4.
4. 3.4–4.2 roar: the owner's favourite head angle (cam [2.63,0.49,4.05]→[2.45,0.52,3.8], fov 34→32, headTrack 1); Skill22 peak 3.45; wing crown = Flap@0.30 weight 0.55.
5. 4.2–4.95 bolt (owner, pass 11): roar camera angle HOLDS (aim frozen, doesn't chase); dragon coils 4.2–4.32 then bolts on `BOLT_DIR` straight at the camera, just over its left shoulder, accelerating (eIn), wingbeat >2× — fills frame ~4.55, wing sweeps past the lens ~4.75, gone by ~4.8 (<0.8s). Afterimage smear on the bolt.
6. 4.4–5.4 pan home: camera returns to the EXACT opening shot [0.3,0.1,5.2 → 0,0,-2, fov 45], flat on the rift; tear settles to a readable width, letterbox/grade ease out. No flash — the intro ends on this frame (5.6s).

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
