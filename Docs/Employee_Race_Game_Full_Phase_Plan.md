# Employee Race Game
## Full Development Plan — Phase by Phase

## 1. Project Overview

The **Employee Race Game** is a fun internal web game inspired by race randomizer games.

Instead of ducks, the racers are employees.

The main idea is:

- The user adds employees.
- Each employee appears as a runner in a race lane.
- The system randomizes the complete final order **before the race animation starts**.
- The race animation makes employees appear to speed up, slow down, and overtake each other.
- The visual race looks unpredictable.
- The winner and final ranking are already fixed in the game state.
- When the race ends, the result screen shows the winner and the complete race ranking.

The app is mainly a **2D browser game**.

No 3D engine is required for Version 1.

---

# 2. Main Goal

The application should:

- Add employee participants
- Support employee name and avatar/photo
- Allow the user to configure race duration
- Allow different race themes later
- Generate a complete random result before the race
- Animate all employees during the race
- Simulate overtaking and speed changes
- Make the finish order match the generated random result
- Show a winner screen
- Show a complete race result table
- Allow Race Again
- Allow Edit Participants
- Allow New Game

---

# 3. Core Game Rule

The most important game rule is:

> The complete race result is generated once before the visual race begins.

Example participants:

```text
Juan
Maria
Pedro
Anna
Carlos
Isabelle
```

Randomized race result:

```text
1. Maria
2. Carlos
3. Juan
4. Pedro
5. Isabelle
6. Anna
```

This order should not change once the race has started.

The animation is only the visual presentation of that result.

---

# 4. Technology Stack

## Frontend

Recommended:

```text
React JS
Vite
Motion
Lucide React
Howler.js
canvas-confetti
Tailwind CSS or normal CSS
```

### React JS

Handles:

- UI
- participant state
- race state
- results
- settings

### Vite

Used for:

- project setup
- development server
- production build

### Motion

Used for:

- runner movement
- overtaking
- countdown
- entrance animation
- winner animation
- result animations

### Howler.js

Used for:

- countdown audio
- race start sound
- crowd sound
- running sound
- finish sound
- winner sound

### Lucide React

Used for:

- buttons
- settings icons
- sound controls
- reset controls
- participant icons

### canvas-confetti

Used for:

- winner celebration
- race completion effect

---

# 5. Version 1 Scope

Version 1 should focus only on the important parts.

Include:

- participant management
- employee name
- employee avatar/photo
- race duration
- sound toggle
- Start Race
- countdown
- 2D race lanes
- animated runners
- fixed randomized final order
- winner screen
- result table
- Race Again
- Edit Participants
- New Game
- responsive layout

Do not add unnecessary features until the main race works properly.

---

# Phase 1 — Project Setup

## Objective

Create the React project and install the required libraries.

## Tasks

1. Create Vite React project.
2. Install dependencies.
3. Create base folder structure.
4. Add sample runner assets.
5. Add sample track background.
6. Test the project.

## Suggested Installation

```bash
npm create vite@latest employee-race-game
```

Select:

```text
React
JavaScript
```

Then:

```bash
cd employee-race-game
npm install
npm install motion lucide-react howler canvas-confetti
npm run dev
```

---

# Phase 2 — Project Structure

Recommended structure:

```text
src/
│
├── assets/
│   ├── runners/
│   ├── tracks/
│   ├── sounds/
│   ├── trophies/
│   └── ui/
│
├── components/
│   ├── Header.jsx
│   ├── ParticipantsPanel.jsx
│   ├── EmployeeForm.jsx
│   ├── RaceSettings.jsx
│   ├── RaceControls.jsx
│   ├── CountdownOverlay.jsx
│   ├── RaceTrack.jsx
│   ├── RaceLane.jsx
│   ├── Runner.jsx
│   ├── RaceHUD.jsx
│   ├── WinnerScreen.jsx
│   ├── ResultsTable.jsx
│   └── ConfirmDialog.jsx
│
├── hooks/
│   ├── useRace.js
│   ├── useRaceTimer.js
│   └── useGameAudio.js
│
├── utils/
│   ├── shuffleArray.js
│   ├── raceHelpers.js
│   └── randomSpeed.js
│
├── data/
│   └── defaultEmployees.js
│
├── App.jsx
├── main.jsx
└── index.css
```

---

# Phase 3 — Main Screen Layout

## Objective

Build the setup screen first.

The initial page contains:

```text
Header

Participants Panel
Race Settings

Start Race

Race Preview / Empty Track
```

## Header

Example:

```text
EMPLOYEE RACE
Add employees, set the race, and let's see who will win!
```

Controls:

```text
Sound
Reset
```

---

# Phase 4 — Participants Management

## Objective

Allow users to manage employee racers.

Each participant can contain:

```js
{
  id: 1,
  name: "Juan Dela Cruz",
  avatar: "/employees/juan.png",
  color: "red"
}
```

## Participant Features

- Add employee
- Edit employee
- Delete employee
- Show employee count
- Preview avatar
- Prevent blank names

Recommended initial limit:

```text
Minimum: 2 employees
Recommended maximum: 12 employees
```

The maximum can be increased later.

---

# Phase 5 — Employee Avatar System

## Objective

Support recognizable employee racers.

Version 1 can support:

- employee photo
- generic avatar
- pre-made cartoon avatar

Later, the character system can be improved.

## Recommended Approach

For the first version:

```text
employee photo/avatar
+
animated generic runner body
```

This avoids needing a unique full-body animation for every employee.

Possible structure:

```text
employee face/avatar
↓
runner component
↓
shirt color / lane color
```

Important:

Employee photos should only be used with permission.

---

# Phase 6 — Race Settings

## Objective

Allow the user to configure the race.

Recommended options:

### Race Duration

```text
10 seconds
15 seconds
20 seconds
30 seconds
```

Default:

```text
15 seconds
```

### Track Theme

Version 1:

```text
Stadium
```

Future:

```text
Beach
City
Forest
Office
Space
```

### Sound

```text
Sound Effects: ON/OFF
Background Music: ON/OFF
```

---

# Phase 7 — Game State Management

Recommended game states:

```text
setup
countdown
racing
finalStretch
finished
results
```

### setup

User manages employees and settings.

### countdown

Displays:

```text
3
2
1
GO!
```

### racing

Employees are actively racing.

### finalStretch

Race animation starts converging toward the predetermined final result.

### finished

Winner crosses the finish line.

### results

Winner screen and full ranking are available.

---

# Phase 8 — Main React State

Suggested state:

```js
const [employees, setEmployees] = useState([])
const [raceDuration, setRaceDuration] = useState(15)
const [trackTheme, setTrackTheme] = useState("stadium")
const [raceState, setRaceState] = useState("setup")
const [resultOrder, setResultOrder] = useState([])
const [raceProgress, setRaceProgress] = useState({})
const [winner, setWinner] = useState(null)
const [soundEnabled, setSoundEnabled] = useState(true)
```

---

# Phase 9 — Random Result Generation

## Objective

Generate the final order once.

When the user clicks:

```text
Start Race
```

the application should:

1. Validate employees.
2. Copy the employee list.
3. Shuffle the list.
4. Save the complete final result.
5. Do not change it during the race.

Example:

```js
const raceResult = shuffleArray(employees)
setResultOrder(raceResult)
```

Recommended:

Use Fisher-Yates Shuffle.

---

# Phase 10 — Countdown

## Objective

Create anticipation before the race.

Sequence:

```text
3
2
1
GO!
```

Animations:

- scale
- fade
- bounce

Sounds:

```text
3 → beep
2 → beep
1 → beep
GO → whistle / start sound
```

After `GO!`:

```text
raceState = "racing"
```

---

# Phase 11 — Race Track

## Objective

Create the main race environment.

Recommended Version 1:

### Horizontal 2D track

Each employee gets one lane.

Example:

```text
Juan       🏃━━━━━━━━━━━━━━━━━━━━━━━━━━🏁
Maria      🏃━━━━━━━━━━━━━━━━━━━━━━━━━━🏁
Pedro      🏃━━━━━━━━━━━━━━━━━━━━━━━━━━🏁
Anna       🏃━━━━━━━━━━━━━━━━━━━━━━━━━━🏁
Carlos     🏃━━━━━━━━━━━━━━━━━━━━━━━━━━🏁
Isabelle   🏃━━━━━━━━━━━━━━━━━━━━━━━━━━🏁
```

The finish line stays on the right.

This layout is easier to animate and responsive.

---

# Phase 12 — Runner Component

Each runner displays:

- employee avatar
- runner body
- employee name
- lane number
- optional position indicator

Example data:

```js
{
  employeeId: 1,
  progress: 34,
  temporarySpeed: 1.2,
  finalRank: 3
}
```

Motion handles the runner's horizontal movement.

---

# Phase 13 — Running Animation

## Objective

Make runners look alive.

There are two levels.

### Simple Version

Use one transparent PNG.

Animate:

- x position
- small vertical bounce
- slight rotation

### Better Version

Use:

- sprite sheet
- animated WebP
- GIF
- frame animation

Recommended long-term option:

```text
transparent animated runner WebP
```

No 3D rendering required.

---

# Phase 14 — Race Progress System

Every runner has progress:

```text
0% → 100%
```

Example:

```js
{
  id: 1,
  progress: 45
}
```

Motion converts progress to horizontal position.

Example concept:

```text
progress 0 = start line
progress 100 = finish line
```

---

# Phase 15 — Dynamic Speed Simulation

## Objective

Make the race look unpredictable.

During most of the race:

- runner speed changes randomly
- runners overtake each other
- some slow down
- some accelerate

Example:

```text
Juan speeds up
Maria slows down
Pedro overtakes Juan
Carlos moves to first
Maria catches up
```

Recommended update frequency:

```text
300ms–700ms
```

The animation should stay smooth.

---

# Phase 16 — Controlled Random Animation

Important:

Temporary positions can change.

Final position cannot change.

During approximately the first:

```text
70–80% of the race
```

the race can look highly random.

During the final:

```text
20–30%
```

the race should gradually move runners toward their predetermined finish positions.

This is the key to making the game look exciting while keeping the fixed result.

---

# Phase 17 — Final Stretch Logic

Example predetermined result:

```text
1. Maria
2. Carlos
3. Juan
4. Pedro
5. Isabelle
6. Anna
```

Near the finish:

- Maria gradually becomes fastest.
- Carlos stays close.
- Juan moves into third.
- Others align behind them.

Do not instantly teleport runners.

Use gradual acceleration/deceleration.

---

# Phase 18 — Finish Line

When a runner reaches the finish:

- record visual finish time
- lock their final position
- optionally freeze them after crossing

Example:

```text
Maria → 1st
Carlos → 2nd
Juan → 3rd
```

The visual finish order must always match `resultOrder`.

---

# Phase 19 — Race HUD

During the race show:

```text
EMPLOYEE RACE

Time Remaining: 00:08

6 Racers

Sound
```

Optional:

live current ranking:

```text
1 Maria
2 Pedro
3 Carlos
...
```

This ranking can change during the race.

---

# Phase 20 — Race Sounds

Recommended sounds:

## Countdown

```text
beep
beep
beep
```

## Start

```text
whistle / start sound
```

## Race

```text
light crowd ambience
footsteps
upbeat race music
```

## Final Stretch

```text
music builds slightly
crowd gets louder
```

## Finish

```text
short success impact
```

## Winner

```text
victory fanfare
```

---

# Phase 21 — Winner Screen

After the race:

Display the winner prominently.

Example:

```text
WINNER

Juan Dela Cruz

1st Place
```

Visual elements:

- trophy
- confetti
- stadium background
- winner avatar
- gold accents

Buttons:

```text
View Results
Race Again
```

---

# Phase 22 — Podium

Optional but recommended.

Display:

```text
       🥇
      Juan

🥈              🥉
Maria          Pedro
```

This gives more game-show feeling.

---

# Phase 23 — Race Results

Show all racers.

Example:

```text
Position | Employee        | Time
-------------------------------------
1        | Juan Dela Cruz  | 14.23
2        | Maria Santos    | 14.56
3        | Pedro Reyes     | 15.01
4        | Anna Lopez      | 15.34
5        | Carlos Mendoza  | 15.72
6        | Isabelle Garcia | 16.08
```

Important:

The times are only visual/game values.

The actual ranking comes from the generated random result.

---

# Phase 24 — Race Again

Race Again:

- keep employees
- keep avatars
- keep settings
- clear previous race state
- generate a NEW random final result
- start another race

---

# Phase 25 — Edit Participants

This returns to setup mode.

Keep current employee list.

Allow:

- add
- edit
- delete
- change avatar

---

# Phase 26 — New Game

New Game resets:

- participants
- results
- race progress
- winner
- race state

Optional:

keep user preferences like:

```text
sound
track theme
duration
```

---

# Phase 27 — Reset Race

A Reset button can be available during setup.

Confirmation:

```text
Reset the current race?

Current results will be cleared.

Cancel | Reset
```

During a live race, it is better to ask for confirmation before stopping.

---

# Phase 28 — Responsive Design

## Desktop

Best layout:

```text
Full-width race track
```

Setup screen:

```text
Participants | Race Settings
```

## Tablet

Use:

```text
Participants
Settings
Race
```

stacked or 2-column where possible.

## Mobile

Use:

```text
Setup
↓
Race Track
↓
Results
```

The race lanes can horizontally scale to the device width.

---

# Phase 29 — Visual Direction

Recommended theme:

```text
Sporty
Colorful
Fun
Clean
Game-show style
```

Main colors:

```text
Red
Blue
Gold
White
Dark Navy
```

Use:

- rounded UI cards
- soft shadows
- strong race buttons
- gold winner accents
- animated background details

Avoid making every section overly decorated.

The race area should remain the main visual focus.

---

# Phase 30 — Track Themes

Version 1:

```text
Stadium Track
```

Future:

```text
Beach Race
City Race
Forest Race
Office Race
School Race
Christmas Race
Space Race
```

The game logic stays the same.

Only:

- background
- lane styling
- sound ambience

change.

---

# Phase 31 — Employee Character Improvement

This should be a later phase.

Options:

### Level 1

Generic runner + employee avatar.

### Level 2

Employee face attached to common running character.

### Level 3

Custom cartoon employee character.

### Level 4

Custom sprite animation for each employee.

Version 1 should start at Level 1 or Level 2.

This keeps the project manageable.

---

# Phase 32 — Asset Requirements

Minimum assets:

```text
1 stadium track background
1 finish line graphic
1 generic runner body / runner animation
employee avatars
1 trophy
podium graphics
confetti
```

Sounds:

```text
countdown beep
race start
running/crowd
finish
winner
button click
```

---

# Phase 33 — Fairness and Consistency

The app should guarantee:

- every employee appears exactly once
- no duplicated ranking positions
- result cannot change after race starts
- Race Again generates a new result
- animation always ends using the generated result

Optional:

Display a small note:

```text
Race order is randomly generated when the race starts.
```

This makes the game behavior transparent.

---

# Phase 34 — Optional Seeded Randomization

Future enhancement:

Use a race seed.

Example:

```text
Race ID: ER-02814
```

If the same participant list and seed are replayed, the same result can be reconstructed.

This is optional and not needed for Version 1.

---

# Phase 35 — Optional Race History

Later:

```text
Race #1
Winner: Maria

Race #2
Winner: Pedro

Race #3
Winner: Juan
```

Can be stored in:

```text
localStorage
```

No backend required.

---

# Phase 36 — Optional Fullscreen Mode

Recommended for office events.

Button:

```text
Fullscreen
```

Fullscreen hides configuration controls and makes the race occupy most of the display.

Useful for:

- office TV
- projector
- team event
- party
- raffle-style activity

---

# Phase 37 — Development Order

Recommended order:

```text
1. Project Setup
2. Static Setup UI
3. Participants CRUD
4. Race Settings
5. Race State
6. Random Result Generator
7. Countdown
8. Basic Race Track
9. Basic Runner Movement
10. Dynamic Speed Simulation
11. Final Stretch Control
12. Finish Logic
13. Winner Screen
14. Results Table
15. Race Again
16. Edit Participants
17. New Game
18. Sound
19. Confetti
20. Responsive UI
21. UI Polish
22. Custom Employee Character Improvements
```

---

# Phase 38 — Recommended MVP

The first playable MVP should include:

```text
Employee names
Employee avatars
15-second race
Stadium track
Countdown
Random final order
Moving runners
Overtaking effect
Fixed finishing result
Winner
Full ranking
Race Again
```

Once this works correctly, improve:

```text
employee likeness
sound
backgrounds
themes
advanced animations
```

---

# Final User Flow

```text
Open Game

↓
Add Employees

↓
Add / Select Employee Avatars

↓
Select Race Duration

↓
Start Race

↓
System Randomizes Complete Result

↓
3 - 2 - 1 - GO!

↓
Employees Race

↓
Speeds Change / Overtaking

↓
Final Stretch

↓
Finish Line

↓
Winner Celebration

↓
Complete Results

↓
Race Again / Edit Participants / New Game
```

---

# Final Architecture Principle

The project should separate:

```text
GAME RESULT LOGIC
```

from:

```text
VISUAL RACE ANIMATION
```

The result determines who finishes first.

The animation only creates the excitement of the race.

This separation will make the application easier to maintain, test, and improve later.
