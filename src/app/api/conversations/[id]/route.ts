import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import {
  deleteConversation,
  getConversation,
  loadMessages,
} from "@/lib/agent/store";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;
  const conversation = await getConversation(user.id, id);
  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const messages = await loadMessages(id);
  return NextResponse.json({ conversation, messages });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;
  await deleteConversation(user.id, id);
  return NextResponse.json({ ok: true });
}
