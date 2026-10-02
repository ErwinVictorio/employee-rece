# Company event stage implementation

Scope: execute COMPANY_EVENT_STAGE_PLAN.md on top of the current full-roster implementation, preserving existing work and race outcome generation.

Branding: user approved the supplied Fortress SVG draft and “Company Fun Run”. The asset remains a recreated draft, not an official master. No anniversary, year, or slogan is included.

Implementation:
- One active-time timeline: renderer readiness, arrival (3s), welcome (10s), lineup (3s), countdown (4s), then the existing race.
- Shared branding, stage layout, deterministic gathering positions, movement, camera framing, and instanced uniform badges.
- Both venues, 3D-only presentation, pause/hidden-tab handling, reset/replay, reduced motion, and renderer recovery.
- Focused timeline/layout tests, existing unit tests, lint/build, and browser verification.

Scope update (2026-10-02): user removed 2D from the event. No presentation selector or 2D fallback is exposed. Renderer failure pauses the event; Retry 3D rebuilds the scene, and Resume race is enabled only once it is ready.

Validation before this scope update: 36 existing unit tests and 14 event timing/layout tests passed; the 12-case browser matrix passed for both venues with 2, 12, 13, 25, 50, and 100 participants.

3D-only scope verification: lint and production build passed. Browser check confirmed no 2D selection/buttons, WebGL loss disables resume, Retry 3D preserves the welcome phase time and roster, and explicit resume continues the timer. The existing large-bundle build warning remains. Target-device performance and final visual review remain outstanding for the overall stage plan.
