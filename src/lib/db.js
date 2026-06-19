import Database from 'better-sqlite3';
import path from 'path';

// Store the SQLite DB in the project root
const DB_PATH = path.join(process.cwd(), 'db.sqlite');

let db;

try {
  db = new Database(DB_PATH);
  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Initialize Schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      chips INTEGER DEFAULT 10000,
      last_active DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS game_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      round INTEGER,
      outcome TEXT CHECK(outcome IN ('win', 'loss', 'draw')),
      score_change INTEGER,
      yaku_details TEXT, -- JSON string representing yaku & fan
      played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
  console.log('Database initialized successfully.');
} catch (error) {
  console.error('Failed to initialize database:', error);
}

// Database helper functions
export function getUser(userId) {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  return stmt.get(userId);
}

export function createUser(userId, initialChips = 10000) {
  const stmt = db.prepare('INSERT INTO users (id, chips) VALUES (?, ?)');
  stmt.run(userId, initialChips);
  return { id: userId, chips: initialChips };
}

export function updateUserChips(userId, newChips) {
  const stmt = db.prepare('UPDATE users SET chips = ?, last_active = CURRENT_TIMESTAMP WHERE id = ?');
  stmt.run(newChips, userId);
  return { id: userId, chips: newChips };
}

export function saveGameRecord(userId, round, outcome, scoreChange, yakuDetails) {
  const stmt = db.prepare(`
    INSERT INTO game_records (user_id, round, outcome, score_change, yaku_details)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    userId,
    round,
    outcome,
    scoreChange,
    yakuDetails ? JSON.stringify(yakuDetails) : null
  );
  return result.lastInsertRowid;
}

export function getGameHistory(userId, limit = 20) {
  const stmt = db.prepare(`
    SELECT round, outcome, score_change, yaku_details, played_at
    FROM game_records
    WHERE user_id = ?
    ORDER BY played_at DESC
    LIMIT ?
  `);
  const records = stmt.all(userId, limit);
  return records.map(r => ({
    ...r,
    yaku_details: r.yaku_details ? JSON.parse(r.yaku_details) : null
  }));
}

export default db;
