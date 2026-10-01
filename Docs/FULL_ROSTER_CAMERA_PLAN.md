# Full roster visibility and rolling camera

Status: proposed only. No game implementation changes in this planning pass.

## Goal

Show every selected employee in one continuous race scene, up to 100 runners. Give each runner a stable lane and expand the course to fit. Offer both a full-field overview and a readable, smoothly moving camera.

All runners can be visible together in overview, but their bodies and names will be small on a normal screen. Rolling mode provides closer views over time; it cannot keep 100 full-size runners and readable names on screen simultaneously. Keep a compact full-field overview visible during rolling mode so the entire field remains represented.

## Verified current constraints

- RaceScene3D slices the roster into groups of 12, mounting only the selected group. Automatic grouping follows the leader and can swap visible runners every two seconds.
- environmentLaneCapacity caps the environment at 12 lanes.
- Runner3D and RunnerLabels independently calculate lane positions using 3.2-unit spacing and the displayed roster size.
- RaceCamera follows race progress along X but has no sweep across the full lane axis. Venue fitting uses a fixed far plane of 300 and a bounded distance search.
- Company Grounds includes fixed ground dimensions, fog distances and shadow bounds that need revisiting for a wider course.
- Large-roster labels are currently limited to six within the displayed group.
- The roster already supports 100 employees. raceTiming currently imposes a minimum duration for larger rosters; 100 employees implies at least 60 seconds. Preserve this existing behavior in this visual change.

## Proposed work

1. **Shared course layout.** Calculate lane count, lane spacing, course bounds and stable employee-to-lane indices once. Use this layout for runners, labels, scenery and cameras. Remove the 12-runner slice and lane-group switching. Keep race distance and outcome logic unchanged; the expanded dimension is the lane axis, not the running distance.
2. **Expandable venues.** Extend the ground, lane markings, start and finish lines for the full roster. Adjust stadium boundaries and Company Grounds scenery, fog, camera clipping and shadow coverage. Avoid stretching the company building itself. Retain the two currently selectable venues.
3. **Overview camera.** Fit all runner bodies and course bounds to the available viewport, including space occupied by standings and controls. Recalculate on resize. Use overview for setup/countdown and provide a persistent All runners control.
4. **Rolling camera.** Smoothly sweep across the lane axis while following progress along the race axis. Use overlapping framing windows sized to the viewport, gentle acceleration at the ends and no sudden group replacement. Schedule coverage from race time so every lane gets a close view before the final stretch. Pause/resume must preserve position. Reduced-motion mode uses a stable overview.
5. **Full-field locator.** While rolling, show a compact overview with all runner markers and the current camera region. This preserves awareness of runners outside the main camera. Offer manual lane navigation and an explicit Resume auto camera control.
6. **Names and standings.** Show readable names for runners within the close camera view, prioritize a selected employee and avoid overlap. Use compact identifiers in the full overview; keep all employees accessible in standings. Cull offscreen labels instead of clamping them to the viewport edges. Selecting an employee in standings can focus their lane smoothly.
7. **Finish coverage.** Transition smoothly to a full-width finish overview that includes trailing unfinished runners. Keep all lanes represented through the last crossing. Preserve finish times, final order and the existing winner presentation after completion.
8. **Performance.** Measure 100-runner rendering before choosing optimizations. Reuse resources, simplify distant character geometry/animation and reduce label layout work. Use instancing if draw calls require it. Low quality must reduce detail without dropping employees. Target at least 30 FPS on the agreed test device; report measurements rather than assume this is achieved.

## Implementation order

1. Shared layout, full roster rendering and expandable ground.
2. Full-field overview and clipping/fog fixes.
3. Rolling movement, locator and manual controls.
4. Label readability, finish transitions and performance tuning.
5. Regression checks and desktop/mobile visual review.

Primary files: src/components/three/RaceScene3D.jsx, Runner3D.jsx, RunnerLabels.jsx, RaceCamera.jsx, CompanyGrounds3D.jsx, Stadium3D.jsx, RaceEnvironment.jsx; src/data/locations.js; src/utils/venueCamera.js and followCamera.js. Inspect stadium dependencies before implementation. Add a shared course-layout utility and locator component as needed.

## Acceptance checks

- Test 2, 12, 13, 25, 50 and 100 employees in both selectable venues.
- Exactly one stable lane and rendered runner per selected employee; no duplicates or roster slicing.
- Overview contains every runner body at setup, mid-race and finish on desktop and mobile.
- Automatic sweep covers every lane before final stretch, with no abrupt camera jumps or changes to lane assignment.
- Locator represents the full roster during close views; labels stay readable and attached to the correct runner.
- Pause/resume, replay, resize, manual overrides, reduced motion and renderer recovery remain consistent.
- Existing race results, eligibility, timing, 2D fallback and winner presentation remain correct.
- Run focused layout/camera tests, existing race regressions, lint and production build. Capture 100-runner overview/rolling/finish screenshots and FPS measurements.

## Scope assumption for review

The requested longer lines mean extending the start/finish lines and adding lanes for all employees. Increasing the running distance is a separate change. The recommended default is overview at setup, rolling plus full-field locator during racing, and full-width overview at the finish.
