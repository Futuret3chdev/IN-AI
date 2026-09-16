import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { deleteSkill, listSkills, saveSkill } from "@/lib/agent/store";

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;
  return NextResponse.json({ skills: await listSkills(user.id) });
}

export async function POST(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;
  const body = await req.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  const description = String(body?.description ?? "").trim();
  const bodyText = String(body?.body ?? "").trim();
  if (!name || !bodyText) {
    return NextResponse.json({ error: "name and body required" }, { status: 400 });
  }
  const saved = await saveSkill({
    userId: user.id,
    name,
    description: description || name,
    body: bodyText,
  });
  return NextResponse.json(saved);
}

export async function DELETE(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await deleteSkill(user.id, id);
  return NextResponse.json({ ok: true });
}
