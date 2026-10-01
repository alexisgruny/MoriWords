import type { Metadata } from "next";
import Link from "next/link";

import { RetryButton } from "./retry-button";

export const metadata: Metadata = { title: "Hors ligne · MoriWords", robots: { index: false } };

// Page servie par le service worker (public/sw.js) quand une page jamais
// visitée est demandée sans réseau.
export default function OfflinePage() {
  return (
    <main className="flex flex-1 items-center justify-center px-5 py-16">
      <div className="panel max-w-md text-center">
        <p className="text-4xl" aria-hidden="true">
          📶
        </p>
        <h1 className="mt-3 text-2xl! text-[var(--ink)]">Pas de connexion</h1>
        <p className="mt-2 text-[var(--muted)]">
          Cette page n&apos;est pas encore disponible hors ligne. Les pages déjà ouvertes, comme les kana et les mini-jeux,
          restent accessibles.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <RetryButton />
          <Link href="/kana" className="secondary-button">
            Kana
          </Link>
          <Link href="/jeux" className="secondary-button">
            Mini-jeux
          </Link>
        </div>
      </div>
    </main>
  );
}
