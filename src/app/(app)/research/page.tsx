"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Markdown } from "@/components/Markdown";

type Report = {
  id: string;
  title: string;
  query: string;
  content: string;
  sources: string[];
  created_at: number;
};

export default function ResearchPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch("/api/research")
      .then((r) => r.json())
      .then((d) => setReports(d.reports ?? []));
  }, []);

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-serif text-4xl">Research</h1>
        <p className="mt-2 text-muted">
          Ask IN-AI to investigate, then it files a sourced report here.
        </p>
        <form
          className="mt-6 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!q.trim()) return;
            window.location.href = `/chat?mode=research&q=${encodeURIComponent(q)}`;
          }}
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Research question"
            className="flex-1 rounded-xl border border-line bg-bg-elev px-3 py-2 outline-none focus:border-brass"
          />
          <button className="rounded-full bg-brass px-4 py-2 text-sm font-medium text-bg">
            Investigate
          </button>
        </form>
        <p className="mt-3 text-sm">
          or{" "}
          <Link href="/chat?mode=research" className="text-steel underline">
            open Research chat
          </Link>
        </p>

        <ul className="mt-10 space-y-3">
          {reports.map((r) => (
            <li key={r.id} className="rounded-xl border border-line p-4">
              <button onClick={() => setOpen(open === r.id ? null : r.id)} className="w-full text-left">
                <div className="font-medium">{r.title}</div>
                <div className="text-sm text-muted">{r.query}</div>
                <div className="mt-1 text-xs text-muted">
                  {new Date(r.created_at).toLocaleString()}
                </div>
              </button>
              {open === r.id && (
                <div className="mt-4 border-t border-line pt-4">
                  <Markdown text={r.content} />
                  {r.sources?.length > 0 && (
                    <ul className="mt-4 text-sm">
                      {r.sources.map((s) => (
                        <li key={s}>
                          <a href={s} className="text-steel" target="_blank" rel="noreferrer">
                            {s}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
