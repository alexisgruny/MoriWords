"use client";

import { useState } from "react";

import { CharacterDialog } from "@/components/character-dialog";
import { readingsToSpeak } from "@/lib/speech";

type LessonKanjiEntry = { kanji: string; meaning: string; onReadings: string[]; kunReadings: string[] };

// Lectures lisibles : sans le tiret (préfixe/suffixe) ni le point (okurigana)
// du dictionnaire (-あ.がり → あがり), sans doublon.
const readingsOf = (entry: LessonKanjiEntry) => [...new Set([...entry.kunReadings, ...entry.onReadings].map((reading) => reading.replace(/[.-]/g, "")))];

// Kanji à apprendre dans une leçon : une carte par kanji, et au toucher la
// fenêtre habituelle (ordre des traits animé, puis tracé à la main).
export function LessonKanji({ kanji }: { kanji: LessonKanjiEntry[] }) {
  const [opened, setOpened] = useState<LessonKanjiEntry | null>(null);

  return (
    <section className="panel" aria-labelledby="lesson-kanji-title">
      <h2 id="lesson-kanji-title" className="text-lg font-bold text-[var(--ink)]">
        Les kanji de la leçon
      </h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Touche un kanji pour voir l&apos;ordre des traits, puis entraîne-toi à le tracer.
      </p>
      <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {kanji.map((entry) => (
          <li key={entry.kanji}>
            <button
              type="button"
              onClick={() => setOpened(entry)}
              className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-[var(--line)] px-3 py-2 text-left transition hover:border-[var(--ink)]"
            >
              <span className="text-4xl font-semibold text-[var(--ink)]" lang="ja">
                {entry.kanji}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="text-sm font-semibold text-[var(--ink)]">{entry.meaning}</span>
                <span className="truncate text-xs text-[var(--muted)]" lang="ja">
                  {readingsOf(entry).slice(0, 3).join("・")}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <CharacterDialog
        character={opened?.kanji ?? null}
        speech={opened ? readingsToSpeak([...opened.kunReadings, ...opened.onReadings]) : undefined}
        details={
          opened ? (
            <>
              <span className="font-semibold text-[var(--ink)]">{opened.meaning}</span>
              <span className="block text-sm text-[var(--muted)]" lang="ja">
                {readingsOf(opened).join("・")}
              </span>
            </>
          ) : null
        }
        onClose={() => setOpened(null)}
      />
    </section>
  );
}
