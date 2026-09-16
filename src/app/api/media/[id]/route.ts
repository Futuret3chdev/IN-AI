import { getMedia } from "@/lib/media";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const row = await getMedia(id);
  if (!row?.data) return new Response("Not found", { status: 404 });
  const bytes = Buffer.from(row.data, "base64");
  return new Response(bytes, {
    headers: {
      "Content-Type": row.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
