# Cinematic improvements

- Enable the existing animated champion scene in fullscreen, with broadcast controls kept accessible.
- Show countdown, GO, and a brief final-stretch cue using the existing race clock.
- Add smooth periodic wide shots between group tracking shots; retain all-runner finish framing and reduced-motion support.
- Use compact wide-shot labels, highlight live leaders, and offer a full-name toggle.
- Inspect courtyard surface artifacts and verify with lint, build, race tests, and browser checks where available.

Race order, finish times, and race duration remain unchanged.

## Verification

- ESLint and production build passed; all 70 unit tests passed.
- Browser cinematic checks passed for native fullscreen, name toggle, pause/resume, WebGL recovery, mobile, and winner reveal.
- Inspected the mobile winner screenshot. Company courtyard surface adjustment still needs a fresh visual check with the large roster shown in the reference.
