import Link from "next/link";

import { TranslationExercise } from "@/components/translation-exercise";

export default function KanjiExercisePage() {
  return (
    <main className="flex-1 px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <p className="text-sm">
            <Link href="/exercices" className="link-button text-sm!">
              ← Tous les exercices
            </Link>
          </p>
          <h1 className="mt-3 text-[var(--ink)]">Exercice de kanji</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Retrouve les kanji par niveau sur la{" "}
            <Link href="/kanji" className="link-button text-sm!">
              page Kanji
            </Link>
            .
          </p>
        </header>

        <TranslationExercise source="kanji" />
      </div>
    </main>
  );
}
