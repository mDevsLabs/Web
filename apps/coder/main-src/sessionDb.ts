import * as fs from "node:fs";
import * as path from "node:path";
import Database from "better-sqlite3";
import { getCachedMaiDataDir } from "./dataDir.js";

let db: Database.Database | null = null;

function getDbPath(): string {
  return path.join(getCachedMaiDataDir(), "session.db");
}

function initSchema(dbInstance: Database.Database): void {
  // 会话表
  dbInstance.exec(`
		CREATE TABLE IF NOT EXISTS sessions (
			id TEXT PRIMARY KEY,
			workspace_root TEXT,
			created_at INTEGER,
			updated_at INTEGER,
			message_count INTEGER DEFAULT 0,
			tool_call_count INTEGER DEFAULT 0
		)
	`);

  // 消息 FTS5 虚拟表（全文搜索）
  dbInstance.exec(`
		CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts USING fts5(
			session_id,
			role,
			content,
			tool_name,
			created_at
		)
	`);

  // Dialectic 结论表
  dbInstance.exec(`
		CREATE TABLE IF NOT EXISTS conclusions (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			session_id TEXT,
			workspace_root TEXT,
			category TEXT,
			insight TEXT,
			confidence REAL DEFAULT 1.0,
			created_at INTEGER,
			FOREIGN KEY (session_id) REFERENCES sessions(id)
		)
	`);

  // 关系演进时间线
  dbInstance.exec(`
		CREATE TABLE IF NOT EXISTS relationship_timeline (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			session_id TEXT,
			workspace_root TEXT,
			turn_number INTEGER,
			trust_score REAL DEFAULT 0.5,
			collaboration_efficiency REAL DEFAULT 0.5,
			user_satisfaction REAL DEFAULT 0.5,
			milestone TEXT,
			created_at INTEGER,
			FOREIGN KEY (session_id) REFERENCES sessions(id)
		)
	`);

  // 索引（FTS5 虚拟表 messages_fts 自带全文索引，无需额外 B-tree 索引）
  dbInstance.exec(`
		CREATE INDEX IF NOT EXISTS idx_conclusions_session ON conclusions(session_id);
		CREATE INDEX IF NOT EXISTS idx_conclusions_category ON conclusions(category);
		CREATE INDEX IF NOT EXISTS idx_timeline_session ON relationship_timeline(session_id);
	`);
}

export function getSessionDb(): Database.Database {
  if (!db) {
    const dbPath = getDbPath();
    try {
      fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    } catch (e) {
      console.error("[sessionDb] mkdir failed:", e);
    }
    try {
      db = new Database(dbPath);
    } catch (e) {
      console.error("[sessionDb] open failed:", e);
      throw e;
    }
    try {
      db.pragma("journal_mode = WAL");
      db.pragma("busy_timeout = 5000");
    } catch (e) {
      console.error("[sessionDb] pragma failed:", e);
    }
    try {
      initSchema(db);
    } catch (e) {
      console.error("[sessionDb] initSchema failed:", e);
      throw e;
    }
  }
  return db;
}

export function closeSessionDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

// === 会话管理 ===

export function upsertSession(params: {
  id: string;
  workspaceRoot: string | null;
  messageCount: number;
  toolCallCount: number;
}): void {
  const database = getSessionDb();
  const now = Date.now();
  database
    .prepare(
      `INSERT INTO sessions (id, workspace_root, created_at, updated_at, message_count, tool_call_count)
		 VALUES (@id, @workspaceRoot, @createdAt, @updatedAt, @messageCount, @toolCallCount)
		 ON CONFLICT(id) DO UPDATE SET
			updated_at = @updatedAt,
			message_count = @messageCount,
			tool_call_count = @toolCallCount`
    )
    .run({
      createdAt: now,
      id: params.id,
      messageCount: params.messageCount,
      toolCallCount: params.toolCallCount,
      updatedAt: now,
      workspaceRoot: params.workspaceRoot ?? "",
    });
}

// === 消息 FTS5 ===

export function insertMessage(params: {
  sessionId: string;
  role: string;
  content: string;
  toolName?: string | null;
  createdAt?: number;
}): void {
  const database = getSessionDb();
  database
    .prepare(
      `INSERT INTO messages_fts (session_id, role, content, tool_name, created_at)
		 VALUES (@sessionId, @role, @content, @toolName, @createdAt)`
    )
    .run({
      content: params.content.slice(0, 50_000),
      createdAt: params.createdAt ?? Date.now(),
      role: params.role,
      sessionId: params.sessionId,
      toolName: params.toolName ?? "",
    });
}

export function syncThreadMessages(
  sessionId: string,
  workspaceRoot: string | null,
  messages: { role: string; content: string }[],
  toolCallCount: number
): void {
  const database = getSessionDb();
  // Transaction unique DELETE + INSERT + upsert: crash entre les deux ne vide plus le FTS.
  const syncTx = database.transaction(
    (msgs: { role: string; content: string }[]) => {
      database
        .prepare("DELETE FROM messages_fts WHERE session_id = ?")
        .run(sessionId);
      const insert = database.prepare(
        "INSERT INTO messages_fts (session_id, role, content, tool_name, created_at) VALUES (?, ?, ?, ?, ?)"
      );
      for (const m of msgs) {
        insert.run(
          sessionId,
          m.role,
          m.content.slice(0, 50_000),
          "",
          Date.now()
        );
      }
      const now = Date.now();
      database
        .prepare(
          `INSERT INTO sessions (id, workspace_root, created_at, updated_at, message_count, tool_call_count)
			 VALUES (@id, @workspaceRoot, @createdAt, @updatedAt, @messageCount, @toolCallCount)
			 ON CONFLICT(id) DO UPDATE SET updated_at = @updatedAt, message_count = @messageCount, tool_call_count = @toolCallCount`
        )
        .run({
          createdAt: now,
          id: sessionId,
          messageCount: msgs.length,
          toolCallCount,
          updatedAt: now,
          workspaceRoot: workspaceRoot ?? "",
        });
    }
  );
  syncTx(messages);
}

export type FtsSearchResult = {
  sessionId: string;
  role: string;
  content: string;
  rank: number;
};

export function searchSessionHistory(
  query: string,
  limit = 10
): FtsSearchResult[] {
  const database = getSessionDb();
  const safeLimit = Math.max(1, Math.min(50, Math.floor(limit) || 10));
  // Sanitize FTS5 query: quote special chars to avoid syntax throw (", *, OR...).
  const sanitized = String(query ?? "")
    .slice(0, 500)
    .replace(/["*():^]/g, " ")
    .trim();
  if (!sanitized) return [];
  let ftsQuery: string;
  try {
    // Phrase query with prefix: "each token"* — safe against FTS5 syntax errors.
    const tokens = sanitized
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 10)
      .map((t) => `"${t.replace(/"/g, '""')}"*`);
    ftsQuery = tokens.length
      ? tokens.join(" ")
      : `"${sanitized.replace(/"/g, '""')}"`;
  } catch {
    return [];
  }
  try {
    const results = database
      .prepare(
        `SELECT session_id, role, content, rank
				 FROM messages_fts
				 WHERE messages_fts MATCH @query
				 ORDER BY rank
				 LIMIT @limit`
      )
      .all({ limit: safeLimit, query: ftsQuery }) as Array<{
      session_id: string;
      role: string;
      content: string;
      rank: number;
    }>;
    return results.map((r) => ({
      content: r.content,
      rank: r.rank,
      role: r.role,
      sessionId: r.session_id,
    }));
  } catch (e) {
    console.error("[sessionDb] FTS search failed:", e);
    return [];
  }
}

// === Dialectic 结论 ===

export function saveConclusion(params: {
  sessionId: string;
  workspaceRoot: string | null;
  category: string;
  insight: string;
  confidence?: number;
}): void {
  const database = getSessionDb();
  database
    .prepare(
      `INSERT INTO conclusions (session_id, workspace_root, category, insight, confidence, created_at)
		 VALUES (@sessionId, @workspaceRoot, @category, @insight, @confidence, @createdAt)`
    )
    .run({
      category: params.category,
      confidence: params.confidence ?? 1.0,
      createdAt: Date.now(),
      insight: params.insight,
      sessionId: params.sessionId,
      workspaceRoot: params.workspaceRoot ?? "",
    });
}

export type Conclusion = {
  category: string;
  insight: string;
  confidence: number;
  createdAt: number;
};

export function getRecentConclusions(
  workspaceRoot: string | null,
  limit = 20
): Conclusion[] {
  const database = getSessionDb();
  const results = database
    .prepare(
      `SELECT category, insight, confidence, created_at
			 FROM conclusions
			 WHERE workspace_root = @workspaceRoot
			 ORDER BY created_at DESC
			 LIMIT @limit`
    )
    .all({
      limit,
      workspaceRoot: workspaceRoot ?? "",
    }) as Array<{
    category: string;
    insight: string;
    confidence: number;
    created_at: number;
  }>;
  return results.map((r) => ({
    category: r.category,
    confidence: r.confidence,
    createdAt: r.created_at,
    insight: r.insight,
  }));
}

// === 关系演进时间线 ===

export function recordRelationshipMilestone(params: {
  sessionId: string;
  workspaceRoot: string | null;
  turnNumber: number;
  trustScore?: number;
  collaborationEfficiency?: number;
  userSatisfaction?: number;
  milestone?: string;
}): void {
  const database = getSessionDb();
  database
    .prepare(
      `INSERT INTO relationship_timeline
		 (session_id, workspace_root, turn_number, trust_score, collaboration_efficiency, user_satisfaction, milestone, created_at)
		 VALUES (@sessionId, @workspaceRoot, @turnNumber, @trustScore, @collaborationEfficiency, @userSatisfaction, @milestone, @createdAt)`
    )
    .run({
      collaborationEfficiency: params.collaborationEfficiency ?? 0.5,
      createdAt: Date.now(),
      milestone: params.milestone ?? "",
      sessionId: params.sessionId,
      trustScore: params.trustScore ?? 0.5,
      turnNumber: params.turnNumber,
      userSatisfaction: params.userSatisfaction ?? 0.5,
      workspaceRoot: params.workspaceRoot ?? "",
    });
}

export type RelationshipSnapshot = {
  turnNumber: number;
  trustScore: number;
  collaborationEfficiency: number;
  userSatisfaction: number;
  milestone: string;
  createdAt: number;
};

export function getRelationshipTimeline(
  sessionId: string,
  limit = 50
): RelationshipSnapshot[] {
  const database = getSessionDb();
  const results = database
    .prepare(
      `SELECT turn_number, trust_score, collaboration_efficiency, user_satisfaction, milestone, created_at
			 FROM relationship_timeline
			 WHERE session_id = @sessionId
			 ORDER BY turn_number ASC
			 LIMIT @limit`
    )
    .all({ limit, sessionId }) as Array<{
    turn_number: number;
    trust_score: number;
    collaboration_efficiency: number;
    user_satisfaction: number;
    milestone: string;
    created_at: number;
  }>;
  return results.map((r) => ({
    collaborationEfficiency: r.collaboration_efficiency,
    createdAt: r.created_at,
    milestone: r.milestone,
    trustScore: r.trust_score,
    turnNumber: r.turn_number,
    userSatisfaction: r.user_satisfaction,
  }));
}

export function getLatestRelationshipSnapshot(
  sessionId: string
): RelationshipSnapshot | null {
  const database = getSessionDb();
  const result = database
    .prepare(
      `SELECT turn_number, trust_score, collaboration_efficiency, user_satisfaction, milestone, created_at
			 FROM relationship_timeline
			 WHERE session_id = @sessionId
			 ORDER BY turn_number DESC
			 LIMIT 1`
    )
    .get({ sessionId }) as
    | {
        turn_number: number;
        trust_score: number;
        collaboration_efficiency: number;
        user_satisfaction: number;
        milestone: string;
        created_at: number;
      }
    | undefined;
  if (!result) return null;
  return {
    collaborationEfficiency: result.collaboration_efficiency,
    createdAt: result.created_at,
    milestone: result.milestone,
    trustScore: result.trust_score,
    turnNumber: result.turn_number,
    userSatisfaction: result.user_satisfaction,
  };
}
