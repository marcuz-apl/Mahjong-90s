import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Store the SQLite DB in data/mahjong-90s.db
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const DB_PATH = path.join(DATA_DIR, 'mahjong-90s.db');

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

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  // Seed default settings if they don't exist
  const defaultSettings = {
    default_start_chips: '10000',
    ai_pon_rate_easy: '0.1',
    ai_pon_rate_normal: '0.3',
    ai_pon_rate_hard: '0.5',
    ai_chi_rate_easy: '0.2',
    ai_chi_rate_normal: '0.5',
    ai_chi_rate_hard: '0.8',
    ai_randomness_easy: '0.4',
    ai_randomness_normal: '0.15',
    ai_randomness_hard: '0.0',
    tiankai_peek_type: 'limited',
    big_hand_rate: '0.0'
  };
  const insertStmt = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  for (const [k, v] of Object.entries(defaultSettings)) {
    insertStmt.run(k, v);
  }

  console.log('Database initialized successfully.');
} catch (error) {
  console.error('Failed to initialize database:', error);
}

// Database helper functions
export function getUser(userId) {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  return stmt.get(userId);
}

export function createUser(userId) {
  const startChipsStr = getSetting('default_start_chips') || '10000';
  const initialChips = parseInt(startChipsStr, 10);
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

export function getSettings() {
  const stmt = db.prepare('SELECT * FROM settings');
  const rows = stmt.all();
  const settings = {};
  rows.forEach(r => {
    settings[r.key] = r.value;
  });
  return settings;
}

export function getSetting(key) {
  const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
  const row = stmt.get(key);
  return row ? row.value : null;
}

export function updateSetting(key, value) {
  const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  stmt.run(key, value.toString());
  return { key, value };
}

export function getAllUsers() {
  const stmt = db.prepare(`
    SELECT u.id, u.created_at, u.chips, u.last_active,
           COUNT(g.id) as games_played,
           SUM(CASE WHEN g.outcome = 'win' THEN 1 ELSE 0 END) as wins
    FROM users u
    LEFT JOIN game_records g ON u.id = g.user_id
    GROUP BY u.id
    ORDER BY u.last_active DESC
  `);
  return stmt.all();
}

export function deleteUser(userId) {
  const stmt = db.prepare('DELETE FROM users WHERE id = ?');
  stmt.run(userId);
  return { id: userId };
}

export function getAdminStats() {
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const totalGames = db.prepare('SELECT COUNT(*) as count FROM game_records').get().count;
  const totalChips = db.prepare('SELECT SUM(chips) as sum FROM users').get().sum || 0;

  const outcomes = db.prepare('SELECT outcome, COUNT(*) as count FROM game_records GROUP BY outcome').all();
  const winCount = outcomes.find(o => o.outcome === 'win')?.count || 0;
  const lossCount = outcomes.find(o => o.outcome === 'loss')?.count || 0;
  const drawCount = outcomes.find(o => o.outcome === 'draw')?.count || 0;

  const recentRecordsStmt = db.prepare(`
    SELECT r.id, r.user_id, r.round, r.outcome, r.score_change, r.played_at, r.yaku_details
    FROM game_records r
    ORDER BY r.played_at DESC
    LIMIT 20
  `);
  const recentRecords = recentRecordsStmt.all().map(r => ({
    ...r,
    yaku_details: r.yaku_details ? JSON.parse(r.yaku_details) : null
  }));

  return {
    totalUsers,
    totalGames,
    totalChips,
    winCount,
    lossCount,
    drawCount,
    recentRecords
  };
}

export default db;
