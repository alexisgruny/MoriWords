"use client";

import { useEffect, useState } from "react";

import { GameWordLabel, RecordLine } from "@/components/games/game-word";
import { useWordSource } from "@/components/games/word-source";
import { pickWords, useRecord } from "@/lib/games/records";
import type { GameWord } from "@/lib/games/words";
import { shuffle } from "@/lib/shuffle";
import { speakJapanese } from "@/lib/speech";

type Card = { id: string; word: GameWord; side: "ja" | "fr" };

const PAIRS = 6;

function newDeck(pool: GameWord[]): Card[] {
  return shuffle(
    pickWords(PAIRS, [], pool).flatMap((word) => [
      { id: `${word.written}-ja`, word, side: "ja" as const },
      { id: `${word.written}-fr`, word, side: "fr" as const },
    ]),
  );
}

// Memory : retrouver les paires mot japonais ↔ sens français.
export function MemoryGame() {
  // Paquet créé au clic sur « Commencer » (tirage au hasard impossible au
  // rendu serveur sans erreur d'hydratation).
  const [cards, setCards] = useState<Card[] | null>(null);
  const [open, setOpen] = useState<string[]>([]);
  const [found, setFound] = useState<Set<string>>(new Set());
  const [moves, setMoves] = useState(0);
  const [isRecord, setIsRecord] = useState(false);
  const { record, submit } = useRecord("memory", true);
  const { words, picker } = useWordSource();

  const isDone = cards !== null && found.size === PAIRS;

  // Deux cartes différentes retournées : on les recache après un instant.
  useEffect(() => {
    if (open.length !== 2) {
      return;
    }
    const timer = window.setTimeout(() => setOpen([]), 900);
    return () => window.clearTimeout(timer);
  }, [open]);

  function start() {
    setCards(newDeck(words));
    setOpen([]);
    setFound(new Set());
    setMoves(0);
    setIsRecord(false);
  }

  function flip(card: Card) {
    if (!cards || open.length === 2 || open.includes(card.id) || found.has(card.word.written)) {
      return;
    }
    if (card.side === "ja") {
      speakJapanese(card.word.kana);
    }
    if (open.length === 0) {
      setOpen([card.id]);
      return;
    }
    const first = cards.find((candidate) => candidate.id === open[0]);
    const nextMoves = moves + 1;
    setMoves(nextMoves);
    if (first && first.word.written === card.word.written) {
      const nextFound = new Set(found).add(card.word.written);
      setFound(nextFound);
      setOpen([]);
      if (nextFound.size === PAIRS) {
        setIsRecord(submit(nextMoves));
      }
    } else {
      setOpen([open[0], card.id]);
    }
  }

  if (!cards) {
    return (
      <div className="panel flex flex-col items-start gap-3">
        <p className="text-[var(--ink)]">
          {PAIRS} mots japonais et leurs {PAIRS} sens sont cachés. Retourne deux cartes à la fois pour former les paires, en
          un minimum de coups.
        </p>
        {picker}
        <RecordLine record={record} unit="coups" />
        <button type="button" onClick={start} className="primary-button">
          Commencer
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 text-sm text-[var(--muted)]">
        <span className="font-semibold text-[var(--ink)]">
          Paires : {found.size} / {PAIRS} · Coups : {moves}
        </span>
        <RecordLine record={record} unit="coups" />
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {cards.map((card) => {
          const isFound = found.has(card.word.written);
          const isVisible = isFound || open.includes(card.id);
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => flip(card)}
              aria-label={isVisible ? undefined : "Carte cachée"}
              className={`flex min-h-24 items-center justify-center rounded-xl border p-2 text-center text-[var(--ink)] transition ${
                isFound
                  ? "border-[var(--success)] bg-[var(--success-soft)]"
                  : isVisible
                    ? "border-[var(--ink)] bg-[var(--paper)]"
                    : "cursor-pointer border-[var(--line-strong)] bg-[var(--tint)] hover:border-[var(--ink)]"
              }`}
            >
              {isVisible ? (
                card.side === "ja" ? (
                  <GameWordLabel word={card.word} />
                ) : (
                  <span className="text-sm font-semibold">{card.word.fr}</span>
                )
              ) : (
                <span className="text-2xl text-[var(--muted)]" aria-hidden="true">
                  ？
                </span>
              )}
            </button>
          );
        })}
      </div>
      {isDone ? (
        <div className="fade-in-up panel flex flex-wrap items-center gap-3" role="status">
          <p className="font-bold text-[var(--ink)]">
            Bravo, toutes les paires en {moves} coups !{isRecord ? " Nouveau record 🎉" : ""}
          </p>
          <button type="button" onClick={start} className="primary-button ml-auto">
            Rejouer
          </button>
        </div>
      ) : null}
    </div>
  );
}
