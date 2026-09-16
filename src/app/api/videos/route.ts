import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { generateUserVideo, listMedia } from "@/lib/media";

export const maxDuration = 180;

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;
  return NextResponse.json({ videos: await listMedia(user.id, "video") });
}

export async function POST(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;
  const body = await req.json().catch(() => null);
  const prompt = String(body?.prompt ?? "").trim();
  const image = String(body?.image ?? "");
  if (!prompt || !image) {
    return NextResponse.json(
      { error: "prompt and image (base64 or data URL) required" },
      { status: 400 },
    );
  }
  try {
    const video = await generateUserVideo(
      user,
      prompt,
      image,
      Number(body?.duration ?? 6),
    );
    return NextResponse.json(video);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Video generation failed" },
      { status: 500 },
    );
  }
}
