import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OTLP Log Viewer",
  description: "High-performance OTLP log viewer"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-white text-slate-900">{children}</body>
    </html>
  );
}

