import type { Metadata } from "next";
import Link from "next/link";

import { GAMES } from "@/lib/games/catalog";

export const metadata: Metadata = {
  title: "Mini-jeux · MoriWords",
  description: "Des mini-jeux pour réviser le japonais N5 : memory, contre la montre, particules, shiritori et mots croisés.",
};

export default function GamesPage() {
  return (
    <main className="flex-1 px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <header className="fade-in-up">
          <p className="eyebrow mb-1">Pour s&apos;amuser</p>
          <h1 className="text-[var(--ink)]">Mini-jeux</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Des parties courtes avec le vocabulaire et la grammaire du niveau N5. Pas besoin de compte : tes records restent
            sur cet appareil.
          </p>
        </header>
        <ul className="grid gap-3 sm:grid-cols-2">
          {GAMES.map((game) => (
            <li key={game.id}>
              <Link
                href={`/jeux/${game.id}`}
                className="panel flex h-full items-start gap-3 transition hover:border-[var(--ink)]"
              >
                <span className="text-3xl" aria-hidden="true">
                  {game.icon}
                </span>
                <span className="flex flex-col">
                  <span className="text-lg font-bold text-[var(--ink)]">{game.title}</span>
                  <span className="text-xs font-semibold text-[var(--accent)]">{game.skill}</span>
                  <span className="mt-1 text-sm text-[var(--muted)]">{game.summary}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
