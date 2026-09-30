"use client";

import Link from "next/link";
import { useEffect } from "react";

// Erreur inattendue dans une page : message en français, sans détail
// technique, et un bouton pour réessayer.
export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 items-center justify-center px-5 py-16">
      <div className="panel max-w-md text-center">
        <h1 className="text-2xl! text-[var(--ink)]">Oups, un souci est survenu</h1>
        <p className="mt-2 text-[var(--muted)]">
          La page n&apos;a pas pu s&apos;afficher. Réessaie dans un instant ; si ça continue, reviens à l&apos;accueil.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => retry()} className="primary-button">
            Réessayer
          </button>
          <Link href="/" className="secondary-button">
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </main>
  );
}
