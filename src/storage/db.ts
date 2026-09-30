import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

/**
 * Inicialização e migração do banco SQLite nativo (WAL mode) do IdeaBank.
 */
export function initDatabase(customPath: string = "ideabank.db"): DatabaseSync {
  if (customPath !== ":memory:") {
    const dbDir = path.dirname(path.resolve(customPath));
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
  }

  const db = new DatabaseSync(customPath);

  if (customPath !== ":memory:") {
    db.exec("PRAGMA journal_mode = WAL;");
    db.exec("PRAGMA synchronous = NORMAL;");
  }
  db.exec("PRAGMA foreign_keys = ON;");

  createTables(db);
  return db;
}

function createTables(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ideas (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      problem_statement TEXT NOT NULL,
      proposed_solution TEXT NOT NULL,
      target_audience TEXT NOT NULL,
      upvotes INTEGER DEFAULT 1,
      downvotes INTEGER DEFAULT 0,
      gravity_score REAL DEFAULT 0,
      status TEXT DEFAULT 'open',
      github_issue_url TEXT,
      author_name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS votes (
      id TEXT PRIMARY KEY,
      idea_id TEXT NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
      client_fingerprint TEXT NOT NULL,
      vote_type INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(idea_id, client_fingerprint)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      idea_id TEXT NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
      author_name TEXT NOT NULL,
      comment_text TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_ideas_gravity ON ideas(gravity_score DESC);
    CREATE INDEX IF NOT EXISTS idx_ideas_created_at ON ideas(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_ideas_category ON ideas(category);
    CREATE INDEX IF NOT EXISTS idx_ideas_status ON ideas(status);
    CREATE INDEX IF NOT EXISTS idx_votes_idea ON votes(idea_id);
    CREATE INDEX IF NOT EXISTS idx_comments_idea ON comments(idea_id);
  `);
}
