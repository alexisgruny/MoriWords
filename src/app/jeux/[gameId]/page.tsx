import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ChronoGame } from "@/components/games/chrono-game";
import { CrosswordGame } from "@/components/games/crossword-game";
import { MemoryGame } from "@/components/games/memory-game";
import { ParticlesGame } from "@/components/games/particles-game";
import { ShiritoriGame } from "@/components/games/shiritori-game";
import { GAMES, findGame } from "@/lib/games/catalog";
import type { GameId } from "@/lib/games/records";

const COMPONENTS: Record<GameId, () => React.ReactNode> = {
  memory: MemoryGame,
  chrono: ChronoGame,
  particules: ParticlesGame,
  shiritori: ShiritoriGame,
  "mots-croises": CrosswordGame,
};

export function generateStaticParams() {
  return GAMES.map((game) => ({ gameId: game.id }));
}

export async function generateMetadata({ params }: PageProps<"/jeux/[gameId]">): Promise<Metadata> {
  const game = findGame((await params).gameId);
  return { title: game ? `${game.title} · Mini-jeux MoriWords` : "Mini-jeux · MoriWords", description: game?.summary };
}

export default async function GamePage({ params }: PageProps<"/jeux/[gameId]">) {
  const game = findGame((await params).gameId);
  if (!game) {
    notFound();
  }
  const Game = COMPONENTS[game.id];

  return (
    <main className="flex-1 px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-2xl flex-col gap-5">
        <header className="fade-in-up">
          <p className="text-sm">
            <Link href="/jeux" className="link-button text-sm!">
              ← Mini-jeux
            </Link>
          </p>
          <h1 className="mt-2 text-2xl! text-[var(--ink)]">
            <span aria-hidden="true">{game.icon}</span> {game.title}
          </h1>
        </header>
        <Game />
      </div>
    </main>
  );
}
