import { AppShell } from "@/components/AppShell";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen">
      <AppShell>
        <div className="h-full min-h-0 overflow-hidden">{children}</div>
      </AppShell>
    </div>
  );
}
