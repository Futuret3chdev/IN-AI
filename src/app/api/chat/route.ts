import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { requireUser } from "@/lib/auth";
import { getModel, getXai } from "@/lib/ai";
import { systemPrompt } from "@/lib/agent/prompts";
import { agentTools } from "@/lib/agent/tools";
import { buildContextBlock } from "@/lib/agent/context";
import { extractMemories } from "@/lib/agent/extract";
import {
  createConversation,
  getConversation,
  replaceMessages,
} from "@/lib/agent/store";
import { isMode, type AgentMode } from "@/lib/types";
import { titleFrom } from "@/lib/text";

export const runtime = "nodejs";
export const maxDuration = 120;

function textOf(message: UIMessage) {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join(" ")
    .trim();
}

export async function POST(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;

  const body = await req.json();
  const messages = (body.messages ?? []) as UIMessage[];
  const mode: AgentMode = isMode(body.mode) ? body.mode : "work";
  let conversationId = String(body.conversationId ?? "");

  if (!conversationId) {
    const created = await createConversation({ userId: user.id, mode });
    conversationId = created.id;
  } else {
    const owned = await getConversation(user.id, conversationId);
    if (!owned) {
      return Response.json({ error: "Conversation not found" }, { status: 404 });
    }
  }

  const context = await buildContextBlock(user.id, mode, messages);
  const xai = getXai(user);
  const result = streamText({
    model: getModel(user),
    system: systemPrompt(mode, [context]),
    messages: await convertToModelMessages(messages),
    tools: agentTools(user.id, mode, xai),
    stopWhen: stepCountIs(8),
    onError({ error: err }) {
      console.error("chat error", err);
    },
  });

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    sendSources: true,
    sendReasoning: true,
    headers: { "x-conversation-id": conversationId },
    onFinish: async ({ messages: all }) => {
      const firstUser = all.find((m) => m.role === "user");
      const title = firstUser ? titleFrom(textOf(firstUser), "New conversation") : undefined;
      await replaceMessages(
        conversationId,
        all.map((m) => ({ id: m.id, role: m.role, parts: m.parts })),
        title,
      );
      extractMemories(user, all).catch((err) => console.warn(err));
    },
  });
}
