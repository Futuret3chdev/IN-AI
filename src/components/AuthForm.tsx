"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/chat";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <div className="flex min-h-full items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-line bg-bg-elev p-8">
        <Link href="/" className="font-serif text-3xl">
          Adept
        </Link>
        <h1 className="mt-6 font-serif text-3xl">
          {mode === "login" ? "Welcome back" : "Create your workspace"}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {mode === "login"
            ? "Sign in to your learning agent."
            : "First account on this instance becomes admin."}
        </p>
        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-3">
          {mode === "signup" && (
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="rounded-xl border border-line bg-bg px-3 py-2.5 outline-none focus:border-brass"
            />
          )}
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="rounded-xl border border-line bg-bg px-3 py-2.5 outline-none focus:border-brass"
          />
          <input
            required
            type="password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === "signup" ? "Password (8+ characters)" : "Password"}
            className="rounded-xl border border-line bg-bg px-3 py-2.5 outline-none focus:border-brass"
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <button
            disabled={busy}
            className="mt-2 rounded-full bg-brass py-2.5 font-medium text-bg disabled:opacity-60"
          >
            {busy ? "Working…" : mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>
        <p className="mt-6 text-sm text-muted">
          {mode === "login" ? (
            <>
              New here?{" "}
              <Link href="/signup" className="text-ink underline">
                Create an account
              </Link>
            </>
          ) : (
            <>
              Already have one?{" "}
              <Link href="/login" className="text-ink underline">
                Log in
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
