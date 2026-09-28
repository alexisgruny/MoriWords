import Link from "next/link";

import { KanaQuiz } from "@/components/kana-quiz";

export default function KanaExercisePage() {
  return (
    <main className="flex-1 px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <p className="text-sm">
            <Link href="/exercices" className="link-button text-sm!">
              ← Tous les exercices
            </Link>
          </p>
          <h1 className="mt-3 text-[var(--ink)]">Exercice de hiragana et katakana</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Retrouve tous les kana et leur prononciation sur la{" "}
            <Link href="/kana" className="link-button text-sm!">
              page Kana
            </Link>
            .
          </p>
        </header>

        <KanaQuiz />
      </div>
    </main>
  );
}
