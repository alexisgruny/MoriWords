import Link from "next/link";

import { TranslationExercise } from "@/components/translation-exercise";

export default function ConjugationExercisePage() {
  return (
    <main className="flex-1 px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <p className="text-sm">
            <Link href="/exercices" className="link-button text-sm!">
              ← Tous les exercices
            </Link>
          </p>
          <h1 className="mt-3 text-[var(--ink)]">Exercice de conjugaison</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Retrouve les formes de conjugaison par niveau sur la{" "}
            <Link href="/conjugaison" className="link-button text-sm!">
              page Conjugaison
            </Link>
            .
          </p>
        </header>

        <TranslationExercise source="conjugation" />
      </div>
    </main>
  );
}
