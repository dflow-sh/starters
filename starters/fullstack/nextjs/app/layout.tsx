import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "dFlow Next.js starter",
  description: "Minimal App Router sample for SSR-style deploys",
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
