# Full-roster camera implementation

Implemented and locally verified on 2026-10-02.

## Delivered behavior

- Every selected employee remains rendered in one stable lane, up to 100. No roster slicing or automatic group replacement remains.
- Shared course layout supplies employee lane indices, lane positions, spacing, and bounds. Both selectable venues expand across the lane axis. Running distance and the company building's proportions are unchanged.
- Setup/countdown use overview. Automatic rolling follows race progress and sweeps all lanes before the final stretch, with eased endpoints and overlapping views. The camera samples race time, so pausing preserves its position.
- All runners returns to overview. A standings name or Focus lane selects a runner smoothly; Resume auto camera restores the sweep. Replay resets camera choices. Reduced motion uses a stable overview.
- The full-field locator displays every runner's progress and the visible lane region. It remains visible below the main scene during close views.
- Close-view labels show names and stable lane identifiers, prioritize the selected employee, avoid overlap, and cull offscreen anchors. Overview uses compact lane identifiers where space permits. The scrollable standings retain every name.
- The final stretch returns to a full-course, full-width overview, including unfinished trailing runners through the last crossing. Existing results and the winner presentation remain intact.
- More than twelve employees use shared, instanced character parts with sampled run/fall/recovery poses. Low quality reduces sphere detail and shadows without removing employees. Smaller fields retain the existing detailed characters. Label dimension reads are batched before positioning.
- Race outcome generation, eligibility, finish times, minimum durations, and 2D race logic were not changed.

## Verification

- 36 automated tests passed, including layout/viewport projection, sweep coverage for 2/12/13/25/50/100 employees, race motion, ordered finishes, duration rules, snapshots, and eligibility.
- Browser matrix: 24 combinations passed: all six requested roster sizes, both venues, desktop 1440 x 1080 and mobile emulation 390 x 844. Checks include all roster/locator entries, pause/resume, manual focus, auto resume, finish coverage, complete results and increasing finish times.
- Recovery checks passed: reduced motion, real WebGL context loss, Retry 3D, retained manual focus, resize, replay with the prior winner excluded, camera reset on replay, and 99-runner continuation/results in 2D.
- ESLint and production build passed. Vite retains its large-chunk advisory for the lazy-loaded Three.js bundle.
- Screenshots reviewed for desktop overview/rolling and mobile rolling/finish. Full sets also include mid-race overview in both venues.

Browser evidence is in the local, git-ignored [artifacts/full-roster](../artifacts/full-roster/) directory: `matrix.json`, `recovery.json`, `performance.json`, and screenshots. Example captures:

| Venue | Desktop | Mobile |
| --- | --- | --- |
| Stadium | [Overview](../artifacts/full-roster/stadium-desktop-overview.png), [Rolling](../artifacts/full-roster/stadium-desktop-rolling.png), [Finish](../artifacts/full-roster/stadium-desktop-finish.png) | [Overview](../artifacts/full-roster/stadium-mobile-overview.png), [Rolling](../artifacts/full-roster/stadium-mobile-rolling.png), [Finish](../artifacts/full-roster/stadium-mobile-finish.png) |
| Company Grounds | [Overview](../artifacts/full-roster/company-grounds-desktop-overview.png), [Rolling](../artifacts/full-roster/company-grounds-desktop-rolling.png), [Finish](../artifacts/full-roster/company-grounds-desktop-finish.png) | [Overview](../artifacts/full-roster/company-grounds-mobile-overview.png), [Rolling](../artifacts/full-roster/company-grounds-mobile-rolling.png), [Finish](../artifacts/full-roster/company-grounds-mobile-finish.png) |

## Performance measurements

Windows, headless Edge, Intel UHD Graphics 730 through ANGLE/Direct3D11; production build served with Vite preview. Each mode samples 120 animation-frame intervals after warmup, with 100 employees and no accelerated clock. Mobile rows use viewport emulation on the same PC, not a phone.

Before instancing, a development rolling sample measured about 20 FPS and 455 draw calls. Instancing reduced a comparable early sample to 41 draw calls. Final production samples averaged 32.9-60.0 FPS; this meets the 30 FPS average target on this local PC, not a universal minimum-frame-rate guarantee. Some samples had 50-67 ms p95 frame times. Development measurements varied more, including an approximately 22 FPS overview sample.

No physical target device was specified or tested. Physical-phone performance and sustained thermal behavior remain unverified. One hundred full-size names cannot fit in overview; use rolling/manual focus and standings for readable names.

## Reproduce

Run `npm test`, `npm run lint`, and `npm run build`. Start a dedicated test browser with DevTools port 9334 and run browser scripts sequentially because they share one page:

```sh
node tests/browser-full-roster.mjs
node tests/browser-full-roster-recovery.mjs
node tests/browser-full-roster-performance.mjs
```

These scripts default to `http://127.0.0.1:5175`. Set `COMPANY_TEST_URL` to your server; final performance measurements used the production preview at `http://127.0.0.1:5176`. The matrix and recovery scripts advance a test clock; the performance script uses real time.

## Production sample table

| Viewport | Venue | Quality | Rolling FPS | Overview FPS | Max p95 (ms) |
| --- | --- | --- | ---: | ---: | ---: |
| Desktop | stadium | Low | 59.5 | 44.7 | 50.0 |
| Desktop | stadium | High | 57.6 | 32.9 | 66.7 |
| Desktop | company-grounds | Low | 45.3 | 37.3 | 67.0 |
| Desktop | company-grounds | High | 55.8 | 60.0 | 33.2 |
| Mobile emulation | stadium | Low | 52.2 | 47.7 | 66.5 |
| Mobile emulation | stadium | High | 60.0 | 60.0 | 16.8 |
| Mobile emulation | company-grounds | Low | 60.0 | 60.0 | 16.8 |
| Mobile emulation | company-grounds | High | 60.0 | 60.0 | 16.8 |
