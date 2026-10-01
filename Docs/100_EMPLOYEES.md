# 100-employee implementation

Implement bulk entry (newline/Excel single-column paste, Enter to add, Shift+Enter for a newline), a 100-person master roster, and a race snapshot containing every eligible employee. Never silently truncate pasted names or select only twelve entrants.

Use a focused broadcast view of at most twelve contiguous lanes, following the current leader's lane group by default, with a manual group selector. Lane IDs remain stable and results include offscreen racers. Limit floating labels to six local contenders. Keep full live standings scrollable and keyboard accessible. Keep 2D lanes in a bounded scroll area.

For more than twelve entrants, widen the finish window to the final 20% and enforce at least 0.12 seconds between assigned crossings by extending short requested durations. Explain effective duration before starting. Keep existing timing for small races. Separate normalized final rank from finish-time inference. Prepare and validate large-roster motion plans in a Web Worker before countdown so the UI can paint and remain responsive. Each motion table has at most 12,001 points. Cancellation terminates the worker; stale preparations cannot start a race. Restore snapshot freezing after structured cloning.

Preserve winner exclusion, comeback scenarios, pause, 2D recovery and the five-person podium. Verify bulk validation, all-entrant snapshots, ordered finishes, focused render count, standings, long duration, replay and exclusion. Physical-device performance is a separate validation requirement; do not call support unlimited.

## Implemented behavior

- Bulk entry appends names, trims outer spaces and ignores blank lines. Matching names remain separate people with unique IDs. Multiple Excel columns, names over 60 characters and total overflow are rejected atomically; no silent truncation.
- The roster maximum is 100 including existing employees. Single-person editing/photos remain available. The master list is scrollable and disabled while preparation is running.
- The broadcast viewport renders a contiguous group of up to twelve logical lanes using a local coordinate origin. Switching groups is a broadcast cut, not an overtake or lane change. Auto selection samples the live leader every two seconds; manual selection persists. Up to six local contenders have floating labels in large races. The global standings retain all entrants and ranks.
- Effective duration is `max(requestedSeconds, ceil((count - 1) * 0.12 / 0.20))` for large fields. For 100 entrants with the 10-second preset, the race lasts 60 seconds and crossings span 48–60 seconds. Final stretch starts at 65%; falls finish before this segment. Countdown is additional. Small-roster timing is unchanged.
- Low-power 2D retains all lanes in a bounded scrolling area. The podium still presents the top five; full results contain every participant. Previous winners are excluded only from subsequent race snapshots.

## Verification record

19 logic tests passed, including roster parsing, 13/25/50/100 entrants at 10/60/600-second selections, all scenario types, positive motion, finish order and bounded tables. Browser coverage checks 100 pasted entrants, overflow rejection, worker preparation, lane-group selection, mobile scrolling, all 100 result rows/times, replay with 99 eligible employees and 2D fallback. ESLint and production build pass; Vite retains the existing Three.js chunk-size warning. Physical-device frame-rate targets are not certified.
