import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "March Time Calculator",
  description: "A tool to synchronize march arrival times.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
