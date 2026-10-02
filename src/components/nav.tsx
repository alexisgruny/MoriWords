"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { AccountButton } from "@/components/account-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { authClient } from "@/lib/auth/auth-client";
import { useCourseFinished } from "@/lib/course/course-status";

type NavLink = { href: string; label: string; description: string; icon: string; isPublic?: boolean };
type NavGroup = { title: string; links: NavLink[] };

// Trois menus au lieu d'une douzaine de liens alignés : chaque lien a une
// courte description pour qu'on sache où il mène. isPublic : visible sans
// compte (même liste que PUBLIC_PATHS dans src/proxy.ts).
const allGroups: NavGroup[] = [
  {
    title: "Apprendre",
    links: [
      { href: "/parcours", label: "Parcours débutant", description: "10 leçons pour bien commencer", icon: "🧭", isPublic: true },
      { href: "/lecons", label: "Leçons par niveau", description: "Cours N5 et N4 : grammaire, écrit, kanji", icon: "📖", isPublic: true },
      { href: "/", label: "Analyser un texte", description: "Colle du japonais, découvre ses mots", icon: "🔍" },
      { href: "/historique", label: "Mes textes", description: "Les textes déjà analysés", icon: "📄" },
      { href: "/decks", label: "Mes decks", description: "Tes cartes à réviser chaque jour", icon: "🗂️" },
      { href: "/vocabulaire", label: "Mon vocabulaire", description: "Tous les mots rencontrés", icon: "📚" },
    ],
  },
  {
    title: "S'entraîner",
    links: [
      { href: "/exercices", label: "Exercices", description: "Grammaire, conjugaison, kanji, kana", icon: "✍️" },
      { href: "/jeux", label: "Mini-jeux", description: "Memory, shiritori, mots croisés…", icon: "🎮", isPublic: true },
      { href: "/paliers", label: "Paliers", description: "Un examen blanc par niveau", icon: "🏅" },
    ],
  },
  {
    title: "Référence",
    links: [
      { href: "/kana", label: "Kana", description: "Hiragana et katakana", icon: "あ", isPublic: true },
      { href: "/kanji", label: "Kanji", description: "Classés par niveau, du N5 au N1", icon: "漢", isPublic: true },
      { href: "/grammaire", label: "Grammaire", description: "Les points expliqués avec exemples", icon: "文", isPublic: true },
      { href: "/conjugaison", label: "Conjugaison", description: "Les formes des verbes et adjectifs", icon: "変", isPublic: true },
    ],
  },
];

// Sans compte, seuls les liens publics (les autres mèneraient à la connexion).
const publicGroups: NavGroup[] = allGroups
  .map((group) => ({
    ...group,
    links: [
      ...(group.title === "Apprendre"
        ? [{ href: "/bienvenue", label: "Découvrir MoriWords", description: "Ce que l'appli peut faire pour toi", icon: "🌱" }]
        : []),
      ...group.links.filter((link) => link.isPublic),
    ],
  }))
  .filter((group) => group.links.length > 0);

function isActiveLink(href: string, pathname: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function LinkItem({ link, pathname, compact = false }: { link: NavLink; pathname: string; compact?: boolean }) {
  const isActive = isActiveLink(link.href, pathname);
  return (
    <Link
      href={link.href}
      aria-current={isActive ? "page" : undefined}
      className={`flex items-center gap-3 rounded-xl px-3 transition-colors ${compact ? "min-h-11 py-1.5" : "py-2"} ${
        isActive ? "bg-[var(--accent-soft)]" : "hover:bg-[var(--tint)]"
      }`}
    >
      <span
        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[var(--line)] bg-[var(--paper)] text-lg"
        aria-hidden="true"
      >
        {link.icon}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className={`font-semibold ${isActive ? "text-[var(--accent-dark)]" : "text-[var(--ink)]"}`}>{link.label}</span>
        <span className="text-xs text-[var(--muted)]">{link.description}</span>
      </span>
    </Link>
  );
}

// Barre de navigation : sur ordinateur, trois menus déroulants ; sur
// téléphone, un bouton ouvre les mêmes groupes en une colonne.
export default function Nav() {
  const pathname = usePathname();
  // Menu ouvert : titre d'un groupe (ordinateur) ou "mobile".
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const { data: session, isPending } = authClient.useSession();
  // Pendant le chargement de la session, la navigation complète (la plupart
  // des visites d'une page privée viennent d'un compte connecté).
  const isCourseFinished = useCourseFinished(session?.user.id);
  const baseGroups = isPending || session ? allGroups : publicGroups;
  // Parcours terminé (ou palier N5 réussi) : plus besoin de le proposer.
  const groups = isCourseFinished
    ? baseGroups.map((group) => ({ ...group, links: group.links.filter((link) => link.href !== "/parcours") }))
    : baseGroups;
  const navRef = useRef<HTMLDivElement>(null);

  // Referme les menus après une navigation, pendant le rendu plutôt que dans
  // un effet (motif recommandé par React pour un état dérivé d'une valeur).
  const [menuPathname, setMenuPathname] = useState(pathname);
  if (menuPathname !== pathname) {
    setMenuPathname(pathname);
    setOpenMenu(null);
  }

  // Échap ou clic ailleurs : referme.
  useEffect(() => {
    if (!openMenu) {
      return;
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenMenu(null);
      }
    }
    function handlePointerDown(event: PointerEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [openMenu]);

  const activeLabel = groups.flatMap((group) => group.links).find((link) => isActiveLink(link.href, pathname))?.label;

  return (
    <header ref={navRef} className="relative z-30 border-b border-[var(--line)] bg-[var(--paper)] px-5 sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2.5 text-[var(--ink)]">
          <span className="seal" aria-hidden="true">
            森
          </span>
          <span className="text-xl font-extrabold" lang="fr">
            MoriWords
          </span>
        </Link>

        <nav aria-label="Navigation principale" className="hidden items-center gap-1 md:flex">
          {groups.map((group) => {
            const isOpen = openMenu === group.title;
            const hasActive = group.links.some((link) => isActiveLink(link.href, pathname));
            return (
              <div key={group.title} className="relative">
                <button
                  type="button"
                  onClick={() => setOpenMenu(isOpen ? null : group.title)}
                  aria-expanded={isOpen}
                  className={`flex h-10 cursor-pointer items-center gap-1.5 rounded-full px-4 text-base font-semibold transition-colors ${
                    isOpen || hasActive ? "bg-[var(--tint)] text-[var(--ink)]" : "text-[var(--muted)] hover:text-[var(--ink)]"
                  }`}
                >
                  {group.title}
                  <svg
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                {isOpen ? (
                  <div className="fade-in-up absolute top-full left-1/2 z-30 mt-2 w-80 -translate-x-1/2 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-2 shadow-[0_16px_40px_-16px_rgb(0_0_0/0.35)]">
                    <ul className="flex flex-col gap-0.5">
                      {group.links.map((link) => (
                        <li key={link.href}>
                          <LinkItem link={link} pathname={pathname} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <AccountButton />
          <button
            type="button"
            onClick={() => setOpenMenu((open) => (open === "mobile" ? null : "mobile"))}
            aria-expanded={openMenu === "mobile"}
            aria-controls="mobile-menu"
            className="flex h-9 cursor-pointer items-center gap-2 rounded-full border border-[var(--line-strong)] bg-[var(--paper)] px-3.5 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--ink)] max-sm:px-2.5 md:hidden"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {openMenu === "mobile" ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
            {/* Sur téléphone, icône seule : avec le bouton Connexion, le libellé
                faisait déborder la barre (390 px). */}
            <span className="max-sm:sr-only">{openMenu === "mobile" ? "Fermer" : (activeLabel ?? "Menu")}</span>
          </button>
        </div>
      </div>

      {openMenu === "mobile" ? (
        <>
          {/* Voile sous la barre (61px = sa hauteur) : toucher ailleurs referme. */}
          <div
            className="fixed inset-x-0 top-[61px] bottom-0 z-20 bg-[rgb(0_0_0/0.25)] md:hidden"
            onClick={() => setOpenMenu(null)}
            aria-hidden="true"
          />
          <nav
            id="mobile-menu"
            aria-label="Navigation principale"
            className="fade-in-up absolute inset-x-0 top-full z-30 max-h-[calc(100dvh-61px)] overflow-y-auto border-b border-[var(--line)] bg-[var(--paper)] px-5 pt-3 pb-5 shadow-[0_16px_32px_-16px_rgb(0_0_0/0.3)] sm:px-8 md:hidden"
          >
            <div className="mx-auto flex max-w-6xl flex-col gap-4">
              {groups.map((group) => (
                <div key={group.title}>
                  <p className="eyebrow mb-1 px-3">{group.title}</p>
                  <ul className="flex flex-col gap-0.5">
                    {group.links.map((link) => (
                      <li key={link.href}>
                        <LinkItem link={link} pathname={pathname} compact />
                      </li>
                    ))}
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
