import { corsHeaders, json } from "@/lib/api-auth";

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export function GET() {
  return json({
    models: [
      { id: "grok-4.6", kind: "text", use: "chat, tutor, research" },
      { id: "grok-imagine-image-2.0", kind: "image", use: "POST /api/v1/images" },
      { id: "grok-imagine-video-1.5", kind: "video", use: "POST /api/v1/videos" },
    ],
  });
}
