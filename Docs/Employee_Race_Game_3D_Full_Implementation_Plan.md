# Employee Race Game: Full 3D and Fun Race Implementation Plan

Status: implementation applied 2026-10-01. See [implementation and verification notes](3D_IMPLEMENTATION_NOTES.md). Physical-device performance and speaker verification remain outstanding; the targets below are not device certification.

## 1. Approved direction

The user accepts the current two-runner 3D prototype and wants to apply that direction to the main game. Before completing the transition, add playful falls: a runner can trip, fall, get up, catch up, and still win.

Implement the fun sequence in the two-runner scene first. Then promote the verified behavior to the complete 2–12-employee game.

Keep the current original low-poly characters. Custom GLB characters are not required for this release. All timings, event frequencies, and performance targets below are proposed defaults to tune during implementation.

## 2. Intended experience

1. Add or edit 2–12 employees, photos, and character colors.
2. Choose 10, 15, 20, or 30 seconds and audio settings.
3. Leave **Fun moments** enabled, or turn it off for a normal race.
4. Start the race in the main 3D stadium.
5. Watch 3–2–1–GO, changing speeds, and overtaking.
6. Some runners stumble and fall, briefly lose ground, then recover.
7. A recovered runner can overtake others and finish first.
8. Every participant finishes; show the podium and complete results.
9. Race Again keeps the lineup/settings and generates a new race.

Example: Maria leads early, trips, falls behind Juan, gets up, builds speed, and wins near the finish. In another race, a runner can recover but still finish second or last. Falling must not reveal who will win.

## 3. Non-negotiable game rules

- Generate the complete random ranking exactly once before countdown.
- Keep the immutable ranking independent from fall selection and animation.
- Every employee appears once; all finish ranks are unique.
- Any racer, including the predetermined winner, is eligible to fall.
- Falling does not eliminate a racer, reroll the result, or force a loss.
- A fall affects displayed movement, temporary standings, and the runner pose.
- Falling does not change the fixed final rank or assigned finish time.
- No backward jumps, instant position corrections, or early crossings.
- Never move a finished runner back onto the track.
- Keep the original 90%-to-100% ordered finishing window initially: first place at 90% of the chosen duration, last place at 100%.
- Simulated times describe game animation, not employee performance.
- Race Again creates a fresh snapshot; a repeated order is legitimately possible.

The user-facing note can say: "Race order is randomized at the start. Fun moments add surprises along the way."

## 4. Current code and gaps

| Existing area | Current behavior | Required change |
| --- | --- | --- |
| `src/App.jsx` | Main 2D flow; optional prototype receives `employees.slice(0, 2)` | Main shared session with full-roster 3D renderer and 2D fallback |
| `src/components/three/RacePrototype3D.jsx` | Separate race/audio session; two fixed label refs | Extract reusable scene/HUD; remove duplicate session ownership |
| `src/components/three/Runner3D.jsx` | Two fixed lane positions; running limb swing | Dynamic lanes and poses for stumble, fall, recovery, and finish |
| `src/components/three/Stadium3D.jsx` | Two-lane dimensions and preset cameras | Derive track, finish gate, camera framing, and seating from lane count |
| `src/utils/race.js` | Immutable ranking and randomized forward paths | Add separate event timeline and event-aware movement planning |
| `src/hooks/useRace.js` | Elapsed clock and global race stages | Own the shared race session and predictable pause/resume behavior |
| `src/hooks/useGameAudio.js` | Countdown, footsteps, crowd, victory | Add one-shot event cues and centralized mute/cleanup handling |
| `src/components/Results.jsx` | Full results, podium, replay/edit/new game | Reuse with the main 3D session and optional neutral comeback note |
| Existing tests | Core race invariants; 2D and two-runner browser checks | Expand to falls, all roster sizes, fallback, and full-flow regressions |

The previous headless frame samples apply only to the two-runner prototype. They do not establish 12-runner or physical-phone performance.

## 5. Fun moments: default behavior

### Sequence

`running → stumbling → fallen → recovering → comeback → running → finished`

These are per-runner presentation states. They do not replace global game stages such as countdown, racing, final stretch, and results.

| Stage | Proposed length | Movement and appearance |
| --- | --- | --- |
| Stumble | 0.20–0.30 seconds | Arms flail, stride breaks, upper body leans forward, speed drops |
| Fall | 0.20–0.30 seconds | Controlled forward pitch, small slide, body approaches the track |
| On the ground | 0.25–0.45 seconds | Horizontal progress almost stops; others can pass |
| Get up | 0.35–0.50 seconds | Kneel/push-up pose blending back into standing |
| Comeback | 0.70–1.20 seconds | Smooth acceleration, stronger stride, subtle speed streaks |

Use gentle cartoon motion, a small dust puff, and an optional soft "boop" cue. Avoid realistic injury, uncontrolled ragdolls, mocking captions, or sounds that suggest pain.

Start with one fall style and one get-up style. Variation in timing, body lean, and recovery pace is enough for the first release.

### Event limits and placement

- Fun moments default to ON and are editable only in setup.
- Maximum one fall per runner per race in this release.
- Select event participants without consulting final rank. The winner is not protected and is not always selected.
- For 2–4 runners, aim for one fall; for 5–8, one or two; for 9–12, two or three.
- These counts are upper targets, not requirements when timing is too tight.
- Never have two runners on the ground at the same time initially.
- Stumbles begin after approximately 15% of the chosen duration.
- Complete recovery and the comeback acceleration by 70% of the duration.
- Start final-order convergence at 75%; no new falls during the final stretch.
- Leave at least 0.5 seconds between the end of one event's comeback and the next stumble.
- On a 10-second race, reduce the event count first. Do not squeeze a fall into an unreadable flash.
- Schedule within available time first; if a candidate does not fit, move it earlier, shorten within the defined ranges, or omit it. Never extend the race silently.

This means at least one playful fall should fit a normal valid race with Fun moments ON. Tests must prove that across all supported durations. If movement constraints make a candidate invalid, regenerate its presentation plan without reshuffling the ranking.

### Comeback behavior

A stumble must produce a visible slowdown. A recovered runner gradually regains speed; it must not slide across the track at maximum speed while lying down.

Comeback does not mean guaranteed victory. It is a recovery animation available to any falling runner. The already generated ranking determines whether that runner eventually wins.

For a planned winner-falls demonstration, force a test fixture where the winner loses the temporary lead and regains it before finishing. Do not force that story in every ordinary race.

## 6. Movement and timeline design

### Separate responsibilities

1. **Result:** immutable roster snapshot, final ranking, finish times.
2. **Events:** immutable stumble/fall/get-up/comeback intervals keyed by employee ID.
3. **Movement:** validated forward-only progress curves that account for those intervals.
4. **Pose:** deterministic body/joint transforms sampled from the same elapsed time.
5. **Effects:** dust, captions, and audio driven by event boundaries.

All randomness is generated before countdown. Render loops sample the plan; they must not call a random generator to invent new falls.

Suggested race snapshot:

```js
{
  id,
  duration,
  settings: { funMoments },
  order: [/* frozen employee snapshots */],
  runners: [
    {
      employee,
      rank,
      finishTime,
      motionPlan,
      events: [
        {
          id,
          type: 'stumble',
          stumbleAt,
          fallAt,
          groundAt,
          getUpAt,
          comebackAt,
          endAt
        }
      ]
    }
  ]
}
```

Proposed pure functions:

```text
createRace(roster, duration, settings, random)
planFunEvents(rosterIds, duration, random)
buildMotionPlan(runner, events, duration, random)
sampleRunner(runner, elapsed) -> progress, speed, pose, poseProgress
validateRacePlan(race) -> violations
```

Retain a `progressAt` compatibility wrapper for existing callers during migration. Introduce the settings argument without accidentally treating the current injected test RNG as settings; update callers/tests together or use an options object.

### Constructing feasible movement

- Replace pose-only tricks with a path that slows during stumble/get-up and nearly stops during the grounded interval.
- Build a positive speed envelope for the first 75% of the race, then integrate it into forward progress.
- Apply smooth speed transitions at event boundaries rather than discontinuous multipliers.
- Account for lost distance in the precomputed recovery section. Normalization must not undo the grounded slowdown or create an excessive comeback speed.
- Proposed initial comeback cap: 2.5 times that runner's nominal average race speed. Define and check acceleration limits during the first animation spike.
- Use monotone interpolation for final convergence, matching entry position and velocity where feasible. A monotone cubic Hermite curve with bounded tangents is a candidate.
- Validate position continuity, speed bounds, boundary behavior, and the ordered crossings before accepting a plan.
- If a curve cannot satisfy the constraints, adjust event timing or the early pace. Do not repair it by teleporting, moving backward, or changing the result.
- Preserve the floating-point guard that prevents progress from reaching 1 before the assigned finish time.

One sampler must supply both 3D and 2D positions, standings, finish markers, and result times. Do not maintain independent competing progress calculations.

## 7. Character animation work

- Split the current runner transform into track position, body orientation, and joint pose groups.
- Add a suitable body pivot for pitching forward while feet/torso stay above the ground.
- Blend poses through stumble, fall, ground, get-up, comeback, and normal stride.
- Calculate the whole pose from elapsed time. Do not accumulate rotations or rely on a chain of timers.
- Explicitly reset every joint after recovery, restart, and reset; no persistent bent limbs.
- Freeze or celebrate a finished runner without changing its crossing position.
- Add short-lived pooled dust particles only at the fall point.
- Keep the head/name association recognizable while the body rotates.
- Honor reduced motion: show a simple slowdown/status change instead of pitching, flailing, dust, or camera movement. Keep the same event schedule and result.

## 8. Main 3D race integration

### One race session

- Move the shared race clock/result/settings into the main flow.
- The 3D scene receives a race snapshot and elapsed time; it does not reshuffle or start a second clock.
- Preserve participant CRUD, photo handling, duration, and independent effects/ambience controls.
- Remove the first-two-only slice from the main race path.
- Keep the original prototype entry available only during development; remove its duplicate production controls once the main scene passes acceptance.
- Disable participant changes and repeated Start clicks during a live race and during start preparation.
- Do not let audio unlocking delay the UI indefinitely. A failed audio unlock must allow a silent race.

### Dynamic stadium and cameras

- Compute centered lane positions from participant count and a shared lane spacing.
- Expand the track, markings, finish gate, and stadium to fit every lane.
- Fit stadium and elevated trackside views to the complete race bounds and current aspect ratio.
- Keep the start, finish, and all racers in view; avoid stands hiding the action.
- Show lane numbers and maintain a readable full standings panel for larger rosters.
- Resolve label overlaps; on narrow screens, shorten in-scene labels while keeping full names accessible in standings.
- Do not auto-switch cameras when a fall occurs. A small caption can highlight the event without disorienting viewers.
- Fullscreen should emphasize the track/HUD while keeping essential sound and stop controls reachable.

### Setup and live UI

- Make 3D the normal main-race presentation on supported devices.
- Add **Fun moments: ON/OFF** with a short description: "Runners can trip, recover, and still win."
- Keep duration options and existing sound settings.
- Show time remaining, participant count, live standings, and a brief current-event caption.
- Use neutral captions such as "Juan is back on his feet!" or "Maria is catching up!"
- Avoid announcing the predetermined winner before the finish.
- Winner, podium, complete results, Race Again, Edit Participants, and confirmed New Game remain available.

## 9. Audio and event lifecycle

- Inventory the supplied audio before adding any new assets. No dedicated fall/get-up file has been supplied.
- For the first version, use a short synthesized cartoon cue or a verified, licensed local sound. Do not block the release on a new paid asset.
- One audio controller owns countdown, ambience, movement, event, and victory sounds.
- Deduplicate one-shot cues using race ID plus event ID plus cue stage.
- Do not replay a cue on React rerenders, camera changes, or context restoration.
- Suppress ordinary footstep layers for a grounded runner; if using a shared loop, lower it appropriately rather than pretending every runner is running.
- Sound OFF applies immediately. Turning it back on does not replay missed cues.
- Reset, New Game, leaving the race, and unmount must stop loops and clear pending cues.

## 10. Browser lifecycle and fallback

- Preserve the full 2D renderer as a fallback for unsupported WebGL2 or low-power preference.
- Both renderers consume the same session and the same event-aware progress.
- Reflect falls in 2D with a brief tilt/flattened pose or status badge, slowdown, and recovery. This keeps fallback behavior consistent.
- On WebGL context loss, pause the logical clock and audio, retain the snapshot, and offer **Resume in 2D** or **Retry 3D**.
- Resume from the saved elapsed time; never silently reroll or restart when switching renderer.
- Distinguish renderer recovery from an explicit confirmed race reset.
- Proposed visibility policy: auto-pause when the tab becomes hidden, then show **Resume race** on return. This avoids skipping an entire fall while the tab is hidden.
- Sample poses at the resumed time and suppress stale sound bursts.
- Add listener, animation-frame, material, geometry, and texture cleanup for navigation and repeated races.

## 11. Performance and accessibility

- Keep Three.js lazy-loaded; show a useful loading state and a working fallback.
- Avoid React state updates for every runner on every frame. Use scene refs for transforms and throttle visible HUD/standings updates independently.
- Share reusable geometries/materials and instance repetitive stadium objects where useful.
- Cap pixel ratio and use a low-quality mode for reduced shadows/effects.
- Render idle scenes on demand where possible, with continuous frames only during a race or transition.
- Pool dust particles; do not allocate new effects indefinitely or load remote models per race.
- Test 2, 6, and 12 runners at desktop, tablet, and mobile viewport sizes, across all durations.
- Proposed target: stable near-60 FPS on the available desktop and at least 30 FPS on a tested supported physical mobile device in low-quality mode.
- Treat headless results as diagnostics. If physical-device testing is unavailable, explicitly report that limitation instead of declaring the mobile target met.
- Keep keyboard focus, readable text standings, mute controls, reduced motion, and confirmation-dialog behavior intact.

## 12. Phased execution

| Phase | Work | Exit criteria |
| --- | --- | --- |
| 1. Fun animation spike | Two-runner stumble, grounded pose, get-up, recovery; deterministic winner-falls fixture | User can clearly see a runner lose ground, recover, and still win; no sliding while prone or teleporting |
| 2. Event and movement engine | Preplanned events, bounded speed curves, immutable snapshots, deterministic samplers | Core invariants pass for every count/duration, including winner falls and skipped frames |
| 3. Expand the stadium | 2–12 lanes, dynamic camera fit, names/photos, full standings | All racers visible and identifiable at 2, 6, and 12 participants |
| 4. Main-flow integration | Shared session, main 3D Start Race, Fun moments setting, existing results/actions | Complete setup-to-results flow works without a separate prototype session |
| 5. Effects and polish | Dust, neutral captions, sound cues, recovery/finish animations | Effects are clear, muted correctly, deduplicated, and cleaned up on reset |
| 6. Fallback and lifecycle | Same-session 2D fallback, WebGL retry, visibility pause/resume | No changed ranking, elapsed time reset, roster loss, or stale audio on recovery |
| 7. Performance and responsive pass | Draw-call/asset cleanup, quality options, label collision handling | Desktop/mobile layouts usable; measured performance and device limits documented |
| 8. Final regression and rollout | Full browser suite, race invariants, build/lint, documentation, default 3D | All required acceptance checks pass; 2D remains a usable fallback |

Complete Phase 1 before scaling the scene so the added fun is validated early. Complete movement validation before relying on the animation in the main game.

## 13. Proposed file organization

```text
src/
  components/
    RaceSettings.jsx                 # Extract existing setup controls when integrating
    RaceHUD.jsx                      # Shared time, standings, event caption
    RaceTrack.jsx                    # Existing 2D fallback, shared motion sampler
    Results.jsx                      # Existing full results and podium
    three/
      RaceScene3D.jsx                # Reusable scene; no separate race ownership
      Runner3D.jsx                   # Procedural mesh and pose application
      Stadium3D.jsx                  # Dynamic lanes, stadium and finish structure
      RaceCamera.jsx                # Fit and preset views
      RunnerLabels.jsx              # Names/photos and overlap handling
      RaceEffects.jsx               # Pooled dust and restrained effects
  hooks/
    useRace.js                      # Shared immutable session, clock, pause/resume
    useGameAudio.js                 # Shared loops and one-shot cues
  utils/
    race.js                         # Ranking and snapshot orchestration
    raceEvents.js                   # Event selection and scheduling
    raceMotion.js                   # Feasible curves and unified sampling
    runnerPose.js                   # Deterministic pose blend values
    trackLayout.js                  # Lane positions and scene bounds
tests/
  race.test.js
  race-events.test.js
  race-motion.test.js
  browser-smoke.mjs
  browser-3d.mjs
```

Names can change during implementation. Avoid creating empty abstractions solely to match this diagram.

## 14. Required verification

### Automated logic checks

- Counts 2–12, durations 10/15/20/30, Fun moments ON and OFF, multiple injected random sequences.
- Every participant appears once; original employee objects remain unchanged.
- Events stay within their permitted timing window, respect counts/cooldowns, and finish recovery before final convergence.
- Winner, middle finisher, and last-place finisher can each receive a fall in deterministic fixtures.
- Grounded speed is lower than normal running speed; every fallen runner recovers.
- A specific winner-falls fixture visibly loses the temporary lead and later finishes first.
- No backward progress, overshoot, invalid numeric values, excessive speed, or positional discontinuity at event boundaries.
- Every crossing matches the fixed order and assigned finish time; test just before and at each crossing.
- Pose sampling gives the same answer at a given elapsed time regardless of prior frame history.
- No lingering fall pose after reset/replay; no stale event/audio IDs from the previous race.
- Renderer switches and pause/resume preserve the snapshot and elapsed time.

### Browser and visual checks

- Add/edit/remove/photo upload and all setup limits remain functional.
- 2, 6, and 12 employees race from start through full results.
- Fall/get-up motion is readable from both camera views and stays above the track.
- The winner can fall and recover without an abrupt visual correction.
- Camera resize, reduced motion, muted audio, and long employee names work.
- Every result row, finish marker, and podium entry agrees.
- Replay keeps employees/photos/settings and generates a fresh plan.
- Canceling reset/new game/leaving does not change the race or roster.
- Confirmed reset/new game behaves as documented.
- Unsupported WebGL, actual context loss, retry, 2D continuation, and hidden-tab resume do not lose the result.
- Repeated races and renderer switches do not accumulate canvases, effects, or audio.
- Check production build, lint, focused tests, and diff cleanliness. Inspect screenshots/video rather than relying only on DOM assertions for the fall motion.

## 15. Release definition

This plan is complete when the default supported-browser experience is a full-roster 3D race, Fun moments can show a genuine slowdown/fall/recovery, and a fallen runner can still win with a believable continuous finish.

All existing participant/settings/results actions must remain usable. The 2D fallback must preserve the same session and outcome. Record measured performance and unresolved device-specific limitations in the implementation notes.

## 16. Deferred work

- Custom rigged GLB employees, realistic likeness, and multiple body types.
- Physics-driven ragdolls, runner collisions, obstacles, lane switching, and player-controlled movement.
- Jumps, slides, power-ups, random hazards, and multiple comedy styles.
- Network multiplayer, accounts, backend storage, persistent race history, or shareable replay seeds.
- Additional stadium themes and cinematic automatic camera cuts.

These are not needed to deliver the requested 3D race with falls and possible comeback wins.
