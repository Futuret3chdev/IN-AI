import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { generateSpeech } from "@/lib/media";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;
  const body = await req.json().catch(() => null);
  const text = String(body?.text ?? "").trim();
  if (!text) return NextResponse.json({ error: "text required" }, { status: 400 });
  try {
    const audio = await generateSpeech(
      user,
      text,
      String(body?.voice_id ?? body?.voice ?? "eve"),
      String(body?.language ?? "en"),
    );
    return NextResponse.json(audio);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Speech failed" },
      { status: 500 },
    );
  }
}
