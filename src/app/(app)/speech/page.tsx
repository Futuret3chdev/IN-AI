"use client";

import { useState } from "react";

const VOICES = ["eve", "ara", "leo", "rex"];

export default function SpeechPage() {
  const [text, setText] = useState("");
  const [voiceId, setVoiceId] = useState("eve");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [url, setUrl] = useState<string | null>(null);

  async function speak(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/speech", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice_id: voiceId, language: "en" }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "TTS failed");
      return;
    }
    setUrl(data.url);
  }

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-serif text-4xl">Speech</h1>
        <p className="mt-2 text-muted">
          Real SpaceXAI Text to Speech: POST https://api.x.ai/v1/tts with{" "}
          <code>voice_id</code> and <code>language</code>. Default voice is eve.
        </p>
        <form onSubmit={speak} className="mt-8 flex flex-col gap-3">
          <textarea
            required
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder="Text to speak…"
            className="rounded-xl border border-line bg-bg-elev px-3 py-2 outline-none focus:border-brass"
          />
          <div className="flex flex-wrap gap-2">
            {VOICES.map((v) => (
              <button
                type="button"
                key={v}
                onClick={() => setVoiceId(v)}
                className={`rounded-full px-3 py-1 text-sm ${
                  voiceId === v ? "bg-brass text-bg" : "border border-line text-muted"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <button
            disabled={busy}
            className="self-start rounded-full bg-brass px-4 py-2 text-sm font-medium text-bg disabled:opacity-60"
          >
            {busy ? "Synthesizing…" : "Speak"}
          </button>
          {error && <p className="text-sm text-danger">{error}</p>}
        </form>
        {url && <audio className="mt-8 w-full" controls src={url} />}
      </div>
    </div>
  );
}
