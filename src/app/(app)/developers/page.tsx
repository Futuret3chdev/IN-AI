"use client";

import { useEffect, useState } from "react";

type KeyRow = { id: string; name: string; prefix: string; created_at: number };

const ENDPOINTS = [
  { m: "POST", p: "/api/v1/chat", b: '{ "input": "Explain spaced repetition", "mode": "tutor" }' },
  { m: "POST", p: "/api/v1/images", b: '{ "prompt": "brass lamp on a dark desk", "aspect_ratio": "16:9" }' },
  { m: "POST", p: "/api/v1/videos", b: '{ "prompt": "slow camera push-in", "image": "<base64>", "duration": 6 }' },
  { m: "POST", p: "/api/v1/speech", b: '{ "text": "Welcome to IN-AI", "voice_id": "eve", "language": "en" }' },
  { m: "GET", p: "/api/v1/memories", b: "" },
  { m: "POST", p: "/api/v1/memories", b: '{ "kind": "fact", "content": "Prefers short answers" }' },
  { m: "GET", p: "/api/v1/knowledge?q=sm-2", b: "" },
  { m: "POST", p: "/api/v1/knowledge", b: '{ "title": "Notes", "text": "…" }' },
  { m: "GET", p: "/api/v1/skills", b: "" },
  { m: "GET", p: "/api/v1/models", b: "" },
];

export default function DevelopersPage() {
  const [keys, setKeys] = useState<KeyRow[]>([]);
  const [name, setName] = useState("Production");
  const [secret, setSecret] = useState("");
  const [origin, setOrigin] = useState("");

  async function load() {
    const res = await fetch("/api/keys");
    const data = await res.json();
    setKeys(data.keys ?? []);
  }
  useEffect(() => {
    load();
    setOrigin(window.location.origin);
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    setSecret(data.key ?? "");
    load();
  }

  async function revoke(id: string) {
    await fetch(`/api/keys?id=${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-serif text-4xl">Developer API</h1>
        <p className="mt-2 text-muted">
          IN-AI developer API for the $MT ECO SYSTEM. Chat, Imagine, video,
          speech, memory, knowledge, and skills. Authenticate with a Bearer key.
          Developed by Futuret3ch, T3x and MemeTorrent.
        </p>

        <form onSubmit={create} className="mt-8 flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 rounded-xl border border-line bg-bg-elev px-3 py-2 outline-none focus:border-brass"
          />
          <button className="rounded-full bg-brass px-4 py-2 text-sm font-medium text-bg">
            Create key
          </button>
        </form>
        {secret && (
          <p className="mt-3 break-all rounded-xl border border-brass/40 bg-bg-elev p-3 text-sm">
            Copy now — shown once: <code>{secret}</code>
          </p>
        )}
        <ul className="mt-4 space-y-2">
          {keys.map((k) => (
            <li key={k.id} className="flex items-center justify-between rounded-xl border border-line px-4 py-2 text-sm">
              <span>
                {k.name} · <code>{k.prefix}…</code>
              </span>
              <button onClick={() => revoke(k.id)} className="text-muted hover:text-danger">
                Revoke
              </button>
            </li>
          ))}
        </ul>

        <h2 className="mt-12 font-serif text-2xl">Quickstart</h2>
        <pre className="mt-3 overflow-x-auto rounded-xl border border-line bg-bg p-4 text-xs leading-6">
{`curl ${origin || "https://your-host"}/api/v1/chat \\
  -H "Authorization: Bearer inai_…" \\
  -H "Content-Type: application/json" \\
  -d '{"input":"Teach me Bayes theorem","mode":"tutor"}'`}
        </pre>

        <h2 className="mt-10 font-serif text-2xl">Endpoints</h2>
        <div className="mt-4 space-y-3">
          {ENDPOINTS.map((e) => (
            <article key={e.m + e.p} className="rounded-xl border border-line p-4">
              <div className="text-sm">
                <span className="text-brass">{e.m}</span> <code>{e.p}</code>
              </div>
              {e.b && (
                <pre className="mt-2 overflow-x-auto text-xs text-muted">{e.b}</pre>
              )}
            </article>
          ))}
        </div>
        <p className="mt-6 text-sm text-muted">
          Image, video, and speech responses include a <code>url</code> path like{" "}
          <code>/api/media/&lt;id&gt;</code>. Prefix with your origin. Chat{" "}
          <code>mode</code> is <code>work</code>, <code>tutor</code>,{" "}
          <code>research</code>, or <code>knowledge</code>.
        </p>
      </div>
    </div>
  );
}
