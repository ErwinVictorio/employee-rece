# Employee Race

A React/Vite stadium race for 2–100 employees, using the supplied character and sound assets.

## Run

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. Requires a Node version supported by the installed Vite release.

```sh
npm test
npm run lint
npm run build
```

## Play

The third location, **Company Grounds — Image**, reuses the 3D runners, race cameras and podium over an illustrated company courtyard backdrop. The backdrop was cleaned from the reference to remove sample racers and interface elements. The existing 2D option remains available as a fallback.

Choose **Stadium** (the default) or **Company Grounds** in Race location. Company Grounds adds a concrete courtyard, a procedural company building and an entrance backdrop for the winner podium. Location changes update the preview without generating a result. Replay, Edit Participants, Reset and New Game retain the location; reload restores Stadium.

Both venues use the same race simulation and support all 100 participants. The course expands to give every employee a stable lane. Company Grounds expands the courtyard without stretching its building. Its 2D mode uses a simplified building banner with the existing full lane list.

The initial six names are editable samples. Add, edit, or remove racers; choose a red, blue, yellow, pink, purple, or green character; optionally upload a JPG, PNG, or WebP photo (up to 5 MB). Photos are resized locally and never uploaded. Names, photos, and settings last for the current tab session only; reloading restores samples.

Choose 10, 15, 20, or 30 seconds, then Start Race. A four-second 3–2–1–GO countdown precedes the selected race duration. Effects and stadium ambience have separate setup switches; the header sound control toggles both. Crowd ambience is supplied instead of music because no music asset was provided.

The finish screen includes a podium, View Results, Race Again, Edit Participants, and New Game. Reset preserves participants; New Game clears them. Both ask for confirmation. Fullscreen is available in supported browsers. Reduced-motion preferences disable decorative animation.

## Main 3D stadium

Supported WebGL2 browsers use the 3D stadium by default. All selected employees remain rendered, up to 100. Setup uses a full-field overview; racing automatically sweeps across the lanes; the final stretch returns to an overview through the last crossing. **All runners** returns to overview. **Focus lane** or a name in standings smoothly focuses a runner; **Resume auto camera** restores the sweep. The full-field locator tracks every employee. Reduced motion keeps a stable overview. Camera choices reset on replay.

Choose **2D / low power** in setup or **Use 2D** during a race. Both views share the same race, elapsed time, events, and finish order. Low quality is the default and never removes employees. Fields above twelve use instanced character parts. See [full-roster camera verification](Docs/FULL_ROSTER_CAMERA_IMPLEMENTATION.md).

**Fun moments** defaults to ON. Randomly selected runners slow down, tumble, get up, and recover; any runner, including the winner, can fall. Turning this off preserves normal racing. Falls never reroll the result. Full names and lane numbers remain in standings when crowded in-scene labels become compact.

A hidden tab pauses the race until **Resume race**. WebGL context loss pauses the race and audio, with **Retry 3D** or **Resume in 2D** preserving the session. The deterministic two-runner winner-falls fixture is available only in development at `/?prototype=1`.

The reference-inspired presentation adds a broadcast timer, live overlay standings, portrait nameplates, six team colors and a populated stadium. See [visual enhancement notes](Docs/REFERENCE_VISUAL_ENHANCEMENT.md).

See [3D implementation and verification](Docs/3D_IMPLEMENTATION_NOTES.md), including performance limitations.
## Race guarantees

`src/utils/race.js` copies participants, applies Fisher–Yates once, and freezes the race snapshot. Animation cannot alter the result. A precomputed positive speed envelope includes real event slowdowns; after 75% of the duration, monotone Hermite paths converge toward ordered finish times. For up to twelve entrants, the winner finishes at 90% of the duration. Larger fields finish from 80% to 100%, extending short selections when necessary for at least 0.12 seconds between crossings. The last racer finishes at 100%. Result times are simulated crossing times, not employee performance measurements. A fresh shuffle can legitimately repeat a previous order.

Timing uses elapsed animation-frame timestamps and excludes paused time. Backgrounding the tab pauses the logical clock. All racers appear once in the complete ranking. Late browser frames can display several finishes together, but assigned finish times and rankings stay ordered.

## Implementation and verification

See [3D implementation record](Docs/3D_IMPLEMENTATION_NOTES.md). `npm test`, `npm run lint`, and `npm run build` check the engine and production bundle. Three.js is lazy-loaded; 2D remains available without it.

Browser scripts use a dedicated local Chromium DevTools port **9334** and Vite on **5173**, never an ordinary browser profile. `tests/browser-smoke.mjs` covers participant/photo CRUD and the 2D flow; `browser-main-3d.mjs` checks real context loss/retry/continuation; `browser-matrix.mjs` covers 2/6/12 runners and desktop/tablet/mobile layouts; `browser-lifecycle.mjs` covers the visual fixture, visibility-event handling and unavailable WebGL; `browser-durations.mjs` checks all durations with a 6x test clock. Run these sequentially because they share a browser page. Screenshots and measurements go into ignored `artifacts/`.

Physical-device frame rate and speaker output still require device testing. Accounts, persistent history, custom rigged models, and multiplayer remain outside this release.

After every runner finishes, the 3D Winner Spotlight presents the winning character on a podium with a trophy, spotlight, confetti and a 12-second rotation. View Results opens the standings; Race Again starts a fresh race. Motion can be paused and respects reduced-motion preferences. See [Winner Spotlight notes](Docs/WINNER_SPOTLIGHT.md); browser coverage is in tests/browser-winner-spotlight.mjs.

Bulk entry supports one name per line or a single Excel column: Enter adds all, Shift+Enter inserts a newline. All eligible employees participate and remain in the 3D scene. See [100-employee implementation](Docs/100_EMPLOYEES.md).
