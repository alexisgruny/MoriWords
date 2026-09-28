import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Mentions légales · MoriWords" };

// Mentions légales (LCEN). Quand le site deviendra payant, ajouter le statut
// (micro-entreprise), le SIRET et une adresse de contact professionnelle.
export default function LegalNoticePage() {
  return (
    <main className="flex-1 px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-3xl">
        <header className="fade-in-up mb-6">
          <h1 className="text-[var(--ink)]">Mentions légales</h1>
        </header>
        <article className="panel flex flex-col gap-6 text-[var(--ink)]">
          <section>
            <h2>Éditeur</h2>
            <p className="mt-2">MoriWords est un projet personnel édité par Alexis Gruny.</p>
            <p className="mt-2">
              Contact : via le{" "}
              <a
                href="https://github.com/alexisgruny/MoriWords/issues"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-[var(--accent)]"
              >
                dépôt GitHub du projet
              </a>
              .
            </p>
          </section>
          <section>
            <h2>Hébergement</h2>
            <p className="mt-2">
              Site : Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis (vercel.com).
            </p>
            <p className="mt-2">Base de données : Neon (neon.tech).</p>
          </section>
          <section>
            <h2>Contenus</h2>
            <p className="mt-2">
              {
                "Les traductions, explications, phrases d'exemple et corrections sont générées automatiquement par une intelligence artificielle (Claude, d'Anthropic) et peuvent contenir des erreurs. Les sources des listes JLPT et des kanji sont indiquées en bas de chaque page."
              }
            </p>
          </section>
          <p className="text-sm text-[var(--muted)]">
            Données personnelles : voir la{" "}
            <Link href="/confidentialite" className="underline hover:text-[var(--ink)]">
              politique de confidentialité
            </Link>
            .
          </p>
        </article>
      </div>
    </main>
  );
}
