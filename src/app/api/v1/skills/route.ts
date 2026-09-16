import { corsHeaders, json, requireApiUser } from "@/lib/api-auth";
import { deleteSkill, listSkills, saveSkill } from "@/lib/agent/store";

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function GET(req: Request) {
  const { user, error } = await requireApiUser(req);
  if (error) return error;
  return json({ skills: await listSkills(user.id) });
}

export async function POST(req: Request) {
  const { user, error } = await requireApiUser(req);
  if (error) return error;
  const body = await req.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  const bodyText = String(body?.body ?? "").trim();
  if (!name || !bodyText) return json({ error: "name and body required" }, 400);
  return json(
    await saveSkill({
      userId: user.id,
      name,
      description: String(body?.description ?? name),
      body: bodyText,
    }),
  );
}

export async function DELETE(req: Request) {
  const { user, error } = await requireApiUser(req);
  if (error) return error;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return json({ error: "id required" }, 400);
  await deleteSkill(user.id, id);
  return json({ ok: true });
}
