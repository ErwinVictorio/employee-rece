# Company Grounds implementation

Implemented on 2026-10-01. Scope: exterior release, Phases 1–4. Opening sequence, lobby, exact branding and photographic textures remain deferred.

## Behavior

- Stadium remains the default. Two native buttons expose their selected state with text and `aria-pressed`; preparation disables the selector.
- Venue selection updates the preview without creating a race. `createRace` normalizes and freezes the location without drawing random numbers. The existing worker transports this setting and the existing hook freezes the cloned snapshot.
- Replay, participant editing, Reset and New Game retain the selected venue. Reload resets it. Winner exclusion and all race timing remain unchanged.
- Company Grounds has a concrete course, checker finish, procedural building, flags, barriers, planting and a 32-person instanced crowd. Its environment capacity depends on the roster, capped at twelve, rather than the current focused group.
- The existing camera controller uses venue framing. Company Grounds wide view includes the building roof on desktop. Trackside/finish views favor the runners; mobile may crop the landmark.
- The podium reuses the building component with a separate placement and the existing celebration lights, trophy, confetti and rotation.
- Explicit 2D selection and unavailable-WebGL fallback retain the venue name and show a generated courtyard banner. Context loss/retry retains the active race and paused clock.

## Reference and visual review

Available references:

- `Docs/COMPANY_GROUNDS_UI_REFERENCE.png`: approved generated concept.
- `Docs/GroundOrSettigsAssets/image.png`: interior display photograph; retained as reference only, not used in the exterior model.

No original exterior photograph was available in this workspace or the current conversation. The model follows the concept and written feature list; likeness to that original photograph cannot be certified.

Open [side-by-side review](COMPANY_GROUNDS_REVIEW.html) for the concept, first blockout, final desktop preview and podium. The first blockout cropped the roof; final desktop framing includes the silhouette. Intentional differences: a more elevated camera to fit all visible lanes, simple opaque glass, flat concrete colors, angular plants, fewer spectators, no photographic weathering and simplified support brackets. The model is an artistic reconstruction, with plain unseen walls. Low quality disables shadows. The concept watermark is absent from the game.

Screenshots and machine-readable measurements are local artifacts under `artifacts/company-grounds/` (ignored by Git):

- `stadium-baseline.png`, `stadium-final.png`
- `blockout-desktop.png`, `company-desktop.png`, `company-side.png`, `company-mobile.png`
- `company-racing.png`, `company-winner.png`, `company-2d-results.png`
- `roster-2.png`, `roster-12.png`, `roster-13.png`, `roster-100.png`, `roster-100-mobile.png`
- `finish-2.png`, `finish-12.png`, `finish-13.png`, `finish-100.png`, `winner-mobile.png`
- `webgl-unavailable.png`, `measurements.json`, `matrix.json`, `performance.json`

## Verification

- Existing logic suite: 22 tests passed before adding the camera projection check; the final four-test venue suite also passed (23 total tests).
- Venue invariants cover 2/6/12/13/100 entrants and 10/60/600 seconds: identical runners, ranking, event/motion plans, sampled positions, duration and finish timing with the same random seed. Unknown keys fall back to Stadium; structured cloning preserves location.
- Camera projection checks cover both venues, wide/trackside/finish, 2/6/12 lanes, desktop/tablet/mobile.
- Browser checks cover real context loss/retry with frozen clock, 2D continuation, full results, repeated switching/resource counts, a single Canvas, normal-speed six-person racing, 2/12/13/100-person accelerated races, final focused groups, worker preparation/cancellation, hidden-tab pause/resume, reduced motion, normal quality, keyboard selection, replay/exclusion, Reset cancellation/confirmation, New Game retention, reload default, one-minute and ten-minute races, and unavailable WebGL.
- ESLint, production build and `git diff --check` passed. Vite retains the warning about the large Three.js scene chunk (about 951 KB minified / 255 KB gzip).

Run logic/build checks with the package scripts. Browser scripts connect to an already running Edge/Chromium CDP endpoint at port 9334 and accept `COMPANY_TEST_URL` (default `http://127.0.0.1:5175`). Run them **one at a time**:

```sh
node tests/browser-company-grounds.mjs
node tests/browser-company-matrix.mjs
node tests/browser-company-recovery.mjs
node tests/browser-company-performance.mjs
```

On this Windows machine, Node was supplied by VS Code's `Code.exe` with `ELECTRON_RUN_AS_NODE=1`. No dependency changes were required.

## Rendering measurements and limits

Headless Edge, 1440×1080 viewport, six entrants, seeded 30-second race, 90 animation-frame intervals per case. GPU reported **ANGLE / SwiftShader Vulkan software renderer**. These are observed samples, not physical GPU certification. Timing varies with host load; frame intervals include browser scheduling and JavaScript work. The two views finish sampling at different elapsed times, but remain in the follow phase of the same seeded race.

| Venue / quality | Draw calls | Triangles incl. shadow passes | Mean frame ms | p95 ms | Max ms |
| --- | ---: | ---: | ---: | ---: | ---: |
| Stadium / low | 238 | 114,972 | 83.15 | 100.0 | 183.3 |
| Company Grounds / low | 217 | 75,034 | 27.96 | 33.4 | 33.4 |
| Stadium / normal | 445 | 171,516 | 65.93 | 83.4 | 183.2 |
| Company Grounds / normal | 425 | 135,790 | 107.59 | 116.7 | 200.0 |

Company Grounds is 21 draw calls below Stadium in low quality and 20 below in normal quality. All building blocks share one instanced mesh/material; its generated 512×64 sign adds one draw call and one texture. Courtyard blocks also share one instanced mesh, and the capped crowd shares another. There are no added downloaded textures or models.

Low quality averaged about 35.8 FPS in this sample. Normal quality averaged about 9.3 FPS on the software renderer, so it remains unsuitable there; low quality is the default. **The 30 FPS target on a representative physical device remains unverified.** No exact building dimensions, unseen architecture, byte-level GPU memory usage or original-photo likeness are claimed. Renderer geometry/texture resource counts are recorded; they are not memory byte measurements.
