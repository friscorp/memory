// SQLite storage implementation

import Database from 'better-sqlite3';
import { dirname } from 'path';
import { mkdirSync } from 'fs';
import { randomUUID } from 'crypto';
import type { Store, StoredSession, StoredEvent, StoredArtifact } from './types.js';

// Inline schema to avoid file path issues at runtime
const SCHEMA_SQL = `
-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  session_id TEXT PRIMARY KEY,
  state_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sessions_updated ON sessions(updated_at);

-- Events table  
CREATE TABLE IF NOT EXISTS events (
  event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('user_message','repo_diff','snippet','doc_chunk','tool_output','assistant_response')),
  payload_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_session_type ON events(session_id, type);
CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at);

-- Artifacts table
CREATE TABLE IF NOT EXISTS artifacts (
  artifact_id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('repo_diff','snippet','doc_chunk','tool_output')),
  source TEXT NOT NULL,
  version_hash TEXT NOT NULL,
  content TEXT NOT NULL,
  meta_json TEXT,
  pinned INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_artifacts_session ON artifacts(session_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_session_kind ON artifacts(session_id, kind);
CREATE INDEX IF NOT EXISTS idx_artifacts_pinned ON artifacts(session_id, pinned);
CREATE INDEX IF NOT EXISTS idx_artifacts_created ON artifacts(created_at);
`;

export class SqliteStore implements Store {
    private db: Database.Database;

    constructor(dbPath: string) {
        try {
            // Ensure directory exists
            const dir = dirname(dbPath);
            mkdirSync(dir, { recursive: true });

            // Open database connection
            this.db = new Database(dbPath);
            this.db.pragma('journal_mode = WAL');
            this.db.pragma('foreign_keys = ON');
        } catch (error) {
            throw new Error(`Failed to open SQLite database at ${dbPath}: ${error}`);
        }
    }

    init(): void {
        try {
            // Initialize schema from inline SQL
            this.db.exec(SCHEMA_SQL);
        } catch (error) {
            throw new Error(`Failed to initialize database schema: ${error}`);
        }
    }

    getSession(sessionId: string): StoredSession | null {
        try {
            const stmt = this.db.prepare('SELECT * FROM sessions WHERE session_id = ?');
            const result = stmt.get(sessionId);
            return result as StoredSession | null;
        } catch (error) {
            throw new Error(`Failed to get session ${sessionId}: ${error}`);
        }
    }

    upsertSession(sessionId: string, stateJson: string): void {
        try {
            const stmt = this.db.prepare(`
        INSERT INTO sessions (session_id, state_json, created_at, updated_at)
        VALUES (?, ?, datetime('now'), datetime('now'))
        ON CONFLICT(session_id) DO UPDATE SET
          state_json = excluded.state_json,
          updated_at = datetime('now')
      `);
            stmt.run(sessionId, stateJson);
        } catch (error) {
            throw new Error(`Failed to upsert session ${sessionId}: ${error}`);
        }
    }

    appendEvent(sessionId: string, type: string, payload: Record<string, any>): number {
        try {
            const stmt = this.db.prepare(`
        INSERT INTO events (session_id, type, payload_json)
        VALUES (?, ?, ?)
      `);
            const result = stmt.run(sessionId, type, JSON.stringify(payload));
            return result.lastInsertRowid as number;
        } catch (error) {
            throw new Error(`Failed to append event for session ${sessionId}: ${error}`);
        }
    }

    listRecentEvents(sessionId: string, types?: string[], limit: number = 100): StoredEvent[] {
        try {
            let sql: string;
            let params: any[];

            if (types && types.length > 0) {
                const placeholders = types.map(() => '?').join(',');
                sql = `SELECT * FROM events WHERE session_id = ? AND type IN (${placeholders}) ORDER BY created_at DESC LIMIT ?`;
                params = [sessionId, ...types, limit];
            } else {
                sql = 'SELECT * FROM events WHERE session_id = ? ORDER BY created_at DESC LIMIT ?';
                params = [sessionId, limit];
            }

            const stmt = this.db.prepare(sql);
            return stmt.all(...params) as StoredEvent[];
        } catch (error) {
            throw new Error(`Failed to list events for session ${sessionId}: ${error}`);
        }
    }

    putArtifact(
        sessionId: string,
        kind: string,
        source: string,
        versionHash: string,
        content: string,
        meta?: Record<string, any>,
        pinned: boolean = false
    ): string {
        try {
            const artifactId = randomUUID();
            const metaJson = meta ? JSON.stringify(meta) : null;

            const stmt = this.db.prepare(`
        INSERT INTO artifacts (artifact_id, session_id, kind, source, version_hash, content, meta_json, pinned)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
            stmt.run(artifactId, sessionId, kind, source, versionHash, content, metaJson, pinned ? 1 : 0);

            return artifactId;
        } catch (error) {
            throw new Error(`Failed to put artifact for session ${sessionId}: ${error}`);
        }
    }

    listRecentArtifacts(sessionId: string, kinds?: string[], limit: number = 50): StoredArtifact[] {
        try {
            let sql: string;
            let params: any[];

            if (kinds && kinds.length > 0) {
                const placeholders = kinds.map(() => '?').join(',');
                sql = `SELECT * FROM artifacts WHERE session_id = ? AND kind IN (${placeholders}) ORDER BY rowid DESC LIMIT ?`;
                params = [sessionId, ...kinds, limit];
            } else {
                sql = 'SELECT * FROM artifacts WHERE session_id = ? ORDER BY rowid DESC LIMIT ?';
                params = [sessionId, limit];
            }

            const stmt = this.db.prepare(sql);
            return stmt.all(...params) as StoredArtifact[];
        } catch (error) {
            throw new Error(`Failed to list artifacts for session ${sessionId}: ${error}`);
        }
    }

    close(): void {
        try {
            this.db.close();
        } catch (error) {
            throw new Error(`Failed to close database: ${error}`);
        }
    }
}

export function createSqliteStore(dbPath: string): Store {
    const store = new SqliteStore(dbPath);
    store.init();
    return store;
}
