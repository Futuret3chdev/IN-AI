import { generateObject } from "ai";
import { z } from "zod";
import type { User } from "../auth";
import { getModel } from "../ai";
import { saveMemory } from "./store";

function textFromParts(parts: unknown) {
  if (!Array.isArray(parts)) return "";
  return parts
    .map((part) => {
      if (part && typeof part === "object" && "type" in part && (part as { type: string }).type === "text") {
        return String((part as { text?: string }).text ?? "");
      }
      return "";
    })
    .join("\n");
}

export async function extractMemories(
  user: User,
  messages: Array<{ role: string; parts: unknown }>,
) {
  const transcript = messages
    .slice(-12)
    .map((m) => `${m.role}: ${textFromParts(m.parts)}`)
    .join("\n")
    .slice(0, 8000);
  if (transcript.length < 80) return;

  try {
    const { object } = await generateObject({
      model: getModel(user),
      schema: z.object({
        memories: z.array(
          z.object({
            kind: z.enum(["fact", "preference", "goal", "lesson"]),
            content: z.string(),
          }),
        ),
      }),
      prompt: `Extract 0-4 durable memories from this conversation. Skip small talk. Each memory must be a standalone sentence about the user.

Conversation:
${transcript}`,
    });
    for (const memory of object.memories.slice(0, 4)) {
      if (memory.content.trim().length < 8) continue;
      await saveMemory({
        userId: user.id,
        kind: memory.kind,
        content: memory.content.trim(),
        source: "extract",
      });
    }
  } catch (error) {
    console.warn("memory extract failed", error);
  }
}
