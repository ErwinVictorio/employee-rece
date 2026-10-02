# Spoken race announcer — browser speech

Status: proposal only. Revised 2026-10-02 at the user's request: no external speech API. This plan supersedes the ElevenLabs integration proposal. No game code changes are included in this planning update.

## Approach

Use browser-provided speech synthesis (`window.speechSynthesis` and `SpeechSynthesisUtterance`) for spoken race commentary with matching captions. No ElevenLabs integration, API key, application backend, subscription, credit accounting, or generated-audio cache is required.

“No API” means no external paid/service API integration; browser speech is a built-in browser interface. Voice availability, pronunciation and quality depend on the browser and operating system. Do not promise universal support or offline speech: prefer device-local voices where available, and distinguish them from voices that may use a browser/vendor network service.

## Proposed implementation

1. **Voice controller:** add `useRaceAnnouncer` at App level so fullscreen entry/exit does not remount it. Feature-detect speech support, load available voices initially and on `voiceschanged`, preserve valid voice selection, and handle missing voices gracefully. Prefer an English device-local voice, with a configurable voice selector and an explicit Test Voice action. Initiate speech from a user gesture and verify actual-device playback.
2. **Live event detection:** add a pure utility based on sampled race progress, not future finish order. Detect stable leader changes, movement into second place, major comebacks and the winner only after crossing. Ignore tied-start rankings, brief position jitter and duplicate events. Never announce a predetermined winner early.
3. **Commentary examples:** “Erwin takes the lead!”, “Sales moves into second place!”, “Maria is making a comeback!”, and “Erwin wins!” Use participant display names without changing stored data. Begin with short English templates.
4. **Speech scheduling:** allow one utterance at a time and at most one pending relevant event. Use a six-second active-race-time cooldown between ordinary announcements; give the confirmed winner priority. Revalidate the event before speaking and discard stale position changes. Track race-generation IDs so delayed speech callbacks cannot affect a reset or replay. Keep commentary silent during arrival, welcome, lineup and the countdown in this first version.
5. **Controls and audio mixing:** add Announcer On/Off, voice selection, volume and Test Voice. Master sound-off must also silence the announcer. Lower crowd/footsteps while speaking, restoring their current user-selected levels on completion, cancellation or error. Coordinate speech with victory audio so the winner announcement is intelligible.
6. **Lifecycle:** cancel current and pending speech on pause, hidden tab, WebGL loss, reset, announcer-off and master mute. On resume, establish a fresh live baseline rather than replaying old overtakes. Preserve an unspoken confirmed-winner announcement when appropriate, but never speak it twice. Replay gets a fresh event history. Cancel test speech before starting an event; clean up listeners and speech on unmount. Guard against missing end/error callbacks so audio ducking cannot get stuck.
7. **Matching captions:** show the spoken sentence during playback in normal and cinematic modes without covering runner names, timer or Top 3. If browser speech is unavailable, has no usable voice, or fails, display a clear status and continue with caption-only announcements. This does not reintroduce the removed 2D renderer.
8. **Dependency cleanup:** during implementation, verify whether the installed ElevenLabs SDK has any remaining use. If unused, remove it and update the lockfile. Do not add provider credentials or backend files. The previously shared key is unnecessary for this design and should remain revoked.

## Verification

- Unit tests for live overtakes, tied positions, second-place changes, cooldown, stale pending events, winner-once behavior and new-race isolation.
- Mock speech synthesis to verify voice loading, cancellation, errors, missing callbacks, mute and audio-volume restoration without relying on physical speakers.
- Browser checks for Test Voice, user-gesture start, pause/resume, hidden tabs, reset/replay, WebGL recovery and cinematic entry/exit.
- Confirm there are no application requests to ElevenLabs or another external TTS endpoint and no provider key in source/build output.
- Run relevant existing tests, lint and build; listen on the actual event computer and a phone to check names, clarity, autoplay behavior and voice availability. Browser emulation alone does not establish audible output.

## Boundaries

- Preserve race timing, outcomes, winner eligibility, 3D-only presentation, cinematic labels and the ten-second welcome.
- No external TTS API calls, paid generation, backend service or account setup.
- No guarantee that every overtake will be spoken: short races and rapid changes require selective commentary.
- No guarantee of identical voices across devices. When speech cannot run, the race continues with visible captions.
- Implementation begins separately after this plan update.
