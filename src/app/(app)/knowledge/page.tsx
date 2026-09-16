"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Doc = { id: string; title: string; filename: string | null; created_at: number };

export default function KnowledgePage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<{ title: string; content: string }[]>([]);
  const [msg, setMsg] = useState("");

  async function load() {
    const res = await fetch("/api/knowledge");
    const data = await res.json();
    setDocs(data.documents ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function pasteNote(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, text }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || "Failed");
      return;
    }
    setTitle("");
    setText("");
    setMsg(`Indexed ${data.chunks} chunks`);
    load();
  }

  async function upload(file: File) {
    const form = new FormData();
    form.set("file", file);
    const res = await fetch("/api/knowledge", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) setMsg(data.error || "Upload failed");
    else setMsg(`Indexed ${file.name} (${data.chunks} chunks)`);
    load();
  }

  async function search(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/knowledge?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setHits(data.results ?? []);
  }

  async function remove(id: string) {
    await fetch(`/api/knowledge/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-serif text-4xl">Knowledge</h1>
        <p className="mt-2 text-muted">
          Notes and files the agent can search. Then{" "}
          <Link href="/chat?mode=knowledge" className="text-steel underline">
            ask in Knowledge mode
          </Link>
          .
        </p>

        <form onSubmit={search} className="mt-6 flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search your library"
            className="flex-1 rounded-xl border border-line bg-bg-elev px-3 py-2 outline-none focus:border-brass"
          />
          <button className="rounded-full bg-ink px-4 py-2 text-sm text-bg">Search</button>
        </form>
        {hits.length > 0 && (
          <div className="mt-4 space-y-3">
            {hits.map((h, i) => (
              <article key={i} className="rounded-xl border border-line p-4 text-sm">
                <div className="text-brass">{h.title}</div>
                <p className="mt-1 whitespace-pre-wrap text-muted">{h.content.slice(0, 500)}</p>
              </article>
            ))}
          </div>
        )}

        <form onSubmit={pasteNote} className="mt-10 flex flex-col gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title"
            className="rounded-xl border border-line bg-bg-elev px-3 py-2 outline-none focus:border-brass"
          />
          <textarea
            required
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            placeholder="Paste a note, article, or transcript…"
            className="rounded-xl border border-line bg-bg-elev px-3 py-2 outline-none focus:border-brass"
          />
          <div className="flex flex-wrap items-center gap-3">
            <button className="rounded-full bg-brass px-4 py-2 text-sm font-medium text-bg">
              Save note
            </button>
            <label className="cursor-pointer text-sm text-muted hover:text-ink">
              or upload a text file
              <input
                type="file"
                accept=".txt,.md,.csv,.json,.html"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) upload(file);
                }}
              />
            </label>
          </div>
          {msg && <p className="text-sm text-steel">{msg}</p>}
        </form>

        <ul className="mt-10 space-y-2">
          {docs.map((d) => (
            <li
              key={d.id}
              className="flex items-center justify-between rounded-xl border border-line px-4 py-3"
            >
              <div>
                <div>{d.title}</div>
                <div className="text-xs text-muted">
                  {d.filename || "note"} · {new Date(d.created_at).toLocaleString()}
                </div>
              </div>
              <button onClick={() => remove(d.id)} className="text-sm text-muted hover:text-danger">
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
