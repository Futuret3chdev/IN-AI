"use client";

import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [hasOwnKey, setHasOwnKey] = useState(false);
  const [hasInstanceKey, setHasInstanceKey] = useState(false);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        setName(d.user?.name ?? "");
        setEmail(d.user?.email ?? "");
        setHasOwnKey(Boolean(d.user?.hasOwnKey));
        setHasInstanceKey(Boolean(d.user?.hasInstanceKey));
        setStats(d.stats ?? {});
      });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        password: password || undefined,
        apiKey: apiKey || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || "Save failed");
      return;
    }
    setPassword("");
    setApiKey("");
    setHasOwnKey(Boolean(data.user?.hasOwnKey));
    setMsg("Saved");
  }

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-xl">
        <h1 className="font-serif text-4xl">Settings</h1>
        <p className="mt-2 text-muted">
          Each person can bring their own SpaceXAI key. If you leave it blank,
          this instance uses the server key.
        </p>

        <dl className="mt-8 grid grid-cols-2 gap-3 text-sm">
          {Object.entries(stats).map(([k, v]) => (
            <div key={k} className="rounded-xl border border-line p-3">
              <dt className="text-muted">{k}</dt>
              <dd className="font-serif text-2xl">{v}</dd>
            </div>
          ))}
        </dl>

        <form onSubmit={save} className="mt-10 flex flex-col gap-3">
          <label className="text-sm text-muted">
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-line bg-bg-elev px-3 py-2 text-ink outline-none focus:border-brass"
            />
          </label>
          <label className="text-sm text-muted">
            Email
            <input
              disabled
              value={email}
              className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2 text-muted"
            />
          </label>
          <label className="text-sm text-muted">
            New password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to keep"
              className="mt-1 w-full rounded-xl border border-line bg-bg-elev px-3 py-2 text-ink outline-none focus:border-brass"
            />
          </label>
          <label className="text-sm text-muted">
            SpaceXAI API key {hasOwnKey ? "(saved)" : hasInstanceKey ? "(using instance key)" : "(required)"}
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="xai-…"
              className="mt-1 w-full rounded-xl border border-line bg-bg-elev px-3 py-2 text-ink outline-none focus:border-brass"
            />
          </label>
          <button className="mt-2 self-start rounded-full bg-brass px-4 py-2 text-sm font-medium text-bg">
            Save
          </button>
          {msg && <p className="text-sm text-steel">{msg}</p>}
        </form>
      </div>
    </div>
  );
}
