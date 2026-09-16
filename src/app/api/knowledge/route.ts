import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { ingestDocument, listDocuments, searchKnowledge } from "@/lib/agent/store";
import { titleFrom } from "@/lib/text";

export async function GET(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;
  const q = new URL(req.url).searchParams.get("q");
  if (q) {
    const results = await searchKnowledge(user.id, q, 12);
    return NextResponse.json({ results });
  }
  const documents = await listDocuments(user.id);
  return NextResponse.json({ documents });
}

export async function POST(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file required" }, { status: 400 });
    }
    const bytes = Buffer.from(await file.arrayBuffer());
    const text = bytes.toString("utf8");
    if (!text.trim()) {
      return NextResponse.json(
        { error: "Empty file. Upload text, markdown, csv, or json." },
        { status: 400 },
      );
    }
    const saved = await ingestDocument({
      userId: user.id,
      title: titleFrom(file.name.replace(/\.[^.]+$/, ""), file.name),
      filename: file.name,
      mime: file.type,
      text,
      bytes,
    });
    return NextResponse.json(saved);
  }

  const body = await req.json().catch(() => null);
  const text = String(body?.text ?? "").trim();
  if (!text) return NextResponse.json({ error: "text required" }, { status: 400 });
  const saved = await ingestDocument({
    userId: user.id,
    title: titleFrom(String(body?.title ?? text), "Note"),
    text,
  });
  return NextResponse.json(saved);
}
