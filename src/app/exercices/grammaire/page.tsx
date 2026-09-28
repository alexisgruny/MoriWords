import Link from "next/link";

import { TranslationExercise } from "@/components/translation-exercise";

export default function GrammarExercisePage() {
  return (
    <main className="flex-1 px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <p className="text-sm">
            <Link href="/exercices" className="link-button text-sm!">
              ← Tous les exercices
            </Link>
          </p>
          <h1 className="mt-3 text-[var(--ink)]">Exercice de grammaire</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Retrouve les points de grammaire par niveau sur la{" "}
            <Link href="/grammaire" className="link-button text-sm!">
              page Grammaire
            </Link>
            .
          </p>
        </header>

        <TranslationExercise source="grammar" />
      </div>
    </main>
  );
}
