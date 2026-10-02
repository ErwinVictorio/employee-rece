# Company event stage and branding plan

Status: Implementation in progress. Scope update (2026-10-02): 3D only, per user instruction. All 2D work and fallback requirements below are superseded; renderer recovery uses Retry 3D while preserving the paused event.

## Sample UI reference

[Open the supplied Fortress Steel Company Fun Run reference](./Fortress%20Steel%20Company%20Fun%20Run.png).

![Fortress Steel Company Fun Run stage and company branding reference](./Fortress%20Steel%20Company%20Fun%20Run.png)

Use this image for stage composition, blue-and-white branding, banner placement, runner uniforms, and track signage. The requested welcome period is ten seconds, regardless of the thirty-second display in the sample.

### SVG logo draft

[Preview the recreated SVG logo](./fortress-logo-draft.svg).

![Recreated Fortress logo draft](./fortress-logo-draft.svg)

This editable vector draft was recreated from the supplied reference. It has a transparent background, a blue tower symbol, and live text lettering. It is not an exact trace or an official master file: symbol proportions and font matching need visual review. The font may vary between devices until lettering is converted to paths using the approved font. A white version and stacked layout can be derived from the reviewed master for banners and uniforms.

## Intended experience

Use the supplied image as the visual reference: a blue-and-white Fortress Steel Inc. event stage, a large branded screen, side banners, lights, speakers, steps, and participants gathered in front. Build the stage as part of the 3D venue so participants and the camera can move around it.

Use official logo artwork when available, or the recreated SVG after visual review. Preserve the reference identity, including the tower symbol, company name, and blue/white treatment. The reference image's `00:30` is replaced by the requested ten-second welcome period. Treat the anniversary statement, event title, year, and slogan as configurable copy that needs confirmation before inclusion.

## Event sequence

1. **Setup:** Select participants, venue, duration, and audio options. Rename the primary action to **Start Event**.
2. **Stage arrival:** Prepare the race snapshot and required assets, then animate all eligible participants into assigned gathering rows facing the stage. Suggested entrance duration: 2-3 seconds. Start the next phase only when the scene and participants are ready.
3. **Stage welcome: 10 full seconds.** Hold participants in place with subtle idle motion. Show `Race countdown begins in 00:10` through `00:00`. The race countdown sound and race clock have not started.
4. **Move to starting lanes:** Animate participants into their assigned lanes while the camera moves to the existing starting overview. Suggested duration: 2-3 seconds. Start the countdown only when everyone is in position.
5. **Existing countdown:** Show 3, 2, 1, GO with the existing sound. Preserve the current four-second countdown timing.
6. **Race and results:** Continue the current race, finish camera, winner presentation, and results flow.

Timing assumption: the ten seconds start after everyone arrives, rather than at the Start Event click. Travel takes additional time. The chosen race duration starts after the existing countdown completes. Replay runs the same opening sequence with the newly eligible roster.

## Stage and gathering layout

- Place the stage outside the running corridor, with a clear route to the starting lanes.
- Use a raised platform, blue edge lighting, steps, central screen, two vertical logo banners, and lightweight speaker/light geometry.
- Keep the main logo readable from the welcome camera. A host, podium character, elaborate lighting effects, and extra crowd detail are optional later polish.
- Arrange participants in deterministic rows based on roster size. Keep every selected participant present, including a 100-person event, with consistent identity and lane assignment during movement.
- Fit the welcome camera to the stage and gathering bounds. Large rosters use a wider view; readable names remain available through the participant list rather than oversized overlapping labels.
- Use safe spacing and grounded movement. Avoid paths through the stage, other scenery, or overlapping gathering positions.
- Support Stadium and Company Grounds using venue-specific placement without stretching the company building or changing race distance.

## Company branding

Use one shared branding configuration for the official logo, approved colors, and event copy.

| Placement | Treatment |
| --- | --- |
| Stage screen | Large official Fortress logo with approved event copy |
| Stage side banners | Vertical blue/white banners using the same logo asset |
| Start and finish area | Branded boards or overhead signs outside runner paths |
| Track perimeter | Repeated logo panels with enough spacing to remain readable |
| Event overlay | Compact logo and event title, with room for timer and controls |
| Runner uniforms | Small chest/back logos where the model permits; use the same shared texture for both runner implementations |

Track signage is required even if uniform logos are too small to read at wide camera distances. Preserve participant identifiers and color cues. Keep logos away from lane numbers, race HUD, and results text.

Asset status: no dedicated official Fortress logo file was found in the inspected project asset list. A recreated SVG draft is now available at `Docs/fortress-logo-draft.svg` for review. Use an official SVG or high-resolution transparent PNG if supplied; otherwise refine the draft against the reference before final branded visuals. Derive blue and white variants from the same reviewed geometry.

## Current code and proposed integration

The current `useRace` starts directly in countdown and uses a four-second offset for race elapsed time. Current scene code already renders the full roster through `courseLayout` and `FullRosterRunners`; preserve that support.

| Area | Planned work |
| --- | --- |
| `src/hooks/useRace.js` | Add explicit arrival, welcome, and lineup phases; expose phase time and remaining welcome seconds; replace scattered timing offsets with named phase boundaries |
| `src/App.jsx` | Start Event action, locked roster/settings during the opening, replay integration, and phase-aware controls |
| New stage/branding components | Shared stage geometry, logo textures, banner panels, and configurable event copy |
| `RaceScene3D.jsx`, `RaceEnvironment.jsx` | Mount stage scenery and coordinate readiness and phase-specific overlays |
| `RaceCamera.jsx` | Welcome framing and smooth transition to existing starting overview |
| `Runner3D.jsx`, `FullRosterRunners.jsx` | Gathering and lineup positions/poses, shared branding, and stable participant identities |
| `courseLayout.js` or dedicated layout utility | Gathering positions, routes, and stage bounds alongside existing lane positions |
| `Stadium3D.jsx`, `CompanyGrounds3D.jsx`, `CompanySign3D.jsx` | Venue placement and official branded signs |
| `RaceBroadcast.jsx`, `RaceHUD.jsx` | Welcome timer and correct pre-race messaging; suppress racing-only displays until appropriate |
| `src/hooks/useGameAudio.js` | Optional crowd ambience during welcome; countdown cue only in countdown; retain mute controls and user-gesture audio unlock |
| `RaceTrack.jsx` and related CSS | Branded 2D welcome screen with the same phase timing and participant roster |

Use one authoritative logical timeline for all phases. Keep race elapsed and runner progress at zero throughout the opening. Preserve existing outcome generation, eligibility rules, winner recording, and ranked finish behavior.

## Recovery, accessibility, and performance

- Pause arrival, welcome timer, lineup, and countdown when paused or the browser tab becomes hidden. Resume from the same phase time.
- On WebGL loss, retain the race snapshot and phase progress. Retry or switch to 2D without restarting the ten seconds or generating new results.
- Cancel/reset clears phase state and pending preparation; no delayed callback may start an abandoned race. Repeated Start clicks create only one event.
- Reduced motion places participants and camera directly at each destination while retaining the full welcome period and countdown.
- The 2D fallback follows the same event sequence using a static stage panel and roster instead of 3D travel.
- Reuse geometry and logo textures, retain instanced rendering for large fields, and limit lights/shadows in low-quality mode.
- Ensure mobile framing, legible timer text, keyboard-accessible controls, and no flashing stage lights.

## Implementation order

1. Review the recreated SVG or use a supplied official logo; confirm event copy and define shared branding and timing constants.
2. Add phase timing and focused lifecycle tests, including readiness, pause, reset, and replay.
3. Build the stage and gathering layout for both venues, then add participant movement and camera transitions.
4. Apply branding to stage, track signage, overlays, and runner uniforms.
5. Integrate sound, 2D fallback, reduced motion, and renderer recovery.
6. Run targeted tests, lint/build, and browser visual verification.

## Acceptance checks

- Test 2, 12, 13, 25, 50, and 100 participants: everyone gathers and reaches a stable starting lane without disappearing or swapping identity.
- The welcome lasts ten active seconds after arrival. No countdown beep or race progress occurs early. Race duration excludes arrival, welcome, lineup, and countdown.
- At phase boundaries, pause/resume, hidden-tab recovery, reset, replay, and repeated clicks cannot skip or duplicate the countdown.
- Switching to 2D or recovering WebGL preserves phase time, participant snapshot, and eventual finish order.
- Logos match the reviewed master asset and remain correctly proportioned on the screen, banners, and track signage in both venues.
- Review desktop and mobile screenshots of welcome, lineup, countdown, and racing. Check reduced motion and low-quality mode, including 100 participants.
- Existing outcome, eligibility, finish-order, and full-roster tests continue to pass. Measure the added stage's performance on the target event device before event use.

## Inputs needed before final visual implementation

- Visual review of the recreated SVG, or an official Fortress SVG/transparent PNG if available.
- Final event title/year and whether the anniversary text and slogan in the reference should be used.

Default planning decisions: a mandatory ten-second welcome on every start/replay, participants gathered in front of the stage, and branding in both selectable venues.
