# Version 1 implementation

Execute the full plan's Version 1 scope with the supplied assets and normal CSS.

- Build participant add/edit/delete, preset runners, optional photos, and 2–12 validation.
- Provide duration, independent effects/ambience controls, and stadium preview.
- Separate immutable Fisher–Yates results from monotonic animation paths; converge after 75% and cross in ranked order.
- Add countdown, live standings, finish times, winner, podium, complete results, replay, edit, confirmed reset/new game, and fullscreen.
- Verify race invariants with automated tests; run lint/build and browser checks where tooling permits.

Future items explicitly deferred by the source plan: additional themes, custom sprite creation, seeded replay, and persistent history. Supplied crowd audio serves as background ambience; no music asset was supplied.

## Completed

- Participant CRUD, 60-character names, 2–12 limits, three preset runners, and locally resized optional photos.
- Four durations; independent sound effects/ambience controls and master sound toggle.
- Setup, 3–2–1–GO countdown, racing, final stretch, finish, and results states.
- Immutable result snapshots and separately generated forward-only paths, live top three, ranked finish markers, and simulated crossing times.
- Stadium and finish-line artwork, animated PNG runners, trophy, podium, CSS confetti, and full results table.
- Replay, edit participants, confirmed reset/new game, responsive layout, reduced-motion support, and fullscreen control.
- Original assets preserved. Browser APIs and CSS fulfill the suggested Motion/Howler/confetti behavior without additional dependencies.

## Verification

- Race unit tests: 5 passed, including 880 simulated races (2–12 participants, all four durations, 20 random seeds each).
- ESLint and production Vite build passed.
- Edge browser smoke: desktop/mobile layout, CRUD, local photo upload, blank/maximum validation, countdown, finish order matching results, replay, cancel-safe reset/new game, and no uncaught runtime exceptions.
- Browser screenshots are in ignored `artifacts/`. Audible quality and fullscreen behavior require a human device check; automated browser checks do not establish those.
- A floating-point premature-finish edge case found by the tests was corrected by clamping pre-finish progress below 1.

## Deliberate boundaries

No backend or persistence is introduced. Refresh restores sample participants. Additional themes, seeded history, and bespoke animation sprites are deferred as the source plan specifies. Supplied static PNGs use the plan's simple bounce/rotation animation approach.
