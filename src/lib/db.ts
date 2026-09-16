import fs from "node:fs";
import path from "node:path";
import { createClient, type Client, type InValue } from "@libsql/client";

let client: Client | null = null;
let ready: Promise<void> | null = null;

function dbPath() {
  const dir = path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, "in-ai.db").replace(/\\/g, "/");
}

export function getDb(): Client {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL;
    if (url) {
      client = createClient({
        url,
        authToken: process.env.TURSO_AUTH_TOKEN,
      });
    } else if (process.env.VERCEL) {
      throw new Error(
        "Production needs a Turso database. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN.",
      );
    } else {
      client = createClient({ url: `file:${dbPath()}` });
    }
  }
  return client;
}

export async function query<T = Record<string, unknown>>(
  sql: string,
  args: InValue[] = [],
): Promise<T[]> {
  const result = await getDb().execute({ sql, args });
  return result.rows as unknown as T[];
}

export async function execute(sql: string, args: InValue[] = []) {
  return getDb().execute({ sql, args });
}

export async function ensureDb() {
  if (!ready) ready = migrate();
  await ready;
}

async function migrate() {
  const db = getDb();
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      api_key_enc TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      mode TEXT NOT NULL DEFAULT 'work',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      role TEXT NOT NULL,
      parts_json TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS memories (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      kind TEXT NOT NULL,
      content TEXT NOT NULL,
      source TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS skills (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      body TEXT NOT NULL,
      uses INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      filename TEXT,
      mime TEXT,
      text TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chunks (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      chunk_index INTEGER NOT NULL,
      content TEXT NOT NULL,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS topics (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      mastery INTEGER NOT NULL DEFAULT 0,
      last_reviewed_at INTEGER,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS flashcards (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      topic_id TEXT,
      front TEXT NOT NULL,
      back TEXT NOT NULL,
      ease REAL NOT NULL DEFAULT 2.5,
      interval_days INTEGER NOT NULL DEFAULT 1,
      reps INTEGER NOT NULL DEFAULT 0,
      due_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS research_reports (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      query TEXT NOT NULL,
      content TEXT NOT NULL,
      sources_json TEXT NOT NULL DEFAULT '[]',
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      prefix TEXT NOT NULL,
      key_hash TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL,
      last_used_at INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS media (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      kind TEXT NOT NULL,
      prompt TEXT NOT NULL,
      mime TEXT NOT NULL,
      data TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id, updated_at);
    CREATE INDEX IF NOT EXISTS idx_messages_convo ON messages(conversation_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_memories_user ON memories(user_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_skills_user ON skills(user_id);
    CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);
    CREATE INDEX IF NOT EXISTS idx_chunks_doc ON chunks(document_id);
    CREATE INDEX IF NOT EXISTS idx_topics_user ON topics(user_id);
    CREATE INDEX IF NOT EXISTS idx_cards_user_due ON flashcards(user_id, due_at);
    CREATE INDEX IF NOT EXISTS idx_reports_user ON research_reports(user_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
    CREATE INDEX IF NOT EXISTS idx_media_user ON media(user_id, created_at);
  `);

  try {
    await db.execute(
      "CREATE VIRTUAL TABLE IF NOT EXISTS knowledge_fts USING fts5(content, chunk_id UNINDEXED, user_id UNINDEXED)",
    );
    await db.execute(
      "CREATE VIRTUAL TABLE IF NOT EXISTS memory_fts USING fts5(content, memory_id UNINDEXED, user_id UNINDEXED)",
    );
  } catch (error) {
    console.warn("FTS5 unavailable, falling back to LIKE search", error);
  }
}
