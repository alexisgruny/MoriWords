import Link from "next/link";

// Page introuvable (lien cassé, leçon ou jeu qui n'existe pas).
export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center px-5 py-16">
      <div className="panel max-w-md text-center">
        <p className="text-5xl" lang="ja" aria-hidden="true">
          迷子
        </p>
        <h1 className="mt-3 text-2xl! text-[var(--ink)]">Page introuvable</h1>
        <p className="mt-2 text-[var(--muted)]">
          Cette page n&apos;existe pas (ou plus). 迷子 (maigo) veut dire « perdu » : ça arrive à tout le monde.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link href="/" className="primary-button">
            Retour à l&apos;accueil
          </Link>
          <Link href="/parcours" className="secondary-button">
            Parcours débutant
          </Link>
        </div>
      </div>
    </main>
  );
}
