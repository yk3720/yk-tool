import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flowchart Web",
  description: "表からフローチャートを自動生成する Web アプリ",
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
