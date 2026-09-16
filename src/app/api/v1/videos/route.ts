import { corsHeaders, json, requireApiUser } from "@/lib/api-auth";
import { generateUserVideo, listMedia } from "@/lib/media";

export const maxDuration = 180;

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function GET(req: Request) {
  const { user, error } = await requireApiUser(req);
  if (error) return error;
  return json({ videos: await listMedia(user.id, "video") });
}

export async function POST(req: Request) {
  const { user, error } = await requireApiUser(req);
  if (error) return error;
  const body = await req.json().catch(() => null);
  const prompt = String(body?.prompt ?? "").trim();
  const image = String(body?.image ?? "");
  if (!prompt || !image) return json({ error: "prompt and image required" }, 400);
  try {
    const video = await generateUserVideo(user, prompt, image, Number(body?.duration ?? 6));
    return json(video);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Video failed" }, 500);
  }
}
