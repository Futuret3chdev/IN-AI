import { corsHeaders, json, requireApiUser } from "@/lib/api-auth";
import { editUserImage, generateUserImage, listMedia } from "@/lib/media";

export const maxDuration = 120;

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function GET(req: Request) {
  const { user, error } = await requireApiUser(req);
  if (error) return error;
  return json({ images: await listMedia(user.id, "image") });
}

export async function POST(req: Request) {
  const { user, error } = await requireApiUser(req);
  if (error) return error;
  const body = await req.json().catch(() => null);
  const prompt = String(body?.prompt ?? "").trim();
  if (!prompt) return json({ error: "prompt required" }, 400);
  try {
    const image = body?.image
      ? await editUserImage(user, prompt, String(body.image))
      : await generateUserImage(user, prompt, String(body?.aspect_ratio ?? body?.aspectRatio ?? "1:1"));
    return json(image);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Image failed" }, 500);
  }
}
