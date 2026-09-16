"use client";

import { useEffect, useState } from "react";

type Item = { id: string; prompt: string; created_at: number };

export default function ImaginePage() {
  const [prompt, setPrompt] = useState("");
  const [ratio, setRatio] = useState("1:1");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [latest, setLatest] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);

  async function load() {
    const res = await fetch("/api/images");
    const data = await res.json();
    setItems(data.images ?? []);
  }
  useEffect(() => {
    load();
  }, []);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/images", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, aspectRatio: ratio }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Generation failed");
      return;
    }
    setLatest(data.url);
    load();
  }

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-serif text-4xl">Imagine</h1>
        <p className="mt-2 text-muted">
          Generate images with SpaceXAI Imagine (`grok-imagine-image`). Also available
          on the developer API as POST /api/v1/images.
        </p>
        <form onSubmit={generate} className="mt-8 flex flex-col gap-3">
          <textarea
            required
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            placeholder="A brass desk lamp over handwritten notes, dark study, cinematic light…"
            className="rounded-xl border border-line bg-bg-elev px-3 py-2 outline-none focus:border-brass"
          />
          <div className="flex flex-wrap gap-2">
            {["1:1", "16:9", "9:16", "4:3", "3:4"].map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => setRatio(r)}
                className={`rounded-full px-3 py-1 text-sm ${
                  ratio === r ? "bg-brass text-bg" : "border border-line text-muted"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <button
            disabled={busy}
            className="self-start rounded-full bg-brass px-4 py-2 text-sm font-medium text-bg disabled:opacity-60"
          >
            {busy ? "Generating…" : "Generate"}
          </button>
          {error && <p className="text-sm text-danger">{error}</p>}
        </form>
        {latest && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={latest} alt="" className="mt-8 max-h-[520px] rounded-2xl border border-line" />
        )}
        <ul className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3">
          {items.map((item) => (
            <li key={item.id} className="overflow-hidden rounded-xl border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/media/${item.id}`} alt={item.prompt} className="h-40 w-full object-cover" />
              <p className="truncate px-2 py-2 text-xs text-muted">{item.prompt}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
