import fs from "node:fs";
import path from "node:path";
import { ensureDb, execute, query } from "../db";
import { knowledgeDir, notesDir, safeName } from "../paths";
import { chunkText, ftsQuery, now } from "../text";

export async function searchMemories(userId: string, q: string, limit = 8) {
  await ensureDb();
  const match = ftsQuery(q);
  if (match) {
    try {
      const rows = await query<{ content: string; kind: string; created_at: number }>(
        `SELECT m.content, m.kind, m.created_at
         FROM memory_fts f JOIN memories m ON m.id = f.memory_id
         WHERE memory_fts MATCH ? AND f.user_id = ?
         LIMIT ?`,
        [match, userId, limit],
      );
      if (rows.length) return rows;
    } catch {
      // fall through
    }
  }
  return query<{ content: string; kind: string; created_at: number }>(
    `SELECT content, kind, created_at FROM memories
     WHERE user_id = ? AND content LIKE ?
     ORDER BY created_at DESC LIMIT ?`,
    [userId, `%${q}%`, limit],
  );
}

export async function saveMemory(input: {
  userId: string;
  kind: string;
  content: string;
  source?: string;
}) {
  await ensureDb();
  const id = crypto.randomUUID();
  const created = now();
  await execute(
    "INSERT INTO memories (id, user_id, kind, content, source, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    [id, input.userId, input.kind, input.content, input.source ?? null, created],
  );
  try {
    await execute(
      "INSERT INTO memory_fts (content, memory_id, user_id) VALUES (?, ?, ?)",
      [input.content, id, input.userId],
    );
  } catch {
    // FTS optional
  }
  return { id };
}

export async function listMemories(userId: string, limit = 80) {
  await ensureDb();
  return query<{
    id: string;
    kind: string;
    content: string;
    source: string | null;
    created_at: number;
  }>(
    "SELECT id, kind, content, source, created_at FROM memories WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
    [userId, limit],
  );
}

export async function deleteMemory(userId: string, id: string) {
  await ensureDb();
  await execute("DELETE FROM memories WHERE id = ? AND user_id = ?", [id, userId]);
}

export async function searchKnowledge(userId: string, q: string, limit = 8) {
  await ensureDb();
  const match = ftsQuery(q);
  if (match) {
    try {
      const rows = await query<{
        content: string;
        title: string;
        document_id: string;
      }>(
        `SELECT c.content, d.title, d.id as document_id
         FROM knowledge_fts f
         JOIN chunks c ON c.id = f.chunk_id
         JOIN documents d ON d.id = c.document_id
         WHERE knowledge_fts MATCH ? AND f.user_id = ?
         LIMIT ?`,
        [match, userId, limit],
      );
      if (rows.length) return rows;
    } catch {
      // fall through
    }
  }
  return query<{ content: string; title: string; document_id: string }>(
    `SELECT c.content, d.title, d.id as document_id
     FROM chunks c JOIN documents d ON d.id = c.document_id
     WHERE d.user_id = ? AND c.content LIKE ?
     LIMIT ?`,
    [userId, `%${q}%`, limit],
  );
}

export async function ingestDocument(input: {
  userId: string;
  title: string;
  filename?: string;
  mime?: string;
  text: string;
  bytes?: Buffer;
}) {
  await ensureDb();
  const id = crypto.randomUUID();
  const created = now();
  const name = safeName(input.filename || `${input.title}.md`);
  const filePath = input.bytes
    ? path.join(knowledgeDir(), `${id}-${name}`)
    : path.join(notesDir(), `${id}-${safeName(input.title)}.md`);
  fs.writeFileSync(filePath, input.bytes ?? input.text, input.bytes ? undefined : "utf8");
  await execute(
    "INSERT INTO documents (id, user_id, title, filename, mime, text, created_at, file_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [
      id,
      input.userId,
      input.title,
      input.filename ?? name,
      input.mime ?? null,
      input.text,
      created,
      filePath,
    ],
  );
  const chunks = chunkText(input.text);
  for (const [i, content] of chunks.entries()) {
    const chunkId = crypto.randomUUID();
    await execute(
      "INSERT INTO chunks (id, document_id, chunk_index, content) VALUES (?, ?, ?, ?)",
      [chunkId, id, i, content],
    );
    try {
      await execute(
        "INSERT INTO knowledge_fts (content, chunk_id, user_id) VALUES (?, ?, ?)",
        [content, chunkId, input.userId],
      );
    } catch {
      // FTS optional
    }
  }
  return { id, chunks: chunks.length };
}

export async function listDocuments(userId: string) {
  await ensureDb();
  return query<{
    id: string;
    title: string;
    filename: string | null;
    created_at: number;
  }>(
    "SELECT id, title, filename, created_at FROM documents WHERE user_id = ? ORDER BY created_at DESC",
    [userId],
  );
}

export async function deleteDocument(userId: string, id: string) {
  await ensureDb();
  const owned = await query<{ id: string }>(
    "SELECT id FROM documents WHERE id = ? AND user_id = ?",
    [id, userId],
  );
  if (!owned[0]) return false;
  const files = await query<{ file_path: string | null }>(
    "SELECT file_path FROM documents WHERE id = ?",
    [id],
  );
  const disk = files[0]?.file_path;
  if (disk && fs.existsSync(disk)) {
    try {
      fs.unlinkSync(disk);
    } catch {
      // keep going
    }
  }
  const chunks = await query<{ id: string }>(
    "SELECT id FROM chunks WHERE document_id = ?",
    [id],
  );
  for (const chunk of chunks) {
    try {
      await execute("DELETE FROM knowledge_fts WHERE chunk_id = ?", [chunk.id]);
    } catch {
      // ignore
    }
  }
  await execute("DELETE FROM chunks WHERE document_id = ?", [id]);
  await execute("DELETE FROM documents WHERE id = ?", [id]);
  return true;
}

export async function saveSkill(input: {
  userId: string;
  name: string;
  description: string;
  body: string;
}) {
  await ensureDb();
  const existing = await query<{ id: string }>(
    "SELECT id FROM skills WHERE user_id = ? AND name = ?",
    [input.userId, input.name],
  );
  const t = now();
  if (existing[0]) {
    await execute(
      "UPDATE skills SET description = ?, body = ?, updated_at = ? WHERE id = ?",
      [input.description, input.body, t, existing[0].id],
    );
    return { id: existing[0].id, updated: true };
  }
  const id = crypto.randomUUID();
  await execute(
    "INSERT INTO skills (id, user_id, name, description, body, uses, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?)",
    [id, input.userId, input.name, input.description, input.body, t, t],
  );
  return { id, updated: false };
}

export async function listSkills(userId: string) {
  await ensureDb();
  return query<{
    id: string;
    name: string;
    description: string;
    body: string;
    uses: number;
    updated_at: number;
  }>(
    "SELECT id, name, description, body, uses, updated_at FROM skills WHERE user_id = ? ORDER BY updated_at DESC",
    [userId],
  );
}

export async function bumpSkill(userId: string, name: string) {
  await ensureDb();
  await execute(
    "UPDATE skills SET uses = uses + 1, updated_at = ? WHERE user_id = ? AND name = ?",
    [now(), userId, name],
  );
}

export async function deleteSkill(userId: string, id: string) {
  await ensureDb();
  await execute("DELETE FROM skills WHERE id = ? AND user_id = ?", [id, userId]);
}

export async function upsertTopic(input: {
  userId: string;
  name: string;
  description?: string;
  mastery: number;
}) {
  await ensureDb();
  const mastery = Math.max(0, Math.min(100, Math.round(input.mastery)));
  const existing = await query<{ id: string }>(
    "SELECT id FROM topics WHERE user_id = ? AND name = ?",
    [input.userId, input.name],
  );
  const t = now();
  if (existing[0]) {
    await execute(
      "UPDATE topics SET mastery = ?, last_reviewed_at = ?, description = COALESCE(?, description) WHERE id = ?",
      [mastery, t, input.description ?? null, existing[0].id],
    );
    return { id: existing[0].id, mastery };
  }
  const id = crypto.randomUUID();
  await execute(
    "INSERT INTO topics (id, user_id, name, description, mastery, last_reviewed_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [id, input.userId, input.name, input.description ?? null, mastery, t, t],
  );
  return { id, mastery };
}

export async function listTopics(userId: string) {
  await ensureDb();
  return query<{
    id: string;
    name: string;
    description: string | null;
    mastery: number;
    last_reviewed_at: number | null;
  }>(
    "SELECT id, name, description, mastery, last_reviewed_at FROM topics WHERE user_id = ? ORDER BY last_reviewed_at DESC",
    [userId],
  );
}

export async function saveFlashcard(input: {
  userId: string;
  topic?: string;
  front: string;
  back: string;
}) {
  await ensureDb();
  let topicId: string | null = null;
  if (input.topic) {
    const topic = await upsertTopic({
      userId: input.userId,
      name: input.topic,
      mastery: 0,
    });
    topicId = topic.id;
  }
  const id = crypto.randomUUID();
  const t = now();
  await execute(
    `INSERT INTO flashcards (id, user_id, topic_id, front, back, ease, interval_days, reps, due_at, created_at)
     VALUES (?, ?, ?, ?, ?, 2.5, 1, 0, ?, ?)`,
    [id, input.userId, topicId, input.front, input.back, t, t],
  );
  return { id };
}

export async function dueFlashcards(userId: string, limit = 20) {
  await ensureDb();
  return query<{
    id: string;
    front: string;
    back: string;
    topic_id: string | null;
    reps: number;
    interval_days: number;
    ease: number;
  }>(
    `SELECT id, front, back, topic_id, reps, interval_days, ease
     FROM flashcards WHERE user_id = ? AND due_at <= ?
     ORDER BY due_at ASC LIMIT ?`,
    [userId, now(), limit],
  );
}

export async function reviewFlashcard(
  userId: string,
  id: string,
  grade: "again" | "hard" | "good" | "easy",
) {
  await ensureDb();
  const rows = await query<{
    ease: number;
    interval_days: number;
    reps: number;
  }>("SELECT ease, interval_days, reps FROM flashcards WHERE id = ? AND user_id = ?", [
    id,
    userId,
  ]);
  const card = rows[0];
  if (!card) return null;
  let ease = card.ease;
  let interval = card.interval_days;
  let reps = card.reps + 1;
  if (grade === "again") {
    interval = 1;
    reps = 0;
    ease = Math.max(1.3, ease - 0.2);
  } else if (grade === "hard") {
    interval = Math.max(1, Math.round(interval * 1.2));
    ease = Math.max(1.3, ease - 0.15);
  } else if (grade === "good") {
    interval = Math.max(1, Math.round(interval * ease));
  } else {
    interval = Math.max(2, Math.round(interval * ease * 1.3));
    ease += 0.15;
  }
  const due = now() + interval * 24 * 60 * 60 * 1000;
  await execute(
    "UPDATE flashcards SET ease = ?, interval_days = ?, reps = ?, due_at = ? WHERE id = ?",
    [ease, interval, reps, due, id],
  );
  return { interval, due };
}

export async function saveReport(input: {
  userId: string;
  title: string;
  query: string;
  content: string;
  sources: string[];
}) {
  await ensureDb();
  const id = crypto.randomUUID();
  await execute(
    "INSERT INTO research_reports (id, user_id, title, query, content, sources_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [
      id,
      input.userId,
      input.title,
      input.query,
      input.content,
      JSON.stringify(input.sources),
      now(),
    ],
  );
  return { id };
}

export async function listReports(userId: string) {
  await ensureDb();
  return query<{
    id: string;
    title: string;
    query: string;
    content: string;
    sources_json: string;
    created_at: number;
  }>(
    "SELECT id, title, query, content, sources_json, created_at FROM research_reports WHERE user_id = ? ORDER BY created_at DESC",
    [userId],
  );
}

export async function recentContext(userId: string) {
  await ensureDb();
  const memories = await query<{ kind: string; content: string }>(
    "SELECT kind, content FROM memories WHERE user_id = ? ORDER BY created_at DESC LIMIT 12",
    [userId],
  );
  const skills = await query<{ name: string; description: string }>(
    "SELECT name, description FROM skills WHERE user_id = ? ORDER BY uses DESC, updated_at DESC LIMIT 8",
    [userId],
  );
  const topics = await query<{ name: string; mastery: number }>(
    "SELECT name, mastery FROM topics WHERE user_id = ? ORDER BY last_reviewed_at DESC LIMIT 8",
    [userId],
  );
  return { memories, skills, topics };
}

export async function listConversations(userId: string) {
  await ensureDb();
  return query<{
    id: string;
    title: string;
    mode: string;
    updated_at: number;
  }>(
    "SELECT id, title, mode, updated_at FROM conversations WHERE user_id = ? ORDER BY updated_at DESC LIMIT 80",
    [userId],
  );
}

export async function createConversation(input: {
  userId: string;
  mode: string;
  title?: string;
}) {
  await ensureDb();
  const id = crypto.randomUUID();
  const t = now();
  await execute(
    "INSERT INTO conversations (id, user_id, title, mode, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
    [id, input.userId, input.title ?? "New conversation", input.mode, t, t],
  );
  return { id };
}

export async function getConversation(userId: string, id: string) {
  await ensureDb();
  const rows = await query<{
    id: string;
    title: string;
    mode: string;
    updated_at: number;
  }>(
    "SELECT id, title, mode, updated_at FROM conversations WHERE id = ? AND user_id = ?",
    [id, userId],
  );
  return rows[0] ?? null;
}

export async function loadMessages(conversationId: string) {
  await ensureDb();
  const rows = await query<{
    id: string;
    role: string;
    parts_json: string;
  }>(
    "SELECT id, role, parts_json FROM messages WHERE conversation_id = ? ORDER BY created_at ASC",
    [conversationId],
  );
  return rows.map((row) => ({
    id: row.id,
    role: row.role as "user" | "assistant" | "system",
    parts: JSON.parse(row.parts_json),
  }));
}

export async function replaceMessages(
  conversationId: string,
  messages: Array<{ id: string; role: string; parts: unknown }>,
  title?: string,
) {
  await ensureDb();
  await execute("DELETE FROM messages WHERE conversation_id = ?", [conversationId]);
  const t = now();
  for (const [i, message] of messages.entries()) {
    await execute(
      "INSERT INTO messages (id, conversation_id, role, parts_json, created_at) VALUES (?, ?, ?, ?, ?)",
      [
        message.id || crypto.randomUUID(),
        conversationId,
        message.role,
        JSON.stringify(message.parts ?? []),
        t + i,
      ],
    );
  }
  if (title) {
    await execute(
      "UPDATE conversations SET title = ?, updated_at = ? WHERE id = ?",
      [title, t, conversationId],
    );
  } else {
    await execute("UPDATE conversations SET updated_at = ? WHERE id = ?", [
      t,
      conversationId,
    ]);
  }
}

export async function deleteConversation(userId: string, id: string) {
  await ensureDb();
  const owned = await getConversation(userId, id);
  if (!owned) return false;
  await execute("DELETE FROM messages WHERE conversation_id = ?", [id]);
  await execute("DELETE FROM conversations WHERE id = ?", [id]);
  return true;
}

export async function stats(userId: string) {
  await ensureDb();
  const one = async (sql: string) => {
    const rows = await query<{ n: number }>(sql, [userId]);
    return rows[0]?.n ?? 0;
  };
  return {
    memories: await one("SELECT COUNT(*) as n FROM memories WHERE user_id = ?"),
    skills: await one("SELECT COUNT(*) as n FROM skills WHERE user_id = ?"),
    documents: await one("SELECT COUNT(*) as n FROM documents WHERE user_id = ?"),
    topics: await one("SELECT COUNT(*) as n FROM topics WHERE user_id = ?"),
    dueCards: (
      await query<{ n: number }>(
        "SELECT COUNT(*) as n FROM flashcards WHERE user_id = ? AND due_at <= ?",
        [userId, now()],
      )
    )[0]?.n ?? 0,
    reports: await one(
      "SELECT COUNT(*) as n FROM research_reports WHERE user_id = ?",
    ),
  };
}
