import { ChatPanel } from "@/components/ChatPanel";
import { isMode } from "@/lib/types";

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; q?: string }>;
}) {
  const q = await searchParams;
  const mode = isMode(q.mode) ? q.mode : "work";
  return <ChatPanel initialMode={mode} starter={q.q} />;
}
