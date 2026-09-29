import Link from "next/link";

const EXERCISE_TYPES = [
  {
    href: "/exercices/kana",
    glyph: "あ",
    title: "Hiragana et katakana",
    description: "Lis-les (au clavier ou en QCM) et apprends à les écrire. Idéal pour débuter.",
  },
  {
    href: "/exercices/grammaire",
    glyph: "文",
    title: "Grammaire",
    description: "Des phrases simples de ton niveau JLPT, en QCM ou à traduire toi-même.",
  },
  {
    href: "/exercices/conjugaison",
    glyph: "活",
    title: "Conjugaison",
    description: "Retrouve la bonne forme d'un verbe (ます, ない, て…), en QCM ou à écrire.",
  },
  {
    href: "/exercices/kanji",
    glyph: "字",
    title: "Kanji",
    description: "Son sens, sa lecture, et comment l'écrire trait par trait.",
  },
  {
    href: "/exercices/vocabulaire",
    glyph: "語",
    title: "Mon vocabulaire",
    description: "Des phrases avec les mots de tes decks, pour les réutiliser.",
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
              Choisis un exercice. Pour commencer en douceur, prends le mode QCM ; ensuite, écris
              tes réponses toi-même.
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
