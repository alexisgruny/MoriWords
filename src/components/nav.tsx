"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { ThemeToggle } from "@/components/theme-toggle";

// Les pages du site, regroupées pour le menu mobile (sur grand écran elles
// sont simplement alignées dans cet ordre).
const groups = [
  {
    title: "Apprendre",
    links: [
      { href: "/", label: "Analyser" },
      { href: "/decks", label: "Decks" },
      { href: "/exercices", label: "Exercices" },
    ],
  },
  {
    title: "Référence",
    links: [
      { href: "/kana", label: "Kana" },
      { href: "/vocabulaire", label: "Vocabulaire" },
      { href: "/grammaire", label: "Grammaire" },
      { href: "/conjugaison", label: "Conjugaison" },
      { href: "/kanji", label: "Kanji" },
    ],
  },
  {
    title: "Suivi",
    links: [{ href: "/historique", label: "Historique" }],
  },
];

const links = groups.flatMap((group) => group.links);

function isActiveLink(href: string, pathname: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

// Barre de navigation affichée en haut de toutes les pages, avec le lien
// actif mis en évidence. Sous la largeur "xl", les 9 liens ne tiennent pas
// sur une ligne (ils défilaient horizontalement, coupés en plein mot) : ils
// passent dans un menu déroulant ouvert par un bouton.
export default function Nav() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Referme le menu après une navigation, pendant le rendu plutôt que dans
  // un effet (motif recommandé par React pour un état dérivé d'une valeur).
  const [menuPathname, setMenuPathname] = useState(pathname);
  if (menuPathname !== pathname) {
    setMenuPathname(pathname);
    setIsMenuOpen(false);
  }

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMenuOpen]);

  const activeLabel = links.find((link) => isActiveLink(link.href, pathname))?.label;

  return (
    <header className="relative z-30 border-b border-[var(--line)] bg-[var(--paper)] px-5 sm:px-8 xl:px-12">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 py-3 xl:items-end xl:pt-4 xl:pb-0">
        <Link href="/" className="flex shrink-0 items-center gap-2.5 text-[var(--ink)] xl:mb-3">
          <span className="seal" aria-hidden="true">
            森
          </span>
          <span className="text-xl font-extrabold" lang="fr">
            MoriWords
          </span>
        </Link>

        <nav aria-label="Navigation principale" className="hidden gap-6 xl:flex">
          {links.map((link) => {
            const isActive = isActiveLink(link.href, pathname);

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={`nav-link whitespace-nowrap text-base font-semibold transition-colors ${
                  isActive ? "text-[var(--ink)]" : "text-[var(--muted)] hover:text-[var(--ink)]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2 xl:mb-3">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            className="flex h-9 cursor-pointer items-center gap-2 rounded-full border border-[var(--line-strong)] bg-[var(--paper)] px-3.5 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--ink)] xl:hidden"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {isMenuOpen ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
            <span>{isMenuOpen ? "Fermer" : (activeLabel ?? "Menu")}</span>
          </button>
        </div>
      </div>

      {isMenuOpen ? (
        <>
          {/* Voile cliquable pour refermer le menu en touchant ailleurs. Il
              commence sous la barre (61px = hauteur de la barre compacte)
              pour ne pas recouvrir le bouton "Fermer". */}
          <div
            className="fixed inset-x-0 top-[61px] bottom-0 z-20 bg-[rgb(0_0_0/0.25)] xl:hidden"
            onClick={() => setIsMenuOpen(false)}
            aria-hidden="true"
          />
          <nav
            id="mobile-menu"
            aria-label="Navigation principale"
            className="fade-in-up absolute inset-x-0 top-full z-30 border-b border-[var(--line)] bg-[var(--paper)] px-5 pt-3 pb-5 shadow-[0_16px_32px_-16px_rgb(0_0_0/0.3)] sm:px-8 xl:hidden"
          >
            <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-3">
              {groups.map((group) => (
                <div key={group.title}>
                  <p className="eyebrow mb-1.5">{group.title}</p>
                  <ul className="flex flex-col gap-1">
                    {group.links.map((link) => {
                      const isActive = isActiveLink(link.href, pathname);

                      return (
                        <li key={link.href}>
                          <Link
                            href={link.href}
                            aria-current={isActive ? "page" : undefined}
                            className={`flex min-h-11 items-center rounded-xl px-3 text-base font-semibold transition-colors ${
                              isActive
                                ? "bg-[var(--accent-soft)] text-[var(--accent-dark)]"
                                : "text-[var(--ink)] hover:bg-[var(--tint)]"
                            }`}
                          >
                            {link.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </nav>
        </>
      ) : null}
    </header>
  );
}
