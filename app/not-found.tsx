import Link from "next/link";

export default function NotFound() {
  return (
    <div>
      <h1>This page is not in the audit</h1>
      <p className="lede">The address you opened is not a page in Underwarned.</p>
      <p className="hero-actions">
        <Link href="/" className="btn-primary">
          Home
        </Link>
        <Link href="/method" className="btn-ghost">
          Method
        </Link>
      </p>
    </div>
  );
}
