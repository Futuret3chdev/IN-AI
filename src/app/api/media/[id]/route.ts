import { getMedia, readMediaBytes } from "@/lib/media";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const row = await getMedia(id);
  if (!row) return new Response("Not found", { status: 404 });
  const bytes = readMediaBytes(row);
  if (!bytes) return new Response("Not found", { status: 404 });
  return new Response(bytes, {
    headers: {
      "Content-Type": row.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
