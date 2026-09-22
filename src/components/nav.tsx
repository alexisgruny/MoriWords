"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Les pages du site accessibles depuis la barre de navigation.
const links = [
  { href: "/", label: "Analyser" },
  { href: "/decks", label: "Decks" },
  { href: "/vocabulaire", label: "Vocabulaire" },
];

// Barre de navigation affichée en haut de toutes les pages, avec le lien
// actif mis en évidence selon la page actuellement affichée.
export default function Nav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-[var(--line)] bg-[var(--paper)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-12">
        <Link href="/" className="text-lg font-semibold tracking-tight text-[var(--ink)]">
          MoriWords
        </Link>
        <nav className="flex gap-1 sm:gap-2">
          {links.map((link) => {
            // Compare l'URL actuelle au lien pour savoir s'il faut le mettre en évidence.
            const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-3 py-2 text-sm font-medium transition sm:px-4 ${
                  isActive
                    ? "bg-[var(--accent-soft)] text-[var(--ink)]"
                    : "text-[var(--muted)] hover:bg-[var(--background)]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
