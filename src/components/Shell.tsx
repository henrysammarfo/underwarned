"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

const LINKS = [
  { href: "/", label: "Home", tab: false },
  { href: "/audit", label: "Audit", tab: true },
  { href: "/events", label: "Events", tab: true },
  { href: "/compare", label: "Compare", tab: false },
  { href: "/method", label: "Method", tab: true },
  { href: "/limitations", label: "Limitations", tab: false },
  { href: "/legal", label: "Legal", tab: false },
];

export function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const search = useSearchParams();
  const moreOpen = search.get("more") === "1";

  function active(href: string) {
    if (href === "/") return path === "/";
    return path === href || path.startsWith(href + "/");
  }

  return (
    <div className="shell">
      <a className="skip" href="#content">
        Skip to content
      </a>
      <aside className="sidebar">
        <Link href="/" className="brand">
          Underwarned
          <span>Forecast heat underprediction audit</span>
        </Link>
        <nav className="side-nav desktop-only" aria-label="Primary">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={active(l.href) ? "active" : ""}>
              {l.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="main">
        <div id="content">{children}</div>
        <footer className="site">
          <span>Underwarned, DATANOVA 2026, problem DN-OP-01.</span>
          <Link href="/method">Method</Link>
          <Link href="/limitations">Limitations</Link>
          <Link href="/legal">Legal and sources</Link>
        </footer>
      </div>
      <nav className="tabs" aria-label="Mobile">
        <Link href="/audit" className={active("/audit") ? "active" : ""}>
          Audit
        </Link>
        <Link href="/events" className={active("/events") && !moreOpen ? "active" : ""}>
          Events
        </Link>
        <Link href="/method" className={active("/method") && !moreOpen ? "active" : ""}>
          Method
        </Link>
        <Link href="?more=1" className={moreOpen ? "active" : ""} scroll={false}>
          More
        </Link>
      </nav>
      {moreOpen ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(28,25,23,0.35)",
            zIndex: 30,
            display: "flex",
            alignItems: "flex-end",
          }}
        >
          <div
            className="card more-sheet"
            style={{
              width: "100%",
              borderRadius: "16px 16px 0 0",
              paddingBottom: "calc(16px + env(safe-area-inset-bottom))",
            }}
          >
            <h3>More</h3>
            <Link href="/" className="btn-ghost">
              Home
            </Link>
            <Link href="/compare" className="btn-ghost">
              Compare cities
            </Link>
            <Link href="/limitations" className="btn-ghost">
              Limitations
            </Link>
            <Link href="/legal" className="btn-ghost">
              Legal and sources
            </Link>
            <Link href={path || "/"} className="btn-ghost">
              Close
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
