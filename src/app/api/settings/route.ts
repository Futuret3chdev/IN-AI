import { NextResponse } from "next/server";
import {
  getCurrentUser,
  publicUser,
  requireUser,
  saveUserApiKey,
  updateProfile,
} from "@/lib/auth";
import { stats } from "@/lib/agent/store";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ user: publicUser(user), stats: await stats(user.id) });
}

export async function POST(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;
  const body = await req.json().catch(() => null);
  if (typeof body?.apiKey === "string") {
    await saveUserApiKey(user.id, body.apiKey);
  }
  if (body?.name || body?.password) {
    await updateProfile(user.id, { name: body.name, password: body.password });
  }
  const next = await getCurrentUser();
  return NextResponse.json({ user: next ? publicUser(next) : null });
}
