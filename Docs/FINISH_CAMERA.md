# Automatic Finish Cam

Requested follow-up: automatically focus on the finish so crossing order is easier to see.

- Switch at 75% of the selected race duration (7.5s / 11.25s / 15s / 22.5s), before the first crossing at 90%.
- Blend the wide camera into an elevated finish-line view over 0.8 seconds. Reduced-motion users receive an immediate cut.
- Fit the final track segment and every lane for 2–12 runners and the current viewport. Keep the finish view until all runners finish, then switch to the 3D Winner Spotlight.
- Display Finish Cam / Final Stretch. In this view, nameplate numbers represent actual live position and match the leaderboard. Announce the first crossing only after the assigned crossing time.
- Stadium and Trackside controls can override the automatic view for the current race. Finish Cam restores it. A new race resets the automatic trigger and returns to the selected normal view during countdown.
- Camera interpolation samples the shared race clock, so pause, skipped frames and context restoration do not create a second clock or change the race result.
- Start/replay scrolls to the top so the camera is visible after leaving the results panel.

Verification: 11 logic tests, lint and production build; dedicated browser coverage for the trigger, transition, live rank badges, manual override, replay reset, reduced motion and mobile layout. Separate framing checks cover two- and twelve-runner fields and paused camera behavior. Screenshots: `artifacts/3d-finish-camera-*` and `artifacts/3d-finish-*-desktop.png` / `artifacts/3d-finish-*-mobile.png`.

Physical-device frame rates remain unverified; see the visual enhancement notes for the software-rendered performance limitation.
