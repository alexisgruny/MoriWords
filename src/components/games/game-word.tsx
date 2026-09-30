import type { GameWord } from "@/lib/games/words";

// Mot japonais avec sa lecture en dessous quand il est écrit en kanji.
export function GameWordLabel({ word, size = "lg" }: { word: GameWord; size?: "lg" | "xl" }) {
  return (
    <span className="flex flex-col items-center leading-tight" lang="ja">
      <span className={size === "xl" ? "text-4xl font-semibold" : "text-lg font-semibold"}>{word.written}</span>
      {word.written !== word.kana ? (
        <span className={size === "xl" ? "mt-1 text-base text-[var(--muted)]" : "text-xs text-[var(--muted)]"}>{word.kana}</span>
      ) : null}
    </span>
  );
}

export function RecordLine({ record, unit }: { record: number | null; unit: string }) {
  return (
    <p className="text-sm text-[var(--muted)]">
      Record : {record === null ? "pas encore de partie" : `${record} ${unit}`}
    </p>
  );
}
