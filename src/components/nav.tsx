"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

// Les pages du site accessibles depuis la barre de navigation.
const links = [
  { href: "/", label: "Analyser" },
  { href: "/decks", label: "Decks" },
  { href: "/vocabulaire", label: "Vocabulaire" },
  { href: "/grammaire", label: "Grammaire" },
  { href: "/historique", label: "Historique" },
];

// Barre de navigation affichée en haut de toutes les pages, avec le lien
// actif mis en évidence selon la page actuellement affichée.
export default function Nav() {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);

  // Sur petit écran la barre défile horizontalement : garde le lien actif
  // visible (sinon « Grammaire » ou « Historique » restent hors écran).
  useEffect(() => {
    const activeLink = navRef.current?.querySelector('[aria-current="page"]');
    activeLink?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [pathname]);

  return (
    <header className="border-b border-[var(--line)] bg-[var(--paper)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:gap-4 sm:px-8 lg:px-12">
        <Link href="/" className="shrink-0 text-lg font-semibold tracking-tight text-[var(--ink)]">
          MoriWords
        </Link>
        {/* min-w-0 laisse ce flex item se réduire sous sa taille de contenu,
            sinon overflow-x-auto n'a aucun effet et la barre déborde de
            l'écran sur mobile (déjà arrivé avec seulement 3 liens). */}
        <nav ref={navRef} className="flex min-w-0 gap-0.5 overflow-x-auto sm:gap-2">
          {links.map((link) => {
            // Compare l'URL actuelle au lien pour savoir s'il faut le mettre en évidence.
            const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-2 text-sm font-medium transition sm:px-4 ${
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
