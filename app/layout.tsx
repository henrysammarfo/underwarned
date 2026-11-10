import type { Metadata } from "next";
import { Suspense } from "react";
import "@fontsource/newsreader/400.css";
import "@fontsource/newsreader/500.css";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-mono/400.css";
import "./globals.css";
import { Shell } from "@/components/Shell";

const TITLE = "Underwarned";
const DESC =
  "How often the forecast is too cool when the heat actually arrives. An audit of GFS forecasts at 1 to 7 day leads against ERA5.";

export const metadata: Metadata = {
  title: { default: TITLE, template: "%s · Underwarned" },
  description: DESC,
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: TITLE,
    description: DESC,
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={<div className="main">Loading Underwarned…</div>}>
          <Shell>{children}</Shell>
        </Suspense>
      </body>
    </html>
  );
}
