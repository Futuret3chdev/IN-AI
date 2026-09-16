import Link from "next/link";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-in-ai.svg"
        alt="IN-AI"
        width={compact ? 140 : 196}
        height={compact ? 32 : 45}
        className="h-auto"
      />
    </Link>
  );
}

export function BrandBar() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-mt.svg" alt="$MT ECO SYSTEM" width={200} height={35} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-futuret3ch.svg" alt="Futuret3ch" width={140} height={28} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-t3x.svg" alt="T3x" width={64} height={28} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-memetorrent.svg" alt="MemeTorrent" width={140} height={28} />
    </div>
  );
}
