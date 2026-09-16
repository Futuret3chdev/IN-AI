import { corsHeaders, json, requireApiUser } from "@/lib/api-auth";
import { generateSpeech } from "@/lib/media";

export const maxDuration = 60;

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function POST(req: Request) {
  const { user, error } = await requireApiUser(req);
  if (error) return error;
  const body = await req.json().catch(() => null);
  const text = String(body?.text ?? "").trim();
  if (!text) return json({ error: "text required" }, 400);
  try {
    const audio = await generateSpeech(
      user,
      text,
      String(body?.voice_id ?? body?.voice ?? "eve"),
      String(body?.language ?? "en"),
    );
    return json(audio);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Speech failed" }, 500);
  }
}
