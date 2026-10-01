# Runner spacing and trailing-runner visibility

Status: implemented. Finish order and assigned crossing times are unchanged.

The shared motion plan now spreads the field to 15.2–16.8 percentage points at the 75% checkpoint. The position adjustment begins after 35% of the original split-target progress, ramps smoothly, and scales velocity consistently so falls still slow runners. Existing early comeback fixtures remain valid. The finish camera samples the trailing runner and interpolates pre-fitted padded bounds, retaining deterministic pause/resume behavior.

## Current cause

`buildMotionPlan` in `src/utils/raceMotion.js` rescales every runner to 80–82.5% progress at 75% of the race duration. On the 20-unit rendered track this is only 0.5 units of longitudinal separation across the entire field. This bunches runners together even after earlier falls or overtakes. Finish times also occupy only the final 10% of the duration (0.2 seconds between adjacent finishers for six runners in a ten-second race).

## Proposed implementation

1. Replace the narrow, independent split targets with coordinated motion targets. Start by tuning the field to span roughly 12–18 percentage points near the final stretch, approximately 2.4–3.6 world units on the current track. These are tuning targets, subject to speed/acceleration feasibility across all durations and roster sizes.
2. Preserve early overtakes and rank-independent falls. Build separation gradually through the middle of the race; do not place runners in permanent final-rank order from the start. Require continuous, forward motion and bounded acceleration into the finish segment.
3. Keep the existing shuffled result, selected duration and assigned finish times for the first implementation. Both 2D and 3D, labels and standings must sample the same motion plan. Do not fake spacing by offsetting only the meshes.
4. Fit the automatic finish camera to the finish line and the trailing unfinished runner, with padding for bodies and labels. Smoothly tighten the framing as trailing runners approach, preserving pause, reduced-motion and manual-camera behavior.
5. Check nameplate overlap and connector placement at the wider spread. Keep the winner spotlight after every runner finishes.

## Timing tradeoff

Preserving the current finish times means runners still cross close together. The initial scope improves visible separation during the race and approach. If visibly staggered crossings are also desired, a separate timing change would widen the finish window (for example, first finish at 80–85% instead of 90%, last still at 100%). That changes reported finish times and must be explicitly included before implementation; do not silently change it.

## Verification

Completed: 12 logic tests, ESLint, production build, desktop/mobile finish framing for 2 and 12 runners, and automatic-camera/manual-override/replay/reduced-motion browser checks. The motion matrix covers all supported roster sizes and durations, with fun moments on/off. Dedicated spacing assertions cover 2/6/12 runners and unchanged finish times. Vite retains the existing large Three.js chunk warning.

- Sample seeded races for 2, 6 and 12 runners at 10, 15, 20 and 30 seconds, with fun moments on/off.
- Check measured field spread at several mid/late-race checkpoints, while allowing temporary overlap during overtakes and the shared starting position.
- Verify no backward motion, teleports, early crossings, excessive speed/acceleration or finish-order changes.
- Browser-check desktop/mobile framing, visible trailing runners, label readability, finish camera, pause/resume, replay and 2D/3D agreement.
- Run focused motion/camera tests, ESLint and production build; capture before/after screenshots.

Likely files: `src/utils/raceMotion.js`, `src/utils/race.js`, `src/components/three/RaceCamera.jsx`, and relevant motion/camera tests. Adjust label placement only if visual checks require it.
