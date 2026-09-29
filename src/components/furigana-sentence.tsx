"use client";

import { furiganaParts, segmentText } from "@/lib/tokenizer/furigana";
import type { TokenResult } from "@/lib/tokenizer/types";

// Le texte analysé tel qu'il est écrit, avec la lecture en petit au-dessus
// des kanji (furigana) : chaque mot se touche pour voir son sens. La
// ponctuation et les retours à la ligne du texte d'origine sont conservés.
export function FuriganaSentence({
  text,
  tokens,
  selectedPosition,
  showFurigana,
  onWordClick,
}: {
  text: string;
  tokens: TokenResult[];
  selectedPosition: number | null;
  showFurigana: boolean;
  onWordClick: (token: TokenResult) => void;
}) {
  return (
    <p className="text-xl leading-[2.4] whitespace-pre-wrap text-[var(--ink)] sm:text-2xl" lang="ja">
      {segmentText(text, tokens).map((segment, index) => {
        if (!segment.token) {
          return <span key={index}>{segment.text}</span>;
        }

        const token = segment.token;
        const isSelected = token.position === selectedPosition;

        return (
          <button
            key={index}
            type="button"
            onClick={() => onWordClick(token)}
            aria-pressed={isSelected}
            aria-label={token.reading ? `${token.surface} (${token.reading})` : token.surface}
            className={`cursor-pointer rounded-md px-0.5 transition-colors ${
              isSelected
                ? "bg-[var(--accent-soft)] text-[var(--accent-dark)]"
                : "hover:bg-[var(--tint)] underline decoration-[var(--line-strong)] decoration-dotted underline-offset-[6px]"
            }`}
          >
            {furiganaParts(token.surface, token.reading).map((part, partIndex) =>
              part.ruby ? (
                <ruby key={partIndex}>
                  {part.text}
                  <rt className={`text-[0.45em] font-normal text-[var(--muted)] ${showFurigana ? "" : "invisible"}`}>
                    {part.ruby}
                  </rt>
                </ruby>
              ) : (
                <span key={partIndex}>{part.text}</span>
              ),
            )}
          </button>
        );
      })}
    </p>
  );
}
