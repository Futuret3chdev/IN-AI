import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { editUserImage, generateUserImage, listMedia } from "@/lib/media";

export const maxDuration = 120;

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;
  return NextResponse.json({ images: await listMedia(user.id, "image") });
}

export async function POST(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;
  const body = await req.json().catch(() => null);
  const prompt = String(body?.prompt ?? "").trim();
  if (!prompt) return NextResponse.json({ error: "prompt required" }, { status: 400 });
  try {
    const image = body?.image
      ? await editUserImage(user, prompt, String(body.image))
      : await generateUserImage(user, prompt, String(body?.aspectRatio ?? "1:1"));
    return NextResponse.json(image);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Image generation failed" },
      { status: 500 },
    );
  }
}
