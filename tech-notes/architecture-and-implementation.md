# StreetMachine-Mahjong — Technical Notes

This document consolidates the **Implementation Plan** and **Refactoring Walkthrough** for the 90s Arcade Mahjong Game (大滿貫) web application.

---

## 1. Project Goal & Overview
The objective was to refactor the game from a single-file HTML monolith (`Mahjong_v1.html`) into a modern, modular **Next.js (App Router)** web application.
- **Local SVGs**: Configure the game to load the high-quality vector SVG assets from the local directory instead of relying on external CDNs.
- **SQLite3 Database**: Integrate a local SQLite database to persist scores, game history, and chips across play sessions.
- **Anonymous Tracking**: Store a unique client ID (UUID) in `localStorage` to identify guest players without forcing a registration or login screen.
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
  - `id` (TEXT, Primary Key) - Browser-generated UUID.
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

## 4. Pre-Commit Hook & Version Bumping
To maintain sister-project consistency with `ResoLogix`, we configured an automated pre-commit version bumper:
- **[bump-version.js](file:///root/projects/StreetMachine-Mahjong/scripts/bump-version.js)**: Runs in ESM. It increments the patch version following `m.n.p` rules (wrapping patch and minor numbers at 9) and updates `buildTime` (formatted as `build YYYY-MM-DD-HHMM`).
- **[pre-commit hook](file:///root/projects/StreetMachine-Mahjong/.git/hooks/pre-commit)**: Automatically triggers on `git commit`, running the node script and staging `package.json` before committing.

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
