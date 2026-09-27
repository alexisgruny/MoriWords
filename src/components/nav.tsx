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
    <header className="border-b border-[var(--line)] bg-[var(--paper)] px-5 sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-6xl items-end justify-between gap-4 pt-4">
        <Link href="/" className="mb-3 flex shrink-0 items-center gap-2.5 text-[var(--ink)]">
          <span className="seal" aria-hidden="true">
            森
          </span>
          <span className="text-xl font-extrabold" lang="fr">
            MoriWords
          </span>
        </Link>
        {/* min-w-0 laisse ce flex item se réduire sous sa taille de contenu,
            sinon overflow-x-auto n'a aucun effet et la barre déborde de
            l'écran sur mobile (déjà arrivé avec seulement 3 liens). */}
        <nav ref={navRef} className="flex min-w-0 gap-4 overflow-x-auto overflow-y-hidden sm:gap-6">
          {links.map((link) => {
            // Compare l'URL actuelle au lien pour savoir s'il faut le mettre en évidence.
            const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={`shrink-0 whitespace-nowrap border-b-[3px] pb-3 text-base font-semibold transition ${
                  isActive
                    ? "border-[var(--accent)] text-[var(--ink)]"
                    : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
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
