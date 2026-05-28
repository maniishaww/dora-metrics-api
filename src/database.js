const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'dora.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS deployments (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    environment TEXT NOT NULL,
    status TEXT NOT NULL,
    lead_time_minutes REAL,
    commit_hash TEXT
  );

  CREATE TABLE IF NOT EXISTS incidents (
    id TEXT PRIMARY KEY,
    started_at TEXT NOT NULL,
    resolved_at TEXT,
    caused_by_deployment INTEGER DEFAULT 0,
    severity TEXT DEFAULT 'medium'
  );
`);

module.exports = db;