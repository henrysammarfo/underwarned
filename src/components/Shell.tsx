"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

const MAST = [
  { href: "/audit", label: "Audit" },
  { href: "/events", label: "Events" },
  { href: "/compare", label: "Compare" },
  { href: "/method", label: "Method" },
];

export function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const search = useSearchParams();
  const moreOpen = search.get("more") === "1";
  const isHome = path === "/";

  function active(href: string) {
    if (href === "/") return path === "/";
    return path === href || path.startsWith(href + "/");
  }

  return (
    <div className="shell">
      <a className="skip" href="#content">
        Skip to content
      </a>
      <header className="masthead">
        <Link href="/" className="brand">
          Underwarned
        </Link>
        <nav className="mast-nav" aria-label="Primary">
          {MAST.map((l) => (
            <Link key={l.href} href={l.href} className={active(l.href) ? "active" : ""}>
              {l.label}
            </Link>
          ))}
        </nav>
      </header>
      <div className={`main${isHome ? " main-home" : ""}`}>
        <div id="content">{children}</div>
        <footer className="site">
          <span>Underwarned, DATANOVA 2026, problem DN-OP-01.</span>
          <Link href="/method">Method</Link>
          <Link href="/limitations">Limitations</Link>
          <Link href="/legal">Legal and sources</Link>
          <a href="/deck.pdf">Deck</a>
        </footer>
      </div>
      <nav className="tabs" aria-label="Mobile">
        <Link href="/" className={active("/") && !moreOpen ? "active" : ""}>
          Home
        </Link>
        <Link href="/audit" className={active("/audit") && !moreOpen ? "active" : ""}>
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
        <div className="sheet-backdrop" role="presentation">
          <div className="more-sheet" role="dialog" aria-label="More pages">
            <h3>More</h3>
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
