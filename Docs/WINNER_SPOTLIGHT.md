# 3D Winner Spotlight

- After every runner finishes, reuse the existing canvas for a podium celebration of the immutable first-place employee.
- Reuse the runner model/color, with a gold trophy, real spotlight, pooled 3D confetti, and a slow 12-second full rotation.
- Reference stage adjustment: display up to five actual finishers in a 4–2–1–3–5 layout, with numbered podiums, raised winner arms, cheering companions, a trophy on the gold platform, blue stage beams, banners and floor lighting. Smaller rosters only show their actual finishers.
- Show name/photo, first-place position, assigned finish time, View Results and Race Again. Keep edit/new-game and the complete table available below.
- Pause decorative motion on request; respect reduced motion and visibility. Preserve WebGL retry/2D recovery and clean up celebration objects on replay.
- Verify winner/result agreement, replay, results navigation, mobile framing, reduced motion and rendering recovery; run logic tests, lint and build.

Verified: 11 logic tests, ESLint, production build, and a dedicated browser check covering winner/time agreement, full 360-degree rotation, pause/resume, results navigation, replay, one canvas, mobile framing, reduced motion, WebGL retry and 2D preservation. Screenshots: artifacts/3d-winner-spotlight-desktop.png and artifacts/3d-winner-spotlight-mobile.png. Physical GPU/device performance remains unverified.
