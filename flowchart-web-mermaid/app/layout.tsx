import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flowchart Web (Mermaid)",
  description: "表から Mermaid フローチャートをプレビューする Web アプリ（ADR-010 比較用）",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
