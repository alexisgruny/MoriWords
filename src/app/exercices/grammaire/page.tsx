import Link from "next/link";

import { TranslationExercise } from "@/components/translation-exercise";
import { grammarPoints } from "@/lib/grammar/points";

export default async function GrammarExercisePage({ searchParams }: PageProps<"/exercices/grammaire">) {
  const { point: pointId } = await searchParams;
  const point = grammarPoints.find((candidate) => candidate.id === pointId);

  return (
    <main className="flex-1 px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <p className="text-sm">
            <Link href="/exercices" className="link-button text-sm!">
              ← Tous les exercices
            </Link>
          </p>
          <h1 className="mt-3 text-[var(--ink)]">{point ? "S'entraîner sur un point" : "Exercice de grammaire"}</h1>
          {point ? (
            <p className="mt-2 text-lg text-[var(--ink)]">
              <span className="font-semibold" lang="ja">
                {point.pattern}
              </span>{" "}
              <span className="text-[var(--muted)]">· {point.meaning}</span>
            </p>
          ) : null}
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Retrouve les points de grammaire par niveau sur la{" "}
            <Link href="/grammaire" className="link-button text-sm!">
              page Grammaire
            </Link>
            .
          </p>
        </header>

        {point ? (
          <TranslationExercise key={point.id} source="grammar" focusIn={[point.pattern]} defaultFormat="choice" />
        ) : (
          <TranslationExercise source="grammar" />
        )}
      </div>
    </main>
  );
}
