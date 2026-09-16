import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createApiKey, deleteApiKey, listApiKeys } from "@/lib/keys";

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;
  return NextResponse.json({ keys: await listApiKeys(user.id) });
}

export async function POST(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;
  const body = await req.json().catch(() => ({}));
  const created = await createApiKey(user.id, String(body?.name ?? "Default"));
  return NextResponse.json(created);
}

export async function DELETE(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await deleteApiKey(user.id, id);
  return NextResponse.json({ ok: true });
}
