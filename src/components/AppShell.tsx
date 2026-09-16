"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/chat", label: "Chat" },
  { href: "/tutor", label: "Tutor" },
  { href: "/imagine", label: "Imagine" },
  { href: "/video", label: "Video" },
  { href: "/speech", label: "Speech" },
  { href: "/knowledge", label: "Knowledge" },
  { href: "/research", label: "Research" },
  { href: "/skills", label: "Skills" },
  { href: "/memory", label: "Memory" },
  { href: "/developers", label: "API" },
  { href: "/settings", label: "Settings" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [name, setName] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setName(d.user?.name ?? ""))
      .catch(() => undefined);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-full">
      <aside className="flex w-56 shrink-0 flex-col border-r border-line bg-bg-elev">
        <Link href="/" className="px-5 py-5 font-serif text-2xl">
          IN-AI
        </Link>
        <nav className="flex flex-1 flex-col gap-0.5 px-3">
          {NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm ${
                  active
                    ? "bg-bg-hover text-ink"
                    : "text-muted hover:bg-bg-hover hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-line px-4 py-4 text-sm">
          <div className="truncate text-ink">{name || "Signed in"}</div>
          <button onClick={logout} className="mt-1 text-muted hover:text-ink">
            Log out
          </button>
        </div>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
