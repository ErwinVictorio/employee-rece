# Spoken race announcer — browser speech

Status: implemented 2026-10-02 with browser speech; no external speech API. This supersedes the ElevenLabs integration proposal.

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
- Implemented in `useRaceAnnouncer`, the pure announcer detector/speech player, `AnnouncerControls`, normal/cinematic captions, and existing game audio mixing. Unused ElevenLabs SDK removed from the dependency manifest and lockfile.

## Implementation verification

### Mobile speech follow-up

- Replaced blank, muted startup speech with an audible "Announcer ready." utterance called directly from Start Event. The new race snapshot no longer cancels this activation; pause, reset, mute and countdown still cancel speech.
- Voice-list refresh no longer cancels playback merely because browser voice object identities changed. Empty voice lists now try the device's default English voice.
- Keep a strong reference to the current utterance until completion/cancellation, allow ten seconds for initial speech startup, and expose the actual speech error or timeout reason.
- Test Voice remains available as Enable voice during the event for direct user-gesture retry.
- Eight focused speech tests, lint and the mocked browser announcer lifecycle passed. Physical iPhone 16e output remains unverified; these changes address observed code defects rather than proving the device's root cause.

- Full existing/new suite passed 67 tests before the final two additional speech lifecycle tests; final focused announcer suite passed seven tests (including unspoken winner retry and stale playback rejection).
- ESLint and production build passed; existing large bundle warning remains.
- Browser test with mocked speech passed voice-list updates, Test Voice, crowd duck/restore, cancellation at start, actual race event speech, fullscreen continuity, pause/resume, winner once, master mute, reset, hidden-tab cancellation, speech errors and no-voice caption fallback.
- Source and generated-build search found no ElevenLabs references or provider-key patterns. Application code makes no TTS network requests; online voices are explicitly labeled and remain browser/vendor-managed.
- Browser speech uses device voices and `voiceschanged` per MDN: https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/getVoices and https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice/localService.
- Automated tests use a mocked voice engine and do not prove audible output. Use Test Voice on the actual event computer/phone to verify pronunciation, playback permission and speaker volume. Offline availability depends on the selected voice. Physical device listening remains unverified.
