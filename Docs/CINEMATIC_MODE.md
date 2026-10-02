# Fullscreen cinematic race mode

Fullscreen only the existing race presentation container. Preserve its canvas, race snapshot, active camera choice, audio and clock. Browser Escape and the visible Exit button restore normal layout through `fullscreenchange`.

Show a compact elapsed timer, race status and live Top 3. Opening phases show their timing without revealing randomized results. Hide setup, full participant lists, runner labels, locator, camera settings and ceremony panels. Keep pause/resume and renderer recovery accessible. Finished races retain the track/finish view until fullscreen is exited.

If the Fullscreen API is unavailable or rejected, retain normal layout and show an error. Validate entry/exit, standings, phase continuity, focus restoration and renderer recovery in the browser.

Implemented: header action is now **Cinematic fullscreen**. Fullscreen targets the race container, with an accessible exit button and fullscreenchange handling. Normal page content is outside the fullscreen target; in-scene lists, labels, settings and ceremony UI are suppressed. Camera fitting uses the expanded viewport without changing the selected camera mode. Timer and standings use the authoritative race data. Pre-race rankings are withheld; completed events show final Top 3 over the finish view until exit restores the winner presentation.

Validation:
- Browser test passed native fullscreen entry/exit, rejected requests, the same canvas across entry, unchanged paused welcome time, Top 3 matching the normal standings, pause/resume, WebGL retry, mobile layout and results restoration.
- Desktop/mobile screenshots reviewed in `artifacts/cinematic/`.
- Existing 26 focused timing/layout/camera tests passed; cinematic fitting checks cover 2, 12, 13, 25, 50 and 100 participants on desktop/mobile.
- ESLint and production build passed. Existing large-chunk warning remains.

Fullscreen support depends on the browser; rejection leaves the normal layout available. Mobile checks use browser emulation, not a physical phone.

Name-label update: cinematic now retains compact runner names, lane numbers and connector lines during the race, including overview mode. Label placement uses cinematic overlay margins and up to ten staggered rows to avoid overlaps. Labels that cannot fit safely are hidden; opening ceremony labels retain their existing behavior. This supersedes the label suppression above. Lint, build and cinematic browser lifecycle checks passed with visible-name verification.
