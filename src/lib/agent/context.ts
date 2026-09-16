import { recentContext, searchKnowledge, searchMemories } from "./store";
import type { AgentMode } from "../types";

function lastUserText(messages: Array<{ role: string; parts: unknown }>) {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role !== "user") continue;
    if (!Array.isArray(m.parts)) continue;
    const text = m.parts
      .map((part) =>
        part && typeof part === "object" && (part as { type?: string }).type === "text"
          ? String((part as { text?: string }).text ?? "")
          : "",
      )
      .join(" ")
      .trim();
    if (text) return text;
  }
  return "";
}

export async function buildContextBlock(
  userId: string,
  mode: AgentMode,
  messages: Array<{ role: string; parts: unknown }>,
) {
  const { memories, skills, topics } = await recentContext(userId);
  const query = lastUserText(messages);
  const [hits, docs] = query
    ? await Promise.all([
        searchMemories(userId, query, 5),
        searchKnowledge(userId, query, 5),
      ])
    : [[], []];

  const lines: string[] = [];
  if (memories.length) {
    lines.push(
      "Known memories:\n" +
        memories.map((m) => `- (${m.kind}) ${m.content}`).join("\n"),
    );
  }
  if (hits.length && query) {
    lines.push(
      "Memories matching this turn:\n" +
        hits.map((m) => `- (${m.kind}) ${m.content}`).join("\n"),
    );
  }
  if (skills.length) {
    lines.push(
      "Learned skills:\n" +
        skills.map((s) => `- ${s.name}: ${s.description}`).join("\n"),
    );
  }
  if (mode === "tutor" && topics.length) {
    lines.push(
      "Topic mastery:\n" +
        topics.map((t) => `- ${t.name}: ${t.mastery}/100`).join("\n"),
    );
  }
  if (docs.length) {
    lines.push(
      "Knowledge hits:\n" +
        docs
          .map((d) => `- [${d.title}] ${d.content.slice(0, 400)}`)
          .join("\n"),
    );
  }
  return lines.join("\n\n");
}
