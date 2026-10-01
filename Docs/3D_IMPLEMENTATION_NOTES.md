# Full 3D implementation record

Implemented 2026-10-01. The main game now defaults to a full-roster 3D stadium on WebGL2 devices, with a shared-session 2D fallback. Physical-device performance certification remains outstanding.

## Delivered behavior

- One immutable ranking, employee snapshot, event schedule, and logical clock per race. The full 2–12 roster is used; the winner crosses at 90% and the final runner at 100% of the selected duration.
- Fun moments defaults ON. Rank-independent selection schedules at most one fall per selected runner, beginning after 15% and ending before 70%, with at least 0.5 seconds between complete events. Short races reduce event count.
- The movement planner integrates positive smooth velocity samples at 120 Hz. Grounded movement drops to 2% of the local running envelope, followed by recovery. Final monotone Hermite convergence starts at 75%. Runtime validation and tests enforce a 2.5 / finishTime speed cap and a 12 / duration normalized-track-distance acceleration cap.
- Forward pitching, grounded pose, push-up/knee recovery, running reset, and pooled dust are deterministic samples of elapsed time. Reduced motion preserves the slowdown and result while disabling pitching, limb decoration and dust.
- Dynamic lanes and bounds-fitted stadium/trackside cameras. Compact crowded/mobile labels map to lane numbers in full-name standings. Participant photos and existing results/podium/actions remain available.
- One audio owner for countdown, shared steps, crowd, victory and short synthesized cartoon event cues; no additional licensed assets. Race/event/stage keys suppress duplicate or missed cues. Shared steps soften while a runner is grounded. Mute, pause, reset and unmount stop active sound.
- Hidden-tab events pause the clock until explicit resume. Real WebGL loss offers Retry 3D or Resume in 2D; neither generates a new race. Renderer import errors also offer 2D. A failed/slow audio unlock cannot delay Start.
- Default low quality, capped pixel ratio, shared runner resources, instanced seats/finish tiles, pooled effects, demand rendering when idle, and a 20 Hz React HUD with a separate frame-sampled ref for 3D transforms.
- Development-only `/?prototype=1` provides the two-runner seed-1 Juan-wins-after-falling fixture. It is excluded from the production bundle.

## Verification

- Original five race tests plus four event/motion tests cover every count 2–12 and duration 10/15/20/30, both settings, seeded and extreme RNG sequences, fixed crossings, continuity, speed/acceleration, immutable snapshots, eligible ranks, history-independent poses, and the specific winner-comeback fixture.
- Browser participant regression: add/edit/remove, photo upload, blank-name/max-count validation, 2D racing, full results, replay, canceled and confirmed reset/new game, and mobile overflow.
- Audio browser regression: immediate mute, no countdown replay on unmute, exactly two event cues for the short-race fall, camera-change deduplication, and reset cleanup.
- Main browser regression: actual WEBGL_lose_context loss, retry, paused timer, second loss and same-session 2D continuation through results.
- Matrix: 2/6/12 racers, 1440x1080 desktop, 768x1024 tablet and 390x844 mobile viewports, both camera views, complete result/standings agreement, and label collision checks.
- Lifecycle: inspected grounded/recovered/winning fixture screenshots; visibility-event pause/resume (synthetic document visibility event), and forced unsupported-WebGL startup fallback.
- Duration browser checks: every supported duration, Fun moments ON/OFF, normal/reduced-motion settings, single-canvas lifecycle and ordered result times. These checks accelerate the test clock 6x; they are not frame-rate measurements.
- ESLint and Vite production build passed. The lazy Three.js chunk remains approximately 245 KB gzip and triggers Vite's standard large-chunk warning.

Browser scripts use dedicated Edge DevTools port 9334 and Vite port 5173; run them sequentially. Screenshot evidence is in ignored `artifacts/3d-*`; the latest software-rendered samples are in `artifacts/main-performance.json`.

## Subsequent visual enhancement

The reference-inspired visual pass changes scenery and viewport size. See [visual enhancement notes](REFERENCE_VISUAL_ENHANCEMENT.md) for current presentation and verification. The frame-rate figures below predate that pass.

## Performance and verification limits

Headless Edge required software WebGL (SwiftShader) in this environment. The final mobile-viewport samples were 33 FPS for 2 runners and 27 FPS for both 6 and 12 runners; earlier runs varied roughly 24–37 FPS. These are diagnostic viewport samples, not physical desktop/mobile GPU benchmarks. The near-60 desktop and 30 physical-phone targets are **not certified**. Actual phone rendering, battery behavior, and physical speaker output remain untested. The prototype's earlier 58–60 FPS figures do not apply to this release.

Full names stay in the accessible standings when in-scene badges are shortened. No custom GLB models, physics ragdolls, backend storage, or multiplayer were added.
