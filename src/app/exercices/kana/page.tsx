"use client";

import Link from "next/link";
import { useState } from "react";

import { KanaQuiz } from "@/components/kana-quiz";
import { KanaWritingQuiz } from "@/components/kana-writing-quiz";
import { FilterChips } from "@/components/reference-toolbar";

type Mode = "read" | "choice" | "write";

const MODES: Array<{ value: Mode; label: string }> = [
  { value: "read", label: "Lire" },
  { value: "choice", label: "QCM" },
  { value: "write", label: "Écrire" },
];

export default function KanaExercisePage() {
  const [mode, setMode] = useState<Mode>("read");

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
            Retrouve tous les kana et ceux que tu maîtrises déjà sur la{" "}
            <Link href="/kana" className="link-button text-sm!">
              page Kana
            </Link>
            .
          </p>
          <div className="mt-4">
            <FilterChips options={MODES} value={mode} onChange={setMode} label="Type d'exercice" />
          </div>
        </header>

        {mode === "write" ? <KanaWritingQuiz /> : <KanaQuiz key={mode} format={mode === "choice" ? "choice" : "type"} />}
      </div>
    </main>
  );
}
