import { NextResponse } from "next/server";
import { applySessionCookie, createSession, verifyUser } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = String(body?.email ?? "");
  const password = String(body?.password ?? "");
  const user = await verifyUser(email, password);
  if (!user) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }
  const session = await createSession(user.id);
  return applySessionCookie(
    NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    }),
    session.id,
    session.expires,
  );
}
