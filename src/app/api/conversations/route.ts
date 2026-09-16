import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createConversation, listConversations } from "@/lib/agent/store";
import { isMode } from "@/lib/types";

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;
  const conversations = await listConversations(user.id);
  return NextResponse.json({ conversations });
}

export async function POST(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;
  const body = await req.json().catch(() => ({}));
  const mode = isMode(body.mode) ? body.mode : "work";
  const created = await createConversation({
    userId: user.id,
    mode,
    title: body.title,
  });
  return NextResponse.json(created);
}
