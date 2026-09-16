import { NextResponse } from "next/server";
import { applySessionCookie, createSession, createUser } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = String(body?.email ?? "").trim();
  const name = String(body?.name ?? "").trim();
  const password = String(body?.password ?? "");
  if (!email || !name || password.length < 8) {
    return NextResponse.json(
      { error: "Name, email, and a password of at least 8 characters are required." },
      { status: 400 },
    );
  }
  try {
    const user = await createUser({ email, name, password });
    const session = await createSession(user.id);
    return applySessionCookie(
      NextResponse.json({ user }),
      session.id,
      session.expires,
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Signup failed" },
      { status: 400 },
    );
  }
}
