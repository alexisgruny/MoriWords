import Link from "next/link";

const EXERCISE_TYPES = [
  {
    href: "/exercices/grammaire",
    glyph: "文",
    title: "Grammaire",
    description: "Traduis des phrases construites autour des points de grammaire par niveau JLPT.",
  },
  {
    href: "/exercices/conjugaison",
    glyph: "活",
    title: "Conjugaison",
    description: "Traduis des phrases qui utilisent les formes verbales et adjectivales à réviser.",
  },
  {
    href: "/exercices/kanji",
    glyph: "字",
    title: "Kanji",
    description: "Regarde un kanji et écris son sens en français.",
  },
  {
    href: "/exercices/vocabulaire",
    glyph: "語",
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
        <header className="fade-in-up mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-1">S&apos;entraîner</p>
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
          {EXERCISE_TYPES.map((type, index) => (
            <Link
              key={type.href}
              href={type.href}
              className="token-card group fade-in-up mb-0! flex items-center gap-4"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <span
                className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-[var(--accent-soft)] text-2xl font-bold text-[var(--accent-dark)]"
                lang="ja"
                aria-hidden="true"
              >
                {type.glyph}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-semibold text-[var(--ink)]">{type.title}</span>
                <span className="mt-1 block text-sm leading-6 text-[var(--muted)]">{type.description}</span>
              </span>
              <span
                className="shrink-0 text-xl text-[var(--muted)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--accent-dark)]"
                aria-hidden="true"
              >
                →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
