import { corsHeaders, json } from "@/lib/api-auth";

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export function GET() {
  return json({
    name: "IN-AI Developer API",
    version: "v1",
    docs: "/developers",
    endpoints: [
      "POST /api/v1/chat",
      "POST /api/v1/images",
      "POST /api/v1/videos",
      "POST /api/v1/speech",
      "GET /api/v1/media",
      "GET/POST /api/v1/memories",
      "GET/POST /api/v1/knowledge",
      "GET/POST /api/v1/skills",
      "GET /api/v1/models",
    ],
  });
}
