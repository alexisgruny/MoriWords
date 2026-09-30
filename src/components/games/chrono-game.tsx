"use client";

import { useEffect, useState } from "react";

import { GameWordLabel, RecordLine } from "@/components/games/game-word";
import { meaningChoices, pickWords, useRecord } from "@/lib/games/records";
import type { GameWord } from "@/lib/games/words";

const DURATION = 60;

type Round = { word: GameWord; choices: string[] };

function newRound(previous?: GameWord): Round {
  const [word] = pickWords(1, previous ? [previous] : []);
  return { word, choices: meaningChoices(word) };
}

// Contre la montre : un maximum de bons sens en 60 secondes.
export function ChronoGame() {
  const [round, setRound] = useState<Round | null>(null);
  // Fin de partie en horodatage : le décompte reste juste même si le
  // minuteur est relancé à chaque réponse.
  const [endAt, setEndAt] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(DURATION);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState<GameWord[]>([]);
  // Dernier mauvais choix, affiché un court instant.
  const [flash, setFlash] = useState<{ wrong: string; right: string } | null>(null);
  const [isRecord, setIsRecord] = useState(false);
  const { record, submit } = useRecord("chrono");

  const isRunning = round !== null && secondsLeft > 0;
  const isOver = round !== null && secondsLeft === 0;

  useEffect(() => {
    if (!isRunning) {
      return;
    }
    const timer = window.setInterval(() => {
      const left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) {
        setIsRecord(submit(score));
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, [isRunning, endAt, score, submit]);

  function start() {
    setRound(newRound());
    setEndAt(Date.now() + DURATION * 1000);
    setSecondsLeft(DURATION);
    setScore(0);
    setMistakes([]);
    setFlash(null);
    setIsRecord(false);
  }

  function choose(choice: string) {
    if (!round || !isRunning) {
      return;
    }
    if (choice === round.word.fr) {
      setScore(score + 1);
      setFlash(null);
    } else {
      setMistakes((previous) => (previous.includes(round.word) ? previous : [...previous, round.word]));
      setFlash({ wrong: choice, right: `${round.word.written} = ${round.word.fr}` });
    }
    setRound(newRound(round.word));
  }

  if (!round) {
    return (
      <div className="panel flex flex-col items-start gap-3">
        <p className="text-[var(--ink)]">
          Un mot japonais s&apos;affiche : touche son sens en français. Tu as {DURATION} secondes pour en trouver le plus
          possible.
        </p>
        <RecordLine record={record} unit="bonnes réponses" />
        <button type="button" onClick={start} className="primary-button">
          Commencer
        </button>
      </div>
    );
  }

  if (isOver) {
    return (
      <div className="fade-in-up panel flex flex-col gap-3" role="status">
        <p className="text-xl font-bold text-[var(--ink)]">
          Temps écoulé : {score} bonne{score > 1 ? "s" : ""} réponse{score > 1 ? "s" : ""}.
          {isRecord ? " Nouveau record 🎉" : ""}
        </p>
        <RecordLine record={record} unit="bonnes réponses" />
        {mistakes.length > 0 ? (
          <div>
            <p className="text-sm font-semibold text-[var(--ink)]">À revoir :</p>
            <ul className="mt-1 grid gap-1 text-sm sm:grid-cols-2">
              {mistakes.map((word) => (
                <li key={word.kana} className="text-[var(--ink)]">
                  <span lang="ja">{word.written}</span>
                  {word.written !== word.kana ? <span className="text-[var(--muted)]"> ({word.kana})</span> : null} :{" "}
                  {word.fr}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <button type="button" onClick={start} className="primary-button self-start">
          Rejouer
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-[var(--ink)]">Score : {score}</span>
        <span className={`font-bold tabular-nums ${secondsLeft <= 10 ? "text-[var(--accent)]" : "text-[var(--ink)]"}`}>
          ⏱ {secondsLeft} s
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--line)]">
        <div className="h-full bg-[var(--accent)] transition-all" style={{ width: `${(secondsLeft / DURATION) * 100}%` }} />
      </div>
      <div className="panel flex justify-center py-8 text-[var(--ink)]">
        <GameWordLabel word={round.word} size="xl" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {round.choices.map((choice) => (
          <button
            key={choice}
            type="button"
            onClick={() => choose(choice)}
            className="min-h-14 cursor-pointer rounded-xl border border-[var(--line-strong)] bg-[var(--paper)] px-3 py-2 text-[var(--ink)] hover:border-[var(--ink)]"
          >
            {choice}
          </button>
        ))}
      </div>
      <p className="min-h-5 text-sm text-[var(--accent)]" role="status">
        {flash ? `Raté : ${flash.right}` : ""}
      </p>
    </div>
  );
}
