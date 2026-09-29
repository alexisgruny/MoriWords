import Link from "next/link";

import { TranslationExercise } from "@/components/translation-exercise";
import { conjugationForms } from "@/lib/conjugation/forms";

export default async function ConjugationExercisePage({ searchParams }: PageProps<"/exercices/conjugaison">) {
  const { forme: formId } = await searchParams;
  const form = conjugationForms.find((candidate) => candidate.id === formId);

  return (
    <main className="flex-1 px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <p className="text-sm">
            <Link href="/exercices" className="link-button text-sm!">
              ← Tous les exercices
            </Link>
          </p>
          <h1 className="mt-3 text-[var(--ink)]">{form ? "S'entraîner sur une forme" : "Exercice de conjugaison"}</h1>
          {form ? <p className="mt-2 text-lg font-semibold text-[var(--ink)]">{form.name}</p> : null}
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Retrouve les formes de conjugaison par niveau sur la{" "}
            <Link href="/conjugaison" className="link-button text-sm!">
              page Conjugaison
            </Link>
            .
          </p>
        </header>

        {form ? (
          <TranslationExercise key={form.id} source="conjugation" focusIn={[form.name]} defaultFormat="choice" />
        ) : (
          <TranslationExercise source="conjugation" />
        )}
      </div>
    </main>
  );
}
