import type { Metadata } from "next";
import { content, settings } from "@/lib/content";
import { MotionProvider } from "@/components/motion-provider";
import { routeMetadata } from "@/lib/site-routing";
import "lenis/dist/lenis.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(settings.siteUrl),
  ...routeMetadata(
    content.metadata.title,
    content.metadata.description,
    "home",
  ),
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
