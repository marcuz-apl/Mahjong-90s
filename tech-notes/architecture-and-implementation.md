# StreetMachine-Mahjong — Technical Notes

This document consolidates the **Implementation Plan** and **Refactoring Walkthrough** for the 90s Arcade Mahjong Game (大滿貫) web application.

---

## 1. Project Goal & Overview
The objective was to refactor the game from a single-file HTML monolith (`Mahjong_v1.html`) into a modern, modular **Next.js (App Router)** web application.
- **Local SVGs**: Configure the game to load the high-quality vector SVG assets from the local directory instead of relying on external CDNs.
- **SQLite3 Database**: Integrate a local SQLite database to persist scores, game history, and chips across play sessions for registered players.
- **User Registration & Guest Mode**: Provide a retro-arcade registration/login form. Guest players bypass SQLite database connections entirely to optimize queries and save database size (using client state and browser storage), while registered users save persistent histories in SQLite.
- **Git Hook & Auto-Versioning**: Mimic the pre-commit hook auto-versioning scheme from the sister project `ResoLogix`.

---

## 2. Tech Stack & Architecture

### System Core
- **Frontend**: Next.js 15 (React 19) + Vanilla CSS (for 3D visual transformations).
- **Backend**: Next.js serverless API routes running on Node.js.
- **Database**: SQLite3 (`better-sqlite3` native bindings for Node.js).
- **Asset Pipeline**: Static local folder served under `public/vectors/` containing all 34 tiles and flowers/seasons.

### Database Schema
We run a file-based SQLite database located at `data/mahjong-90s.db`.
- **`users`**:
  - `id` (TEXT, Primary Key) - Player custom username.
  - `created_at` (DATETIME) - Creation date.
  - `chips` (INTEGER, Default: 10,000) - Remaining chips.
  - `last_active` (DATETIME) - Activity tracking.
- **`game_records`**:
  - `id` (INTEGER, Primary Key Auto-Increment) - Record ID.
  - `user_id` (TEXT, Foreign Key) - Links to player profile.
  - `round` (INTEGER) - Round index.
  - `outcome` (TEXT: 'win', 'loss', 'draw') - Round result.
  - `score_change` (INTEGER) - Chips won or lost.
  - `yaku_details` (TEXT) - JSON string representing yaku details (han count, specific hands won).

---

## 3. Directory Layout & Module Structure

```
StreetMachine-Mahjong/
├── .git/
│   └── hooks/
│       └── pre-commit           # Auto-version bumping git hook
├── data/                        # SQLite Database directory
│   └── mahjong-90s.db           # SQLite Database file (Tracked in Git)
├── public/                      # Static Assets served by Next.js
│   └── vectors/                 # Standard and transparent SVG sets
├── scripts/
│   └── bump-version.js          # Package auto-versioning script
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── game/route.js    # Outcome persistence API
│   │   │   └── user/route.js    # Anonymous session management API
│   │   ├── global.css           # Vanilla styling, glowing gradients, 3D tiles
│   │   ├── layout.js            # Standard HTML Layout page
│   │   └── page.js              # Interactive React Board & Game loop orchestrator
│   ├── lib/
│   │   └── db.js                # SQLite better-sqlite3 wrapper & schema
│   └── utils/
│       └── mahjong.js           # Rule validator, Yaku scoring engine, and AI logic
├── .gitignore                   # Excludes node_modules, builds, etc. (Except SQLite DB)
├── jsconfig.json                # Configures absolute imports (@/* -> src/*)
├── next.config.js               # Externalizes better-sqlite3 from Webpack
└── package.json                 # Project dependencies & versions
```

---

## 4. Pre-Commit Hooks & Version Bumping
To maintain sister-project consistency with `ResoLogix`, we configured two Git hooks:
- **[bump-version.js](file:///root/projects/StreetMachine-Mahjong/scripts/bump-version.js)**: Runs in ESM. It increments the patch version following `m.n.p` rules (wrapping patch and minor numbers at 9) and updates `buildTime` (formatted as `build YYYY-MM-DD-HHMM`).
- **[pre-commit hook](file:///root/projects/StreetMachine-Mahjong/.git/hooks/pre-commit)**: Automatically triggers on `git commit`, running the node script and staging `package.json` before committing.
- **[prepare-commit-msg hook](file:///root/projects/StreetMachine-Mahjong/.git/hooks/prepare-commit-msg)**: Prepend the version number and build timestamp (e.g. `v1.0.5 build 2026-06-19-1145`) to the commit message automatically.

---

## 5. Verification & Testing

### Compilation Verification
Next.js successfully compiles production builds locally:
```bash
npm run build
# Compiled successfully in 3.2s
# Generating static pages (6/6)
```

### Database CRUD Verification
A mock testing program verified that all SQL statements run successfully:
```
Database initialized successfully.
--- Database Verification Test ---
1. Creating user...
Created user: { id: 'test-anonymous-user-uuid-12345', chips: 15000 }
2. Fetching user...
Fetched user: { id: 'test-anonymous-user-uuid-12345', chips: 15000 }
3. Updating chips...
Updated user chips: { id: 'test-anonymous-user-uuid-12345', chips: 14200 }
4. Saving game record...
Saved game record ID: 1
5. Retrieving game history...
Game history: [ { round: 1, outcome: 'win', score_change: 1200 } ]
--- Verification Complete ---
```

### Dynamic SVG Processing
At runtime, the browser preloads vector files from `/vectors/SVG/`. To align with our responsive CSS gradients:
- A regex pattern replaces `#f5f6f7` (the SVG's solid card back) and `#93989c` (flat border) with `transparent`.
- This converts the SVGs to transparent overlays, showing our premium CSS 3D ivory gradient backgrounds behind the symbols.
- Swapped file maps were corrected so winds and dragons match their correct SVGs:
  - Red Dragon (中) maps to `7z.svg`
  - Green Dragon (發) maps to `6z.svg`
  - White Dragon (白) maps to `5z.svg`

---

## 6. Key Optimization Plan, Workarounds & Custom Features

### React Hydration Mismatch Workarounds
During SSR and hydration steps, React warns if the server-rendered markup differs from the client-rendered DOM. We resolved this through three techniques:
1. **Deferred Client Rendering**: Added a `mounted` state in `page.js`. We perform `if (!mounted) return null;` at the top of the render layout. This prevents the server from outputting components that rely on local storage or dynamic client state.
2. **Standard font loading**: Manual Google Fonts `<link>` tags in the root layout were replaced with Next.js's native `next/font/google` asset pre-loader (`Noto_Sans_SC`), eliminating server-client font headers mismatches.
3. **Attribute warning suppression**: Added `suppressHydrationWarning` to the `<html>` and `<body>` tags in `layout.js` to prevent validation failures caused by browser translation engines or style-injecting extensions.

### Next.js Dev Badge Suppression Workaround
The floating Next.js 15 dev routing badge ("Big N" logo) in local environments was hidden through two layers of suppression:
1. **Configuration Overrides**: Configured `devIndicators: false` in `next.config.js` to disable routing and compilation overlays.
2. **CSS Pointer Overrides**: Added strict selectors (`nextjs-portal`, `#nextjs-portal`, `next-route-announcer`, `#nextjs-router-announcer`, `[data-nextjs-toast-wrapper]`, `.nextjs-static-indicator`) set to `display: none !important` at the end of `global.css` as a bulletproof styling layer.

### Game Difficulty Level Tuning Heuristic
The AI's playing strength is controlled by three settings:
- **Easy (簡單)**: AI has a 40% chance to discard a completely random tile instead of the worst heuristic tile. Probability to Pon/Kan drops to 10%, and Chi probability drops to 20%.
- **Normal (普通)**: AI has a 15% random discard chance. Pon/Kan probability is 30%; Chi probability is 50%.
- **Hard (困難)**: AI is 100% optimal (0% randomness). Pon/Kan probability is 50%; Chi probability is 80%.

### SQLite Access Optimization (Guest Mode)
To save processing overhead and limit database sizes, we separated play paths:
- **Registered Mode**: Standard forms take user handles (2-12 characters, checked on frontend/backend APIs). Hits server-side POST `/api/user` and `/api/game` endpoints to record chips and game logs.
- **Guest Mode**: Guest players bypass server-side endpoints entirely. Progress is saved locally in the browser's `localStorage` (`street_mahjong_guest_chips`), removing database query load.

### Discard Entrance & Heartbeat Animation (Play Assist)
To draw focus immediately to the newest discard:
- Preserved standard chronological, player-by-player layouts in the central pool (`#dPool`).
- Added a custom dual-animation sequence on the `.ld` class in `global.css` combining:
  1. A one-time dropdown scaling transition (`discPopIn` using a cubic-bezier curve).
  2. An infinite double-pulse rhythm (`heartBeat`) that physical scales the active tile to `1.16`, translates it upward by `8px` to float above adjacent tiles, and applies a rapid neon-pink heartbeat shadow pulse.
- Configured a floating layer override (`z-index: 10 !important`) on the active discard tile to ensure it sits on top of all surrounding elements.

### Playtable Exit & Quit Button
To allow players to exit gameplay rounds back to the start screen:
- Added a retro crimson-red styled `quitBtn` to the `topBar`.
- Configured a safe clean teardown handler (`handleQuitClick`) that sets game loop runner to false (`g.running = false`) and immediately resolves pending Promise callbacks for player discard and action selections with fallback default values, terminating async loops cleanly.



