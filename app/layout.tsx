import type { Metadata } from "next";
import { Suspense } from "react";
import "@fontsource/newsreader/400.css";
import "@fontsource/newsreader/500.css";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/ibm-plex-mono/400.css";
import "./globals.css";
import { Shell } from "@/components/Shell";

const TITLE = "Underwarned";
const DESC =
  "11.2 percent of Phoenix days at or above 40 °C were missed at a 3 day lead. An audit of GFS forecasts against ERA5.";

export const metadata: Metadata = {
  metadataBase: new URL("https://underwarned.vercel.app"),
  title: { default: TITLE, template: "%s | Underwarned" },
  description: DESC,
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "11.2% of Phoenix 40 °C days were missed at a 3 day lead",
    description: DESC,
    type: "website",
    url: "https://underwarned.vercel.app",
    images: [{ url: "/og.svg", width: 1200, height: 630, alt: "Underwarned: 11.2% missed at a 3 day lead" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Underwarned",
    description: DESC,
    images: ["/og.svg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={<div className="main">Loading Underwarned</div>}>
          <Shell>{children}</Shell>
        </Suspense>
      </body>
    </html>
  );
}
