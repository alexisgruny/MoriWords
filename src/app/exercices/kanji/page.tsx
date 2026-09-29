"use client";

import Link from "next/link";
import { useState } from "react";

import { KanjiWritingExercise } from "@/components/kanji-writing-exercise";
import { FilterChips } from "@/components/reference-toolbar";
import { TranslationExercise } from "@/components/translation-exercise";

type Mode = "kanji" | "kanji-reading" | "kanji-writing";

const MODES: Array<{ value: Mode; label: string }> = [
  { value: "kanji", label: "Kanji → français" },
  { value: "kanji-reading", label: "Kanji → lecture" },
  { value: "kanji-writing", label: "Écrire le kanji" },
];

export default function KanjiExercisePage() {
  const [mode, setMode] = useState<Mode>("kanji");

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
            Retrouve les kanji par niveau, et ceux que tu maîtrises déjà, sur la{" "}
            <Link href="/kanji" className="link-button text-sm!">
              page Kanji
            </Link>
            .
          </p>
          <div className="mt-4">
            <FilterChips options={MODES} value={mode} onChange={setMode} label="Sens de l'exercice" />
          </div>
        </header>

        {/* key : changer de sens repart d'une session neuve. */}
        {mode === "kanji-writing" ? <KanjiWritingExercise /> : <TranslationExercise key={mode} source={mode} />}
      </div>
    </main>
  );
}
