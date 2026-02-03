-- SQLite schema for memory-runtime

-- Sessions table: stores session state as JSON
CREATE TABLE IF NOT EXISTS sessions (
  session_id TEXT PRIMARY KEY,
  state_json TEXT NOT NULL DEFAULT '{"constraints":[],"decisions":[],"openThreads":[],"glossary":[]}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Events table: append-only log of all events
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('user_message', 'repo_diff', 'snippet', 'doc_chunk', 'tool_output', 'assistant_response')),
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_events_session_id ON events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_session_type ON events(session_id, type);

-- Artifacts table: stores evidence (diffs, snippets, docs)
CREATE TABLE IF NOT EXISTS artifacts (
  artifact_id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('repo_diff', 'snippet', 'doc_chunk', 'tool_output')),
  source TEXT NOT NULL,
  version_hash TEXT NOT NULL,
  content TEXT NOT NULL,
  meta_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_artifacts_session_id ON artifacts(session_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_kind ON artifacts(kind);
CREATE INDEX IF NOT EXISTS idx_artifacts_source ON artifacts(source);
CREATE INDEX IF NOT EXISTS idx_artifacts_created_at ON artifacts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_artifacts_session_kind ON artifacts(session_id, kind);
