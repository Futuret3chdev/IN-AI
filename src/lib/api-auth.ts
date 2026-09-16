import type { User } from "./auth";
import { getCurrentUser } from "./auth";
import { userFromApiKey } from "./keys";

export function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  };
}

export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: corsHeaders() });
}

export async function requireApiUser(req: Request): Promise<
  { user: User; error?: never } | { user?: never; error: Response }
> {
  const header = req.headers.get("authorization") || "";
  const token = header.toLowerCase().startsWith("bearer ")
    ? header.slice(7).trim()
    : "";
  if (token.startsWith("inai_")) {
    const user = await userFromApiKey(token);
    if (!user) return { error: json({ error: "Invalid API key" }, 401) };
    return { user };
  }
  const sessionUser = await getCurrentUser();
  if (sessionUser) return { user: sessionUser };
  return {
    error: json(
      { error: "Unauthorized. Send Authorization: Bearer inai_…" },
      401,
    ),
  };
}
