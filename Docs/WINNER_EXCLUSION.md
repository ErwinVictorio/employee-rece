# Automatic winner exclusion

- Enabled by default. Exclude previous winners filters the next race by employee ID, without deleting employee details or changing completed results.
- A winner is recorded once after crossing the finish line. Stopping before a winner crosses does not exclude anyone. Reset race and Edit Participants retain history.
- Setup and results show eligible/excluded counts; participant rows mark previous winners. Both Race Again buttons and Start Race are disabled below two eligible employees, with an explanation.
- Turning exclusion off makes everyone eligible; turning it back on reuses history. Restore previous winners explicitly clears history. New Game clears participants and history. Page reload also clears this in-memory session, as explained in the interface.
- History records winners even while the toggle is off, so enabling it includes earlier winners in the same session.

Verification: eligibility unit test, ESLint, production build, and browser coverage across successive rounds for cumulative exclusion, results preservation, master roster preservation, exhausted pool, toggle and restoration. Existing Three.js bundle size warning remains.
