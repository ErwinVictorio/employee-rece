# Lightweight crowd loops

The stadium's 132 spectators now share one animated instanced mesh with five low-poly parts per person. Static stadium decorations remain separate. A smaller 36-person crowd cheers behind the winner podium.

- Three loop types: bobbing, clapping and waving; deterministic varied phase/speed avoids synchronized movement and does not consume gameplay randomness.
- Smoothed activity rises from 0.65 during racing to 1.35 in the final stretch and 1.65 during celebration, with a modest speed increase.
- Updates are capped at 20 Hz in low-quality mode and 30 Hz otherwise; rendering remains on the existing canvas. Matrices use dynamic buffers, a reusable transform object and one draw call per crowd. No skeletons, added shadows, textures, dependencies or per-frame React state.
- Pause/hidden tabs freeze the decorative clock. Reduced motion uses a static pose. Setup is static and replay mounts the appropriate crowd. Geometry/material disposal follows the existing R3F lifecycle.

Browser coverage: `tests/browser-crowd.mjs` checks loop progression, energy changes, pause, reduced motion and replay. Physical-device FPS remains unverified; the update caps limit CPU work but are not a frame-rate guarantee.
