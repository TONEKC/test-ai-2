import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Enchanted Library Lending System",
  description: "Magical library lending system with Next.js, Prisma, and Supabase",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-slate-50 text-slate-950">{children}</body>
    </html>
  );
}
