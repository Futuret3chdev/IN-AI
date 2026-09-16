"use client";

import { useEffect, useState } from "react";

type Item = { id: string; prompt: string; created_at: number };

export default function VideoPage() {
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [latest, setLatest] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);

  async function load() {
    const res = await fetch("/api/videos");
    const data = await res.json();
    setItems(data.videos ?? []);
  }
  useEffect(() => {
    load();
  }, []);

  function onFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  }

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, image, duration: 6 }),
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
        <h1 className="font-serif text-4xl">Video</h1>
        <p className="mt-2 text-muted">
          Animate a still with SpaceXAI Imagine Video. Upload a frame, describe the
          motion. API: POST /api/v1/videos.
        </p>
        <form onSubmit={generate} className="mt-8 flex flex-col gap-3">
          <label className="cursor-pointer rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted hover:border-brass">
            {image ? "Frame selected — click to replace" : "Upload a still image (first frame)"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onFile(file);
              }}
            />
          </label>
          {image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="max-h-48 rounded-xl border border-line" />
          )}
          <textarea
            required
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="Slow push-in, papers rustle, lamp flickers…"
            className="rounded-xl border border-line bg-bg-elev px-3 py-2 outline-none focus:border-brass"
          />
          <button
            disabled={busy || !image}
            className="self-start rounded-full bg-brass px-4 py-2 text-sm font-medium text-bg disabled:opacity-60"
          >
            {busy ? "Animating…" : "Generate 6s clip"}
          </button>
          {error && <p className="text-sm text-danger">{error}</p>}
        </form>
        {latest && (
          <video src={latest} controls className="mt-8 w-full rounded-2xl border border-line" />
        )}
        <ul className="mt-10 space-y-4">
          {items.map((item) => (
            <li key={item.id}>
              <video src={`/api/media/${item.id}`} controls className="w-full rounded-xl border border-line" />
              <p className="mt-1 text-xs text-muted">{item.prompt}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
