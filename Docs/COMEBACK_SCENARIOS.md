# Mixed race scenarios

The result is still shuffled once before countdown. After the original motion plans are built, one presentation scenario is selected: 30% comeback, 20% close race, 50% steady. These probabilities apply across many races, not a fixed sequence.

Comeback races delay the winner's mid-race progress, leaving another runner ahead at the 75% checkpoint. A smooth positive-velocity finish segment then carries the winner past them before the assigned crossing. The last-place runner also receives a recovery-shaped speed profile, so a surge is not a guarantee of winning. Close races keep the top two closer; larger fields retain separation behind them. Two-runner comeback/close scenarios deliberately have smaller gaps than steady races.

Progress-space deformation preserves fall slowdowns. Every generated plan is checked for forward motion, bounded speed/acceleration and finish timing before countdown. Retries preserve scenario, events, ranking and finish times. Both renderers, standings and the trailing-runner camera use the same sampled motion.

The comeback caption uses actual rank improvement over the preceding 6% of race duration, starting after 60%, and stops when the first runner finishes. It can name any improving runner and never reads the selected scenario or predicts the winner. Pausing and seeking do not accumulate caption state.

Winner exclusion remains unchanged. No new assets or dependencies are required.

Verified: 14 logic tests, ESLint and production build. A seeded browser race confirms the eventual winner trails at final-stretch entry, the live overtake caption appears, pause/resume preserves the race, the correct winner reaches the podium and exclusion reduces eligibility. Screenshots: `artifacts/3d-comeback-trailing.png` and `artifacts/3d-comeback-overtake.png`. The existing Three.js bundle-size warning remains.
