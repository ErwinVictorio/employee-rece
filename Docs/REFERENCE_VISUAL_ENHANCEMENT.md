# Reference-inspired stadium enhancement

Use the supplied image as the visual direction for the interactive 3D game.

- Emphasize the stadium during races, with a dark broadcast title, precise elapsed timer, and colored live standings over the scene.
- Add six selectable runner colors, more expressive original cartoon characters, and readable photo/portrait nameplates with projected connector lines.
- Dress the stadium with instanced spectators, greenery, blue perimeter boards, flags and track details; add economical ground shadows.
- Preserve the race planner, falls, immutable results, participant editing, audio and same-session renderer recovery.
- Check lint/build, existing race invariants and browser screenshots at desktop/mobile sizes. Document visual or device limitations.

## Delivered

- Race-focused desktop layout, Employee Sprint Cup title, elapsed clock, colored overlay standings and current-event caption.
- Red, blue, yellow, pink, purple and green choices; editable samples use all six. Existing photo upload overrides the original vector portrait badges. Added colors also tint the 2D fallback and setup thumbnails.
- Larger bordered nameplates, lane badges and projected colored connector lines. Mobile standings move to a compact lower panel; crowded fields keep compact labels and complete names in the main standings.
- Tighter oblique camera framing, blue perimeter boards, trophy motifs, flags, bushes and an instanced cartoon audience. Shared character geometry adds facial details, ponytail variants and inexpensive ground shadows.
- Existing race planning, countdown, falls, comeback wins, pause/resume, audio, results and same-session 2D fallback remain in place.

## Verification

- All nine race/motion tests passed; ESLint and production build checked.
- Browser checks passed six selectable palettes, six distinct default scene colors, live connector paths, and overlay/final-result order agreement.
- 2-, 6- and 12-runner browser matrix covers both camera views, desktop/tablet/mobile viewports, complete results, horizontal overflow and label overlap.
- Existing participant/photo CRUD, replay, cancel-safe reset/new game and 2D browser smoke passed.
- Real WebGL context loss, retry and 2D continuation passed after the visual changes.
- Inspected actual browser screenshots, including `artifacts/reference-enhancement.png` and `artifacts/3d-matrix-*`. Run `tests/browser-reference.mjs` with the documented local browser setup to refresh the showcase.

## Limits

This is a reference-inspired interactive scene built with original procedural characters and vector portraits. It does not use the reference's character models or pre-rendered image as the race background. The 100m label describes the themed dash; result times remain simulated game times.

The larger viewport and additional scenery change the rendering workload. Earlier pre-enhancement FPS figures are not applicable. Current headless SwiftShader readings are diagnostic only; physical desktop/mobile GPU performance and speaker output remain unverified. Low quality and the 2D fallback remain available.

Final headless mobile-viewport diagnostic samples: 2 runners = 11 FPS, 6 runners = 17 FPS, 12 runners = 10 FPS. These SwiftShader results are below the physical-device target and do not certify it; evaluate the visual mode on actual target hardware before an event.

## Automatic finish view

The requested follow-up now switches to a close finish-line view during the final stretch. See [Finish Cam behavior and verification](FINISH_CAMERA.md).
