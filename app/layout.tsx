import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Stargaze Solutions | See Singapore differently", template: "%s | Stargaze Solutions" },
  description: "Discover Singapore through guided nature walks, local stories and citizen science with Stargaze Solutions.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en"><body>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <header className="wrap header">
        <Link href="/" className="brand" aria-label="Stargaze Solutions home"><span aria-hidden="true">✳</span> Stargaze<span className="brand-sub">Solutions</span></Link>
        <nav aria-label="Main navigation"><Link href="/#experiences">Experiences</Link><Link href="/#about">About</Link><Link href="/#contact">Contact</Link></nav>
      </header>
      {children}
      <footer className="wrap footer"><Link href="/" className="brand">Stargaze Solutions</Link><p>See Singapore differently.</p><Link href="/fort-canning">Fort Canning trail</Link><Link href="/woodlands">Woodlands garden walk</Link></footer>
    </body></html>
  );
}
