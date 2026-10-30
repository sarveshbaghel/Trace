import "./globals.css";
import React from "react";

export const metadata = {
  title: "Trace Admin - Moderation Console",
  description: "Administrative Review & Moderation Console",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 antialiased">{children}</body>
    </html>
  );
}
