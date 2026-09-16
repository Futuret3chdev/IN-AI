import { corsHeaders, json, requireApiUser } from "@/lib/api-auth";
import { deleteMemory, listMemories, saveMemory, searchMemories } from "@/lib/agent/store";

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function GET(req: Request) {
  const { user, error } = await requireApiUser(req);
  if (error) return error;
  const q = new URL(req.url).searchParams.get("q");
  const memories = q
    ? await searchMemories(user.id, q, 40)
    : await listMemories(user.id);
  return json({ memories });
}

export async function POST(req: Request) {
  const { user, error } = await requireApiUser(req);
  if (error) return error;
  const body = await req.json().catch(() => null);
  const content = String(body?.content ?? "").trim();
  if (!content) return json({ error: "content required" }, 400);
  const saved = await saveMemory({
    userId: user.id,
    kind: String(body?.kind ?? "fact"),
    content,
    source: "api",
  });
  return json(saved);
}

export async function DELETE(req: Request) {
  const { user, error } = await requireApiUser(req);
  if (error) return error;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return json({ error: "id required" }, 400);
  await deleteMemory(user.id, id);
  return json({ ok: true });
}
