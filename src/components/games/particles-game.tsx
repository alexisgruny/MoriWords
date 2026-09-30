"use client";

import { useState } from "react";

import { RecordLine } from "@/components/games/game-word";
import { SpeakButton } from "@/components/speak-button";
import { PARTICLE_SENTENCES, type ParticleSentence } from "@/lib/games/particles";
import { useRecord } from "@/lib/games/records";
import { shuffle } from "@/lib/shuffle";

const ROUNDS = 10;

type Round = { sentence: ParticleSentence; choices: string[] };

function newGame(): Round[] {
  return shuffle(PARTICLE_SENTENCES)
    .slice(0, ROUNDS)
    .map((sentence) => ({ sentence, choices: shuffle([sentence.answer, ...sentence.wrong]) }));
}

// Particules à trous : 10 phrases, choisir la particule manquante.
export function ParticlesGame() {
  const [rounds, setRounds] = useState<Round[] | null>(null);
  const [position, setPosition] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [isRecord, setIsRecord] = useState(false);
  const { record, submit } = useRecord("particules");

  function start() {
    setRounds(newGame());
    setPosition(0);
    setChosen(null);
    setScore(0);
    setIsRecord(false);
  }

  if (!rounds) {
    return (
      <div className="panel flex flex-col items-start gap-3">
        <p className="text-[var(--ink)]">
          {ROUNDS} phrases simples avec un trou : choisis la bonne particule (は, を, に, で, が, と, の…). La traduction
          t&apos;aide à comprendre le sens.
        </p>
        <RecordLine record={record} unit={`/ ${ROUNDS}`} />
        <button type="button" onClick={start} className="primary-button">
          Commencer
        </button>
      </div>
    );
  }

  if (position >= rounds.length) {
    return (
      <div className="fade-in-up panel flex flex-col items-start gap-3" role="status">
        <p className="text-xl font-bold text-[var(--ink)]">
          {score} / {ROUNDS} bonnes particules.{isRecord ? " Nouveau record 🎉" : ""}
        </p>
        <RecordLine record={record} unit={`/ ${ROUNDS}`} />
        <button type="button" onClick={start} className="primary-button">
          Rejouer
        </button>
      </div>
    );
  }

  const { sentence, choices } = rounds[position];
  const isAnswered = chosen !== null;
  const full = `${sentence.before}${sentence.answer}${sentence.after}`;

  function choose(choice: string) {
    if (isAnswered) {
      return;
    }
    setChosen(choice);
    if (choice === sentence.answer) {
      setScore(score + 1);
    }
  }

  function next() {
    const nextPosition = position + 1;
    if (nextPosition >= ROUNDS) {
      setIsRecord(submit(score));
    }
    setChosen(null);
    setPosition(nextPosition);
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-[var(--muted)]">
        Phrase {position + 1} / {ROUNDS} · Score : {score}
      </p>
      <div className="panel">
        <p className="text-2xl leading-relaxed text-[var(--ink)]" lang="ja">
          {sentence.before}
          <span
            className={`mx-1 inline-block min-w-10 rounded-lg border-b-2 px-2 text-center font-bold ${
              isAnswered
                ? chosen === sentence.answer
                  ? "border-[var(--success)] bg-[var(--success-soft)]"
                  : "border-[var(--accent)] bg-[var(--accent-soft)]"
                : "border-[var(--ink)]"
            }`}
          >
            {isAnswered ? sentence.answer : "？"}
          </span>
          {sentence.after}
        </p>
        <p className="mt-2 text-sm text-[var(--muted)]">{sentence.fr}</p>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {choices.map((choice) => {
          const isRight = isAnswered && choice === sentence.answer;
          const isWrongPick = isAnswered && choice === chosen && !isRight;
          return (
            <button
              key={choice}
              type="button"
              onClick={() => choose(choice)}
              disabled={isAnswered}
              lang="ja"
              className={`min-h-14 cursor-pointer rounded-xl border text-2xl text-[var(--ink)] disabled:cursor-default ${
                isRight
                  ? "border-[var(--success)] bg-[var(--success-soft)]"
                  : isWrongPick
                    ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                    : "border-[var(--line-strong)] bg-[var(--paper)] hover:border-[var(--ink)]"
              }`}
            >
              {choice}
            </button>
          );
        })}
      </div>
      {isAnswered ? (
        <div className="fade-in-up flex flex-wrap items-center gap-3" role="status">
          <p className="font-bold text-[var(--ink)]">
            {chosen === sentence.answer ? "Bonne réponse !" : `Non : c'était ${sentence.answer}.`}
          </p>
          <SpeakButton text={full} label="Écouter la phrase" size="sm" />
          <button type="button" onClick={next} className="primary-button ml-auto">
            {position + 1 >= ROUNDS ? "Voir le score" : "Phrase suivante →"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
