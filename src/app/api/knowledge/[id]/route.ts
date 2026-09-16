import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { deleteDocument } from "@/lib/agent/store";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;
  await deleteDocument(user.id, id);
  return NextResponse.json({ ok: true });
}
