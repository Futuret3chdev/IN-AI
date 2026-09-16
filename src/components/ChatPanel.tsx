"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Markdown } from "./Markdown";
import { isMode, type AgentMode } from "@/lib/types";

const MODES: { id: AgentMode; label: string; hint: string }[] = [
  { id: "work", label: "Work", hint: "Do the task. Save skills and lessons." },
  { id: "tutor", label: "Tutor", hint: "Teach, quiz, track mastery." },
  { id: "research", label: "Research", hint: "Plan, search the web, file a report." },
  { id: "knowledge", label: "Knowledge", hint: "Stay grounded in your library." },
];

type Convo = { id: string; title: string; mode: string; updated_at: number };

function textOf(message: UIMessage) {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("");
}

function toolLabel(part: { type: string; state?: string }) {
  const name = part.type.replace(/^tool-/, "").replace(/_/g, " ");
  if (part.state === "output-available") return `used ${name}`;
  if (part.state === "output-error") return `${name} failed`;
  return `using ${name}…`;
}

export function ChatPanel({
  initialMode = "work",
  starter,
}: {
  initialMode?: AgentMode;
  starter?: string;
}) {
  const [mode, setMode] = useState<AgentMode>(initialMode);
  const [input, setInput] = useState(starter ?? "");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [convos, setConvos] = useState<Convo[]>([]);
  const idRef = useRef<string | null>(null);
  const modeRef = useRef<AgentMode>(mode);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);
  useEffect(() => {
    idRef.current = conversationId;
  }, [conversationId]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: () => ({
          conversationId: idRef.current,
          mode: modeRef.current,
        }),
      }),
    [],
  );

  const { messages, sendMessage, status, setMessages, error, stop } = useChat({
    transport,
  });

  const loadConvos = useCallback(async () => {
    const res = await fetch("/api/conversations");
    const data = await res.json();
    setConvos(data.conversations ?? []);
  }, []);

  useEffect(() => {
    loadConvos();
  }, [loadConvos]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [messages, status]);

  async function ensureConversation() {
    if (idRef.current) return idRef.current;
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: modeRef.current }),
    });
    const data = await res.json();
    idRef.current = data.id;
    setConversationId(data.id);
    return data.id as string;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || status !== "ready") return;
    await ensureConversation();
    setInput("");
    await sendMessage({ text });
    loadConvos();
  }

  async function openConvo(id: string) {
    const res = await fetch(`/api/conversations/${id}`);
    const data = await res.json();
    idRef.current = id;
    setConversationId(id);
    if (isMode(data.conversation?.mode)) setMode(data.conversation.mode);
    setMessages((data.messages ?? []) as UIMessage[]);
  }

  function newChat() {
    idRef.current = null;
    setConversationId(null);
    setMessages([]);
  }

  async function removeConvo(id: string) {
    await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    if (idRef.current === id) newChat();
    loadConvos();
  }

  return (
    <div className="flex h-full min-h-0">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-line md:flex">
        <div className="flex items-center justify-between px-4 py-4">
          <span className="text-xs uppercase tracking-widest text-muted">Threads</span>
          <button
            onClick={newChat}
            className="rounded-md border border-line px-2 py-1 text-xs text-muted hover:text-ink"
          >
            New
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {convos.map((c) => (
            <div
              key={c.id}
              className={`group mb-1 flex items-center rounded-lg ${
                c.id === conversationId ? "bg-bg-hover" : "hover:bg-bg-hover"
              }`}
            >
              <button
                onClick={() => openConvo(c.id)}
                className="min-w-0 flex-1 px-3 py-2 text-left text-sm"
              >
                <div className="truncate">{c.title}</div>
                <div className="text-[11px] uppercase tracking-wide text-muted">
                  {c.mode}
                </div>
              </button>
              <button
                onClick={() => removeConvo(c.id)}
                className="hidden px-2 text-muted group-hover:block hover:text-danger"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap gap-2 border-b border-line px-4 py-3">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`rounded-full px-3 py-1 text-sm ${
                mode === m.id
                  ? "bg-brass text-bg"
                  : "border border-line text-muted hover:text-ink"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <p className="px-5 py-2 text-xs text-muted">
          {MODES.find((m) => m.id === mode)?.hint}
        </p>

        <div ref={scroller} className="flex-1 overflow-y-auto px-5 py-4">
          {messages.length === 0 && (
            <div className="mx-auto mt-16 max-w-xl text-center">
              <h1 className="font-serif text-4xl">Ready when you are.</h1>
              <p className="mt-3 text-muted">
                Ask it to teach you something, ingest a note, research a topic,
                or just get work done. It will remember.
              </p>
            </div>
          )}
          <div className="mx-auto flex max-w-3xl flex-col gap-6">
            {messages.map((message) => (
              <article key={message.id} className="min-w-0">
                <div className="mb-1 text-[11px] uppercase tracking-widest text-muted">
                  {message.role === "user" ? "You" : "IN-AI"}
                </div>
                {message.role === "user" ? (
                  <p className="whitespace-pre-wrap text-[15px] leading-7">
                    {textOf(message)}
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {message.parts.map((part, i) => {
                      if (part.type === "text") {
                        return <Markdown key={i} text={part.text} />;
                      }
                      if (part.type === "reasoning") {
                        return (
                          <details key={i} className="text-xs text-muted">
                            <summary className="cursor-pointer">Thinking</summary>
                            <pre className="mt-2 whitespace-pre-wrap">{part.text}</pre>
                          </details>
                        );
                      }
                      if (part.type === "source-url") {
                        return (
                          <a
                            key={i}
                            href={part.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-steel"
                          >
                            {part.title || part.url}
                          </a>
                        );
                      }
                      if (part.type.startsWith("tool-")) {
                        return (
                          <div
                            key={i}
                            className="w-fit rounded-full border border-line px-2 py-0.5 text-[11px] uppercase tracking-wide text-muted"
                          >
                            {toolLabel(part as { type: string; state?: string })}
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                )}
              </article>
            ))}
            {status === "submitted" && (
              <div className="text-sm text-muted">Thinking…</div>
            )}
            {error && (
              <div className="rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
                {error.message}
              </div>
            )}
          </div>
        </div>

        <form onSubmit={onSubmit} className="border-t border-line p-4">
          <div className="mx-auto flex max-w-3xl gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSubmit(e);
                }
              }}
              rows={2}
              placeholder={
                mode === "tutor"
                  ? "What do you want to learn?"
                  : mode === "research"
                    ? "What should I investigate?"
                    : "Message IN-AI…"
              }
              className="min-h-[56px] flex-1 resize-none rounded-2xl border border-line bg-bg-elev px-4 py-3 outline-none focus:border-brass"
            />
            {status === "streaming" || status === "submitted" ? (
              <button
                type="button"
                onClick={() => stop()}
                className="self-end rounded-full border border-line px-4 py-2 text-sm"
              >
                Stop
              </button>
            ) : (
              <button
                disabled={!input.trim()}
                className="self-end rounded-full bg-brass px-4 py-2 text-sm font-medium text-bg disabled:opacity-40"
              >
                Send
              </button>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
