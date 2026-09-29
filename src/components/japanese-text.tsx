"use client";

import { useEffect, useState } from "react";

import { SpeakButton } from "@/components/speak-button";
import { furiganaParts, segmentText } from "@/lib/tokenizer/furigana";
import type { TokenResult } from "@/lib/tokenizer/types";

// Découpe déjà faite pour une phrase (les mêmes reviennent souvent dans un
// exercice : choix du QCM, référence...), pour ne pas la redemander.
const tokenCache = new Map<string, Promise<TokenResult[] | null>>();

function tokenize(text: string): Promise<TokenResult[] | null> {
  let pending = tokenCache.get(text);
  if (!pending) {
    pending = fetch("/api/tokenize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    })
      .then(async (response) => (response.ok ? ((await response.json()) as { tokens: TokenResult[] }).tokens : null))
      .catch(() => null);
    tokenCache.set(text, pending);
  }
  return pending;
}

const HAS_KANJI = /\p{Script=Han}/u;

// Phrase japonaise avec sa lecture au-dessus des kanji (furigana). interactive :
// les mots se touchent pour voir leur sens (dans une zone de réponse, laisser
// à false : le toucher doit choisir la réponse, pas ouvrir un mot).
export function JapaneseText({ text, interactive = false }: { text: string; interactive?: boolean }) {
  const [tokens, setTokens] = useState<TokenResult[] | null>(null);
  const [opened, setOpened] = useState<{ token: TokenResult; meaning: string | null } | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Sans kanji, rien à annoter : pas de requête.
    if (!HAS_KANJI.test(text) && !interactive) {
      return;
    }
    void tokenize(text).then((result) => {
      if (!cancelled) {
        setTokens(result);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [text, interactive]);

  async function openWord(token: TokenResult) {
    if (opened?.token === token) {
      setOpened(null);
      return;
    }
    setOpened({ token, meaning: null });
    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: token.baseForm || token.surface }),
      });
      const data = (await response.json()) as { result?: { translation?: string } };
      setOpened({ token, meaning: response.ok ? (data.result?.translation ?? "Sens indisponible.") : "Sens indisponible." });
    } catch {
      setOpened({ token, meaning: "Sens indisponible." });
    }
  }

  if (!tokens) {
    return <span lang="ja">{text}</span>;
  }

  return (
    <span lang="ja" className="leading-[2.2]">
      {segmentText(text, tokens).map((segment, index) => {
        if (!segment.token) {
          return <span key={index}>{segment.text}</span>;
        }
        const token = segment.token;
        const parts = furiganaParts(token.surface, token.reading).map((part, partIndex) =>
          part.ruby ? (
            <ruby key={partIndex}>
              {part.text}
              <rt className="text-[0.5em] font-normal text-[var(--muted)]">{part.ruby}</rt>
            </ruby>
          ) : (
            <span key={partIndex}>{part.text}</span>
          ),
        );
        return interactive ? (
          <button
            key={index}
            type="button"
            onClick={() => void openWord(token)}
            className={`cursor-pointer rounded px-px underline decoration-[var(--line-strong)] decoration-dotted underline-offset-4 hover:bg-[var(--tint)] ${
              opened?.token === token ? "bg-[var(--accent-soft)]" : ""
            }`}
          >
            {parts}
          </button>
        ) : (
          <span key={index}>{parts}</span>
        );
      })}
      {interactive && opened ? (
        <span className="fade-in-up mt-1 flex items-center gap-2 text-sm font-normal text-[var(--ink)]">
          <span className="font-semibold" lang="ja">
            {opened.token.baseForm || opened.token.surface}
          </span>
          <span>{opened.meaning ?? "…"}</span>
          <SpeakButton text={opened.token.reading ?? opened.token.surface} label="Écouter le mot" size="sm" />
        </span>
      ) : null}
    </span>
  );
}
