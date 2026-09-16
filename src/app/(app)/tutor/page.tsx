"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Topic = { id: string; name: string; mastery: number; description: string | null };
type Card = { id: string; front: string; back: string };
type Question = { prompt: string; choices: string[]; answer: number; why: string };

export default function TutorPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [due, setDue] = useState<Card[]>([]);
  const [name, setName] = useState("");
  const [show, setShow] = useState(false);
  const [quiz, setQuiz] = useState<Question[] | null>(null);
  const [quizTopic, setQuizTopic] = useState("");
  const [picks, setPicks] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/tutor");
    const data = await res.json();
    setTopics(data.topics ?? []);
    setDue(data.due ?? []);
    setShow(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function addTopic(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/tutor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "topic", name, mastery: 0 }),
    });
    setName("");
    load();
  }

  async function grade(id: string, g: "again" | "hard" | "good" | "easy") {
    await fetch("/api/tutor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "review", id, grade: g }),
    });
    load();
  }

  async function makeQuiz(topic: string) {
    setBusy(true);
    setQuizTopic(topic);
    const res = await fetch("/api/tutor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "quiz", topic }),
    });
    const data = await res.json();
    setBusy(false);
    setQuiz(data.questions ?? null);
    setPicks([]);
  }

  const card = due[0];
  const quizDone = quiz && picks.length === quiz.length;

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-serif text-4xl">Tutor</h1>
        <p className="mt-2 text-muted">
          Topics, quizzes, and spaced repetition. Start a lesson in{" "}
          <Link href="/chat?mode=tutor" className="text-steel underline">
            Tutor chat
          </Link>
          .
        </p>

        {card && (
          <section className="mt-8 rounded-2xl border border-line bg-bg-elev p-6">
            <div className="text-xs uppercase tracking-widest text-brass">Due card</div>
            <p className="mt-3 font-serif text-2xl">{card.front}</p>
            {show && <p className="mt-4 text-muted">{card.back}</p>}
            <div className="mt-5 flex flex-wrap gap-2">
              {!show ? (
                <button
                  onClick={() => setShow(true)}
                  className="rounded-full bg-ink px-4 py-2 text-sm text-bg"
                >
                  Show answer
                </button>
              ) : (
                (["again", "hard", "good", "easy"] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => grade(card.id, g)}
                    className="rounded-full border border-line px-3 py-1.5 text-sm capitalize hover:border-brass"
                  >
                    {g}
                  </button>
                ))
              )}
            </div>
            <p className="mt-3 text-xs text-muted">{due.length} due</p>
          </section>
        )}

        <form onSubmit={addTopic} className="mt-8 flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Add a topic to study"
            className="flex-1 rounded-xl border border-line bg-bg-elev px-3 py-2 outline-none focus:border-brass"
          />
          <button className="rounded-full bg-brass px-4 py-2 text-sm font-medium text-bg">
            Add
          </button>
        </form>

        <ul className="mt-6 space-y-3">
          {topics.map((t) => (
            <li key={t.id} className="rounded-xl border border-line p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium">{t.name}</div>
                  <div className="text-xs text-muted">{t.mastery}% mastery</div>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/chat?mode=tutor&q=${encodeURIComponent(`Teach me ${t.name}. Start from what I likely know.`)}`}
                    className="rounded-full border border-line px-3 py-1 text-sm"
                  >
                    Lesson
                  </Link>
                  <button
                    onClick={() => makeQuiz(t.name)}
                    className="rounded-full border border-line px-3 py-1 text-sm"
                  >
                    Quiz
                  </button>
                </div>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-bg-hover">
                <div
                  className="h-full bg-brass"
                  style={{ width: `${Math.max(4, t.mastery)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>

        {busy && <p className="mt-6 text-sm text-muted">Writing a quiz…</p>}
        {quiz && (
          <section className="mt-8 space-y-6">
            <h2 className="font-serif text-2xl">Quiz · {quizTopic}</h2>
            {quiz.map((question, qi) => (
              <article key={qi} className="rounded-xl border border-line p-4">
                <p>{question.prompt}</p>
                <div className="mt-3 grid gap-2">
                  {question.choices.map((choice, ci) => {
                    const picked = picks[qi];
                    const reveal = picked !== undefined;
                    const ok = ci === question.answer;
                    return (
                      <button
                        key={ci}
                        disabled={reveal}
                        onClick={() =>
                          setPicks((prev) => {
                            const next = [...prev];
                            next[qi] = ci;
                            return next;
                          })
                        }
                        className={`rounded-lg border px-3 py-2 text-left text-sm ${
                          reveal && ok
                            ? "border-ok text-ok"
                            : reveal && picked === ci
                              ? "border-danger text-danger"
                              : "border-line hover:border-brass"
                        }`}
                      >
                        {choice}
                      </button>
                    );
                  })}
                </div>
                {picks[qi] !== undefined && (
                  <p className="mt-2 text-sm text-muted">{question.why}</p>
                )}
              </article>
            ))}
            {quizDone && (
              <p className="text-sm text-steel">
                Score: {quiz.filter((q, i) => picks[i] === q.answer).length}/{quiz.length}
              </p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
