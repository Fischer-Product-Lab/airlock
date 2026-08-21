"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState, type ReactNode } from "react";
import {
  BookOpen,
  ClipboardList,
  FolderKanban,
  Menu,
  Shield,
  Unplug,
  X,
} from "lucide-react";

const NAV = [
  { href: "/why", label: "Why Airlock", icon: BookOpen },
  { href: "/demo", label: "Range board", icon: Shield },
  { href: "/collisions", label: "Collision desk", icon: Unplug },
  { href: "/incidents", label: "Incident strip", icon: FolderKanban },
  { href: "/harnesses", label: "Harness scorecard", icon: ClipboardList },
] as const;

function deskTitle(pathname: string): string {
  if (pathname === "/why" || pathname === "/about") return "Why Airlock";
  if (pathname === "/demo" || pathname.startsWith("/cells/")) return "Range board";
  const match = NAV.find(
    (item) => item.href !== "/demo" && pathname.startsWith(item.href),
  );
  return match?.label ?? "Airlock";
}

function navActive(pathname: string, href: string): boolean {
  if (href === "/demo")
    return pathname === "/demo" || pathname.startsWith("/cells/");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({
  children,
  frozenClock,
}: {
  children: ReactNode;
  frozenClock: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const drawerId = useId();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="min-h-dvh bg-canvas text-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-surface focus:px-3 focus:py-2 focus:text-sm"
      >
        Skip to content
      </a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-hairline bg-surface lg:flex">
        <Brand />
        <NavList pathname={pathname} />
        <SidebarFoot />
      </aside>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-canvas/70"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          />
          <aside
            id={drawerId}
            className="relative flex h-full w-72 max-w-[85vw] flex-col border-r border-hairline bg-surface"
          >
            <div className="flex items-center justify-between px-5 py-5">
              <Brand compact />
              <button
                type="button"
                className="rounded-md p-2 text-ink-muted hover:bg-surface-2 hover:text-ivory"
                onClick={() => setOpen(false)}
              >
                <X className="size-5" strokeWidth={1.5} />
                <span className="sr-only">Close navigation</span>
              </button>
            </div>
            <NavList pathname={pathname} />
            <SidebarFoot />
          </aside>
        </div>
      ) : null}

      <div className="flex min-h-dvh flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-hairline bg-canvas/85 px-4 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-md p-2 text-ink-muted hover:bg-surface-2 hover:text-ivory lg:hidden"
              aria-expanded={open}
              aria-controls={drawerId}
              onClick={() => setOpen(true)}
            >
              <Menu className="size-5" strokeWidth={1.5} />
              <span className="sr-only">Open navigation</span>
            </button>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">
              {deskTitle(pathname)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-gold">
              Demo
            </span>
            <p className="text-right text-[11px] text-ink-faint">
              <span className="text-gold">As of</span>
              <span className="hidden sm:inline"> · {frozenClock}</span>
            </p>
          </div>
        </header>

        <main id="main" className="flex-1 px-4 py-8 sm:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "" : "px-5 pb-2 pt-6"}>
      <Link href="/" className="group flex items-start gap-3">
        <AirlockMark />
        <span>
          <span className="block font-display text-2xl leading-none text-ivory group-hover:text-gold">
            Airlock
          </span>
          <span className="mt-1.5 block text-[10px] uppercase tracking-[0.18em] text-ink-faint">
            Fischer Product Lab
          </span>
        </span>
      </Link>
    </div>
  );
}

function NavList({ pathname }: { pathname: string }) {
  return (
    <nav className="mt-4 flex-1 px-3" aria-label="Desks">
      <ul className="space-y-0.5">
        {NAV.map((item) => {
          const active = navActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm ${
                  active
                    ? "bg-gold/10 text-ivory"
                    : "text-ink-muted hover:bg-surface-2 hover:text-ivory"
                }`}
              >
                <span
                  className={`h-4 w-0.5 shrink-0 rounded-full ${
                    active ? "bg-gold" : "bg-transparent"
                  }`}
                  aria-hidden="true"
                />
                <Icon className="size-3.5 shrink-0" strokeWidth={1.5} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function SidebarFoot() {
  return (
    <p className="border-t border-hairline px-5 py-4 text-[11px] leading-relaxed text-ink-faint">
      Read-only demo. Synthetic data. No live probes.
    </p>
  );
}

function AirlockMark() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      aria-hidden="true"
      className="mt-0.5 shrink-0"
    >
      <circle
        cx="14"
        cy="14"
        r="11"
        fill="none"
        stroke="#c4a35a"
        strokeWidth="1.25"
      />
      <circle
        cx="14"
        cy="14"
        r="6.5"
        fill="rgba(196,163,90,0.12)"
        stroke="#c4a35a"
        strokeWidth="1.25"
      />
      <path
        d="M14 8.2v11.6M8.2 14h11.6"
        stroke="#c4a35a"
        strokeWidth="1.1"
        opacity="0.55"
      />
    </svg>
  );
}
