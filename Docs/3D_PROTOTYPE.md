# Historical two-runner prototype record

Superseded by the main full-roster 3D implementation. See [current implementation notes](3D_IMPLEMENTATION_NOTES.md). The old production preview button is removed; development now has a deterministic winner-falls fixture at /?prototype=1.

# Two-runner 3D prototype

Implement the accepted prototype before replacing the main 2D race.

- Add an optional, isolated 3D prototype screen with the first two employees, preserving the full roster.
- Use Three.js through React Three Fiber, a perspective camera, lighting, shadows, and a dimensional stadium track.
- Build an original procedural low-poly runner with articulated legs and arms. No licensed GLB model was supplied; the original PNGs cannot provide a 3D mesh. A custom animated GLB can replace this model later.
- Reuse the existing immutable race result, countdown, elapsed timing, and finish-order functions.
- Provide start/replay/reset, ranked results, employee labels/photos, camera selection, mobile layout, and an accessible WebGL failure fallback.
- Verify motion, finish order, navigation, browser errors, mobile layout, and frame timings. Headless performance is diagnostic, not a guarantee of physical-device performance.

References: https://r3f.docs.pmnd.rs/getting-started/installation (Fiber 9 for React 19), https://r3f.docs.pmnd.rs/getting-started/your-first-scene.

## Delivered

Use **Try 3D prototype** from setup. The prototype races only the first two employees, retains their names/photos/colors, and uses the selected duration. It has its own race session and audio lifecycle; returning leaves the complete setup roster intact. Leaving or resetting a running prototype requires confirmation.

The original mesh is built from Three.js geometries with independent articulated limb pivots, not a billboard or converted PNG. Name/photo overlays follow projected 3D positions. The scene offers stadium and elevated trackside camera views. Three.js/Fiber are lazy-loaded, so the initial 2D screen does not download the 3D JavaScript chunk (approximately 245 KB gzip in the verified build).

WebGL2 is required. Context loss stops rendering and offers retry or a return to setup. Reduced-motion preferences disable limb/bounce decoration while preserving race travel.

## Evidence

- Browser smoke passed: real WebGL2 context, two projected runners, camera changes, movement, countdown, ordered results, replay, reset/cancel, mobile layout, forced context loss/retry, and roster preservation; no uncaught runtime exceptions.
- Headless Edge sampled 60 FPS at desktop size and 58 FPS at mobile size in the final run. These measurements do not certify physical mobile hardware or battery use.
- ESLint, production build, and all five existing race-engine tests passed. Vite reports the expected large lazy-loaded Three.js chunk; it is kept out of the initial 2D bundle.
- Screenshots and frame measurements are in ignored `artifacts/3d-*` files.
- `tests/browser-3d.mjs` repeats the flow with a dedicated Edge DevTools port 9333 and Vite on port 5173.

This completes the two-runner prototype, not a replacement of the full 2–12-runner game. A polished rigged GLB, 12-runner performance testing, and replacing the main track require a later iteration.
