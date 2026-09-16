import { convertToModelMessages, generateText, stepCountIs, type UIMessage } from "ai";
import { corsHeaders, json, requireApiUser } from "@/lib/api-auth";
import { getModel, getXai } from "@/lib/ai";
import { agentTools } from "@/lib/agent/tools";
import { systemPrompt } from "@/lib/agent/prompts";
import { buildContextBlock } from "@/lib/agent/context";
import { isMode } from "@/lib/types";

export const maxDuration = 120;

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function POST(req: Request) {
  const { user, error } = await requireApiUser(req);
  if (error) return error;
  const body = await req.json().catch(() => null);
  const mode = isMode(body?.mode) ? body.mode : "work";
  const input = body?.messages ?? body?.input;
  let messages: UIMessage[] = [];
  if (typeof input === "string") {
    messages = [{ id: crypto.randomUUID(), role: "user", parts: [{ type: "text", text: input }] }];
  } else if (Array.isArray(input)) {
    messages = input.map((m: { id?: string; role: string; content?: string; parts?: UIMessage["parts"] }) => ({
      id: m.id || crypto.randomUUID(),
      role: m.role as "user" | "assistant" | "system",
      parts: m.parts ?? [{ type: "text" as const, text: String(m.content ?? "") }],
    }));
  } else {
    return json({ error: "messages or input required" }, 400);
  }
  try {
    const xai = getXai(user);
    const context = await buildContextBlock(user.id, mode, messages);
    const result = await generateText({
      model: getModel(user),
      system: systemPrompt(mode, [context]),
      messages: await convertToModelMessages(messages),
      tools: agentTools(user, mode, xai),
      stopWhen: stepCountIs(8),
    });
    return json({
      id: crypto.randomUUID(),
      model: "grok-4.6",
      mode,
      output: result.text,
      text: result.text,
    });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Chat failed" }, 500);
  }
}
