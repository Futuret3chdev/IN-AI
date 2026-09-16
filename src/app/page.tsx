import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { BrandBar, BrandMark } from "@/components/BrandBar";
import { Credits } from "@/components/Credits";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();
  return (
    <div className="min-h-full">
      <header className="flex items-center justify-between px-6 py-5 md:px-10">
        <BrandMark />
        <nav className="flex items-center gap-3 text-sm">
          {user ? (
            <Link
              href="/chat"
              className="rounded-full bg-brass px-4 py-2 font-medium text-bg"
            >
              Open workspace
            </Link>
          ) : (
            <>
              <Link href="/login" className="px-3 py-2 text-muted hover:text-ink">
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-brass px-4 py-2 font-medium text-bg"
              >
                Create account
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-24 pt-10 md:px-10 md:pt-16">
        <p className="mb-4 text-xs uppercase tracking-[0.22em] text-brass">
          $MT ECO SYSTEM · learning agent
        </p>
        <h1 className="max-w-3xl font-serif text-5xl leading-[1.05] md:text-7xl">
          An AI that remembers you, studies with you, and gets better at the work.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
          IN-AI is a multi-user learning agent in the $MT ECO SYSTEM, with
          Imagine, video, speech, and a developer API — powered by SpaceXAI Grok.
          Developed by Futuret3ch, T3x and MemeTorrent.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={user ? "/chat" : "/signup"}
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-bg"
          >
            {user ? "Continue" : "Start learning"}
          </Link>
          <Link
            href="/developers"
            className="rounded-full border border-line px-5 py-2.5 text-sm text-muted hover:text-ink"
          >
            Developer API
          </Link>
        </div>

        <section className="mt-20 grid gap-4 md:grid-cols-2">
          {[
            {
              k: "Tutor",
              t: "Teaches in small steps, quizzes you, and tracks mastery with spaced repetition.",
            },
            {
              k: "Work agent",
              t: "Does the task, then saves skills and lessons so the next run is sharper.",
            },
            {
              k: "Knowledge",
              t: "Ingests your notes and files, then answers from your corpus — not the internet’s guess.",
            },
            {
              k: "Research",
              t: "Plans, searches the live web, writes a sourced report, and files it in your library.",
            },
            {
              k: "Imagine",
              t: "Generate and edit images, then animate a still into a short video.",
            },
            {
              k: "Developer API",
              t: "Bearer keys, REST endpoints for chat, media, memory, knowledge, and skills.",
            },
          ].map((item) => (
            <article
              key={item.k}
              className="rounded-2xl border border-line bg-bg-elev p-6"
            >
              <h2 className="font-serif text-2xl">{item.k}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{item.t}</p>
            </article>
          ))}
        </section>
      </main>
      <footer className="border-t border-line px-6 py-8 md:px-10">
        <BrandBar />
        <Credits className="mt-4" />
      </footer>
    </div>
  );
}
