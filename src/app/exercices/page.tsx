import Link from "next/link";

const EXERCISE_TYPES = [
  {
    href: "/exercices/grammaire",
    title: "Grammaire",
    description: "Traduis des phrases construites autour des points de grammaire par niveau JLPT.",
  },
  {
    href: "/exercices/conjugaison",
    title: "Conjugaison",
    description: "Traduis des phrases qui utilisent les formes verbales et adjectivales à réviser.",
  },
  {
    href: "/exercices/kanji",
    title: "Kanji",
    description: "Regarde un kanji et écris son sens en français.",
  },
  {
    href: "/exercices/vocabulaire",
    title: "Mon vocabulaire",
    description: "Traduis des phrases construites autour des mots déjà ajoutés à tes decks.",
  },
];

// Page d'accueil des exercices : un choix de type d'exercice, chacun sur sa
// propre sous-page (composant TranslationExercise avec un source fixe).
export default function ExercisesPage() {
  return (
    <main className="flex-1 px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[var(--ink)]">Exercices</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Choisis un type d&apos;exercice : traduis une phrase en japonais (corrigée par
              Claude) ou retrouve le sens d&apos;un kanji.
            </p>
          </div>
          <Link href="/exercices/stats" className="secondary-button shrink-0">
            Mes statistiques
          </Link>
        </header>

        <div className="grid gap-3 sm:grid-cols-2">
          {EXERCISE_TYPES.map((type) => (
            <Link key={type.href} href={type.href} className="token-card block">
              <span className="text-lg font-semibold text-[var(--ink)]">{type.title}</span>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{type.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
