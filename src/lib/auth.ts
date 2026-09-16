import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { hash, compare } from "bcryptjs";
import { ensureDb, execute, query } from "./db";
import { decryptSecret, encryptSecret } from "./crypto";
import { SESSION_COOKIE } from "./constants";

export { SESSION_COOKIE };

function cookieOptions(expires: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: Boolean(process.env.VERCEL),
    path: "/",
    expires,
  };
}
const SESSION_DAYS = 30;

export type User = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "member";
  api_key_enc: string | null;
  created_at: number;
};

function newId() {
  return crypto.randomUUID();
}

export async function createUser(input: {
  email: string;
  name: string;
  password: string;
}) {
  await ensureDb();
  const email = input.email.trim().toLowerCase();
  const existing = await query<{ id: string }>(
    "SELECT id FROM users WHERE email = ?",
    [email],
  );
  if (existing[0]) throw new Error("An account with that email already exists");

  const count = await query<{ n: number }>("SELECT COUNT(*) as n FROM users");
  const role = (count[0]?.n ?? 0) === 0 ? "admin" : "member";
  const id = newId();
  const password_hash = await hash(input.password, 12);
  await execute(
    "INSERT INTO users (id, email, name, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    [id, email, input.name.trim(), password_hash, role, Date.now()],
  );
  return { id, email, name: input.name.trim(), role } as const;
}

export async function verifyUser(email: string, password: string) {
  await ensureDb();
  const rows = await query<User & { password_hash: string }>(
    "SELECT id, email, name, role, api_key_enc, created_at, password_hash FROM users WHERE email = ?",
    [email.trim().toLowerCase()],
  );
  const user = rows[0];
  if (!user) return null;
  const ok = await compare(password, user.password_hash);
  if (!ok) return null;
  const { password_hash: _, ...safe } = user;
  return safe;
}

export async function createSession(userId: string) {
  await ensureDb();
  const id = newId();
  const expires = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  await execute(
    "INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)",
    [id, userId, expires],
  );
  return { id, expires };
}

export function applySessionCookie(
  response: NextResponse,
  sessionId: string,
  expires: number,
) {
  response.cookies.set(SESSION_COOKIE, sessionId, cookieOptions(new Date(expires)));
  return response;
}

export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  await ensureDb();
  const rows = await query<User>(
    `SELECT u.id, u.email, u.name, u.role, u.api_key_enc, u.created_at
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.id = ? AND s.expires_at > ?`,
    [token, Date.now()],
  );
  return rows[0] ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    return {
      user: null,
      error: Response.json({ error: "Unauthorized" }, { status: 401 }),
    } as const;
  }
  return { user, error: null } as const;
}

export function userApiKey(user: User) {
  if (user.api_key_enc) {
    try {
      return decryptSecret(user.api_key_enc);
    } catch {
      return null;
    }
  }
  return process.env.XAI_API_KEY || null;
}

export async function saveUserApiKey(userId: string, apiKey: string | null) {
  await ensureDb();
  const enc = apiKey && apiKey.trim() ? encryptSecret(apiKey.trim()) : null;
  await execute("UPDATE users SET api_key_enc = ? WHERE id = ?", [enc, userId]);
}

export async function updateProfile(
  userId: string,
  input: { name?: string; password?: string },
) {
  await ensureDb();
  if (input.name?.trim()) {
    await execute("UPDATE users SET name = ? WHERE id = ?", [input.name.trim(), userId]);
  }
  if (input.password && input.password.length >= 8) {
    const password_hash = await hash(input.password, 12);
    await execute("UPDATE users SET password_hash = ? WHERE id = ?", [
      password_hash,
      userId,
    ]);
  }
}

export function publicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    hasOwnKey: Boolean(user.api_key_enc),
    hasInstanceKey: Boolean(process.env.XAI_API_KEY),
  };
}
