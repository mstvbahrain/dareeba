import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dareeba | Bahrain VAT Estimate",
  description: "AI-powered Bahrain VAT estimate and professional review referral."
};

const nav = [
  ["Home", "/"],
  ["Upload", "/upload"],
  ["Pricing", "/pricing"],
  ["Admin", "/admin"],
  ["Terms", "/terms"]
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded bg-navy font-bold text-gold">D</span>
              <span className="text-lg font-bold tracking-tight text-navy">Dareeba</span>
            </Link>
            <nav className="hidden items-center gap-6 text-sm font-medium text-slate-700 md:flex">
              {nav.map(([label, href]) => (
                <Link key={href} href={href} className="hover:text-navy">
                  {label}
                </Link>
              ))}
            </nav>
            <Link href="/upload" className="rounded bg-gold px-4 py-2 text-sm font-semibold text-navy shadow-sm">
              Start VAT Check
            </Link>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
