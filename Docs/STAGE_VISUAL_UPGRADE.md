# Stage visual upgrade

Reference: the user's outdoor opening ceremony image. Improve the existing 3D scenery and opening overlay; retain the approved Fortress draft and Company Fun Run title.

- Rich blue screen with white branding, gold event accents and architectural graphics.
- Metal lattice truss, steady blue/white light fixtures, detailed speakers, illuminated steps.
- Host and branded podium, trophy table, matching vertical banners and potted greenery.
- Lower, frontal welcome camera; ceremony timer card and opening progress strip.
- Retain 3D-only recovery, ten-second welcome, fixed participant identities and existing race rules. No skip-intro action, new year, slogan or anniversary claim.

Validation completed:
- 50 unit tests passed; ESLint, production build and diff whitespace checks passed.
- Five browser visual cases passed: Stadium/Company Grounds with six participants on desktop, Company Grounds with six on mobile, Stadium with 100 on mobile, and Company Grounds with 100 on desktop. No uncaught browser exceptions or horizontal overflow.
- Desktop and mobile screenshots inspected under `artifacts/stage-upgrade/`; opening framing includes the stage and gathering roster. Large rosters intentionally use a wider view.
- WebGL loss/retry test passed with preserved welcome phase time and participant list.
- Repeated truss bars and foliage use instanced meshes; light beams use static translucent geometry with no added shadow lights or flashing. The 100-person Company Grounds browser capture reports 187 draw calls and 99,072 triangles. These are diagnostic counts, not a target-device FPS benchmark.

This is a stylized 3D interpretation of the supplied reference, using the project's existing runner models. The existing large-bundle build warning remains.
