import { corsHeaders, json, requireApiUser } from "@/lib/api-auth";
import { listMedia } from "@/lib/media";

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function GET(req: Request) {
  const { user, error } = await requireApiUser(req);
  if (error) return error;
  const kind = new URL(req.url).searchParams.get("kind") ?? undefined;
  return json({ media: await listMedia(user.id, kind ?? undefined) });
}
