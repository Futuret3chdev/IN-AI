import { createHash, randomBytes } from "node:crypto";
import { ensureDb, execute, query } from "./db";
import { now } from "./text";

export function hashApiKey(key: string) {
  return createHash("sha256").update(key).digest("hex");
}

export async function createApiKey(userId: string, name: string) {
  await ensureDb();
  const secret = randomBytes(24).toString("base64url");
  const key = `inai_${secret}`;
  const prefix = key.slice(0, 12);
  const id = crypto.randomUUID();
  await execute(
    "INSERT INTO api_keys (id, user_id, name, prefix, key_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    [id, userId, name.trim() || "Default", prefix, hashApiKey(key), now()],
  );
  return { id, prefix, key, name: name.trim() || "Default" };
}

export async function listApiKeys(userId: string) {
  await ensureDb();
  return query<{
    id: string;
    name: string;
    prefix: string;
    created_at: number;
    last_used_at: number | null;
  }>(
    "SELECT id, name, prefix, created_at, last_used_at FROM api_keys WHERE user_id = ? ORDER BY created_at DESC",
    [userId],
  );
}

export async function deleteApiKey(userId: string, id: string) {
  await ensureDb();
  await execute("DELETE FROM api_keys WHERE id = ? AND user_id = ?", [id, userId]);
}

export async function userFromApiKey(key: string) {
  await ensureDb();
  const rows = await query<{
    id: string;
    email: string;
    name: string;
    role: "admin" | "member";
    api_key_enc: string | null;
    created_at: number;
    key_id: string;
  }>(
    `SELECT u.id, u.email, u.name, u.role, u.api_key_enc, u.created_at, k.id as key_id
     FROM api_keys k JOIN users u ON u.id = k.user_id
     WHERE k.key_hash = ?`,
    [hashApiKey(key)],
  );
  const row = rows[0];
  if (!row) return null;
  await execute("UPDATE api_keys SET last_used_at = ? WHERE id = ?", [
    now(),
    row.key_id,
  ]);
  const { key_id: _, ...user } = row;
  return user;
}
