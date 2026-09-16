"use client";

import { useEffect, useState } from "react";

type Memory = {
  id?: string;
  kind: string;
  content: string;
  source?: string | null;
  created_at?: number;
};

export default function MemoryPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [content, setContent] = useState("");
  const [kind, setKind] = useState("fact");
  const [q, setQ] = useState("");

  async function load(query?: string) {
    const url = query ? `/api/memory?q=${encodeURIComponent(query)}` : "/api/memory";
    const res = await fetch(url);
    const data = await res.json();
    setMemories(data.memories ?? []);
  }
  useEffect(() => {
    load();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/memory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, kind }),
    });
    setContent("");
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/memory?id=${id}`, { method: "DELETE" });
    load(q || undefined);
  }

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-serif text-4xl">Memory</h1>
        <p className="mt-2 text-muted">
          Facts, preferences, goals, and lessons the agent keeps about you.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load(q);
          }}
          className="mt-6 flex gap-2"
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search memories"
            className="flex-1 rounded-xl border border-line bg-bg-elev px-3 py-2 outline-none focus:border-brass"
          />
          <button className="rounded-full border border-line px-4 py-2 text-sm">Search</button>
        </form>

        <form onSubmit={add} className="mt-6 flex flex-col gap-2">
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            className="w-40 rounded-xl border border-line bg-bg-elev px-3 py-2"
          >
            <option value="fact">fact</option>
            <option value="preference">preference</option>
            <option value="goal">goal</option>
            <option value="lesson">lesson</option>
          </select>
          <textarea
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            placeholder="Something Adept should remember…"
            className="rounded-xl border border-line bg-bg-elev px-3 py-2 outline-none focus:border-brass"
          />
          <button className="self-start rounded-full bg-brass px-4 py-2 text-sm font-medium text-bg">
            Save memory
          </button>
        </form>

        <ul className="mt-10 space-y-2">
          {memories.map((m, i) => (
            <li key={m.id ?? i} className="rounded-xl border border-line p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] uppercase tracking-widest text-brass">{m.kind}</div>
                  <p className="mt-1">{m.content}</p>
                </div>
                {m.id && (
                  <button onClick={() => remove(m.id!)} className="text-sm text-muted hover:text-danger">
                    Forget
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
