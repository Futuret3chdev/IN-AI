import { corsHeaders, json, requireApiUser } from "@/lib/api-auth";
import { ingestDocument, listDocuments, searchKnowledge } from "@/lib/agent/store";
import { titleFrom } from "@/lib/text";

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function GET(req: Request) {
  const { user, error } = await requireApiUser(req);
  if (error) return error;
  const q = new URL(req.url).searchParams.get("q");
  if (q) return json({ results: await searchKnowledge(user.id, q, 12) });
  return json({ documents: await listDocuments(user.id) });
}

export async function POST(req: Request) {
  const { user, error } = await requireApiUser(req);
  if (error) return error;
  const body = await req.json().catch(() => null);
  const text = String(body?.text ?? "").trim();
  if (!text) return json({ error: "text required" }, 400);
  const saved = await ingestDocument({
    userId: user.id,
    title: titleFrom(String(body?.title ?? text), "Note"),
    text,
  });
  return json(saved);
}
