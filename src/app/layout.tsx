import type { Metadata, Viewport } from "next";
import "../styles/globals.css";
import { SerwistProvider } from "./lib/client";

export const metadata: Metadata = {
  title: "March Time Calculator",
  description: "A tool to synchronize march arrival times.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SerwistProvider swUrl="/serwist/sw.js">{children}</SerwistProvider>
      </body>
    </html>
  );
}
