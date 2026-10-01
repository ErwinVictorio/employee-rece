# Company Grounds image venue

The third selection uses the existing 3D runners, clock, labels, camera controller and winner podium. A clean illustrated setting is displayed behind the transparent Canvas. The course markings and finish stripe remain real 3D geometry. A shallow camera angle places the course in the pictured foreground. The backdrop is a fixed illustration, so it does not provide 3D parallax when the race camera moves.

The original Stadium and procedural Company Grounds remain separate selections. The Presentation setting remains available; 2D is only selected explicitly or used for recovery. Race snapshots retain `company-image` without changing race generation.

## Asset

- Runtime file: `src/assets/company-grounds-backdrop.png`
- Source reference: `Docs/COMPANY_GROUNDS_UI_REFERENCE.png` (preserved)
- Created with the built-in image generation tool, using the imagegen skill. The source's sample runners, interface and watermark were removed to keep the live scene unambiguous.
- Browser screenshots: `artifacts/company-grounds/image-3d-desktop.png`, `image-3d-mobile.png`, `image-3d-racing.png`, `image-3d-winner.png`.

Final prompt:

> Use case: precise-object-edit. Asset: clean environment background for a browser racing game, landscape 16:9. Edit target: supplied Company Grounds concept. Preserve the recognizable concrete company building, projecting balconies and roof canopy, dark gridded windows, entrance, warm daytime light, plants and blue/gold flags. Remove ALL UI, headers, footer, navy panels, text, names, timer, scoreboard, buttons, borders and watermark. Remove all racers and foreground people; remove track lane markings and checker finish (the game renders these). Fill removed areas with matching scene. Show the company building across upper 60% with broad empty concrete courtyard in lower 40%, three-quarter architectural view like reference. Full bleed setting only, no lettering, no interface, no runners. Keep facade appearance and proportions faithful to reference.

## Checks

`tests/browser-image-venue.mjs` exercises 3D selection, one Canvas, mobile overflow, race/finish/podium, actual WebGL context loss and retry, switching back to Stadium and explicit 2D fallback. Camera projection tests include the image venue. ESLint and production build pass; the existing large scene-chunk warning remains.
