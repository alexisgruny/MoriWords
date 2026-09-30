"use client";

import type { Ref } from "react";
import { toKana } from "wanakana";

// Champ en kana : le romaji tapé est converti au fil de la saisie (« neko » →
// ねこ). Le clavier japonais du téléphone marche aussi. IMEMode garde le « n »
// final en attente (pour taper « na » sans obtenir « んa »).
export function KanaInput({
  value,
  onChange,
  label,
  inputRef,
  maxLength = 12,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  inputRef?: Ref<HTMLInputElement>;
  maxLength?: number;
}) {
  return (
    <input
      ref={inputRef}
      value={value}
      onChange={(event) => onChange(toKana(event.target.value, { IMEMode: true }).slice(0, maxLength))}
      aria-label={label}
      placeholder="Tape en romaji ou en kana"
      lang="ja"
      autoComplete="off"
      autoCapitalize="off"
      autoCorrect="off"
      spellCheck={false}
      className="min-h-12 w-full min-w-0 flex-1 rounded-xl border border-[var(--line-strong)] bg-[var(--paper)] px-3 text-lg text-[var(--ink)]"
    />
  );
}
