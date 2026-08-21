import { AppShell } from "@/components/AppShell";
import { AS_OF } from "@/lib/containment";
import { formatUtc } from "@/lib/format";

export default function DemoLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-dvh bg-canvas font-sans text-ink antialiased">
      <AppShell frozenClock={formatUtc(AS_OF)}>{children}</AppShell>
    </div>
  );
}
