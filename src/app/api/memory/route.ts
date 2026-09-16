import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { deleteMemory, listMemories, saveMemory, searchMemories } from "@/lib/agent/store";

export async function GET(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;
  const q = new URL(req.url).searchParams.get("q");
  if (q) return NextResponse.json({ memories: await searchMemories(user.id, q, 40) });
  return NextResponse.json({ memories: await listMemories(user.id) });
}

export async function POST(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;
  const body = await req.json().catch(() => null);
  const content = String(body?.content ?? "").trim();
  const kind = String(body?.kind ?? "fact");
  if (!content) return NextResponse.json({ error: "content required" }, { status: 400 });
  const saved = await saveMemory({
    userId: user.id,
    kind,
    content,
    source: "manual",
  });
  return NextResponse.json(saved);
}

export async function DELETE(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await deleteMemory(user.id, id);
  return NextResponse.json({ ok: true });
}
