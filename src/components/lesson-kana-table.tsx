"use client";

import Link from "next/link";
import { useState } from "react";

import { CharacterDialog } from "@/components/character-dialog";
import { KANA, KANA_GROUP_LABELS, type KanaEntry, type KanaGroup } from "@/lib/kana/kana";

// Les kana d'une leçon, directement dans la leçon (plus besoin d'aller sur
// la page Kana pour les apprendre) : toucher un kana ouvre son ordre des
// traits animé et le tracé.
export function LessonKanaTable({ script, groups }: { script: "hiragana" | "katakana"; groups: KanaGroup[] }) {
  const [opened, setOpened] = useState<KanaEntry | null>(null);

  return (
    <section className="panel" aria-labelledby="lesson-kana-title">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="lesson-kana-title" className="text-lg font-bold text-[var(--ink)]">
          Les kana de la leçon
        </h2>
        <Link href="/kana" className="link-button text-sm!">
          Page Kana complète →
        </Link>
      </div>
      <p className="mt-1 text-sm text-[var(--muted)]">Touche un kana pour voir comment il s&apos;écrit, trait par trait.</p>

      {groups.map((group) => {
        const entries = KANA.filter((entry) => entry.script === script && entry.group === group);
        return (
          <div key={group} className="mt-4">
            {groups.length > 1 ? <p className="eyebrow mb-2">{KANA_GROUP_LABELS[group]}</p> : null}
            <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-8">
              {entries.map((entry) => (
                <button
                  key={entry.kana}
                  type="button"
                  onClick={() => setOpened(entry)}
                  aria-label={`${entry.kana} (${entry.romaji}) : voir l'ordre des traits`}
                  className="flex cursor-pointer flex-col items-center rounded-xl border border-[var(--line)] bg-[var(--paper)] py-2 transition hover:border-[var(--accent)]"
                >
                  <span className="text-2xl font-bold leading-tight text-[var(--ink)]" lang="ja">
                    {entry.kana}
                  </span>
                  <span className="text-xs font-semibold text-[var(--accent-dark)]">{entry.romaji}</span>
                </button>
              ))}
            </div>
          </div>
        );
      })}

      <CharacterDialog
        character={opened?.kana ?? null}
        details={opened ? <span className="font-semibold text-[var(--accent-dark)]">{opened.romaji}</span> : null}
        onClose={() => setOpened(null)}
      />
    </section>
  );
}
