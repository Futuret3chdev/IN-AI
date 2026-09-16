"use client";

import { useEffect, useState } from "react";

type Skill = {
  id: string;
  name: string;
  description: string;
  body: string;
  uses: number;
};

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [body, setBody] = useState("");

  async function load() {
    const res = await fetch("/api/skills");
    const data = await res.json();
    setSkills(data.skills ?? []);
  }
  useEffect(() => {
    load();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, body }),
    });
    setName("");
    setDescription("");
    setBody("");
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/skills?id=${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-serif text-4xl">Skills</h1>
        <p className="mt-2 text-muted">
          Procedures the agent has learned. It writes these after successful work.
        </p>

        <form onSubmit={save} className="mt-8 flex flex-col gap-2">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Skill name"
            className="rounded-xl border border-line bg-bg-elev px-3 py-2 outline-none focus:border-brass"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="When to use it"
            className="rounded-xl border border-line bg-bg-elev px-3 py-2 outline-none focus:border-brass"
          />
          <textarea
            required
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            placeholder="Step-by-step procedure…"
            className="rounded-xl border border-line bg-bg-elev px-3 py-2 outline-none focus:border-brass"
          />
          <button className="self-start rounded-full bg-brass px-4 py-2 text-sm font-medium text-bg">
            Save skill
          </button>
        </form>

        <ul className="mt-10 space-y-3">
          {skills.map((s) => (
            <li key={s.id} className="rounded-xl border border-line p-4">
              <div className="flex items-start justify-between gap-3">
                <button onClick={() => setOpen(open === s.id ? null : s.id)} className="text-left">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-sm text-muted">{s.description}</div>
                  <div className="mt-1 text-xs text-muted">{s.uses} uses</div>
                </button>
                <button onClick={() => remove(s.id)} className="text-sm text-muted hover:text-danger">
                  Delete
                </button>
              </div>
              {open === s.id && (
                <pre className="mt-3 whitespace-pre-wrap text-sm text-muted">{s.body}</pre>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
