"use client";

import { useState } from "react";

import { SpeakButton } from "@/components/speak-button";
import type { LessonQuestion } from "@/lib/course/lessons";
import { shuffle } from "@/lib/shuffle";

type Round = { question: LessonQuestion; choices: string[] };

// Choix d'une question : la bonne réponse, ses pièges (erreurs typiques),
// complétés si besoin par les réponses d'autres questions de la leçon.
// random = false : ordre fixe (tri des choix), identique côté serveur et
// navigateur pour le premier affichage (sinon erreur d'hydratation React).
function buildRound(question: LessonQuestion, all: LessonQuestion[], random: boolean): Round {
  const others = all.map((other) => other.answer).filter((answer) => answer !== question.answer && !question.wrong.includes(answer));
  const wrong = [...question.wrong, ...(random ? shuffle(others) : others)].slice(0, 3);
  const choices = [question.answer, ...wrong];
  return { question, choices: random ? shuffle(choices) : choices.sort((a, b) => a.localeCompare(b, "ja")) };
}

function buildSeries(questions: LessonQuestion[], random: boolean): Round[] {
  return (random ? shuffle(questions) : questions).map((question) => buildRound(question, questions, random));
}

// QCM d'une leçon du parcours : phrase française, 4 phrases japonaises, avec
// uniquement le vocabulaire de la leçon. Corrigé dans le navigateur (sans
// compte, sans Claude). Les questions repartent mélangées une fois finies.
// prompt / choicesLang : « Comment dit-on en japonais ? » et choix en japonais
// par défaut ; en français pour les questions de compréhension d'un texte.
export function LessonQuiz({
  questions,
  onAnswered,
  prompt = "Comment dit-on en japonais ?",
  choicesLang = "ja",
}: {
  questions: LessonQuestion[];
  onAnswered: (correct: boolean) => void;
  prompt?: string;
  choicesLang?: "ja" | "fr";
}) {
  // Première série dans l'ordre de la leçon, les suivantes mélangées.
  const [series, setSeries] = useState<Round[]>(() => buildSeries(questions, false));
  const [position, setPosition] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);

  const round = series[position];
  const isAnswered = chosen !== null;

  function choose(choice: string) {
    if (isAnswered) {
      return;
    }
    setChosen(choice);
    onAnswered(choice === round.question.answer);
  }

  function next() {
    setChosen(null);
    if (position + 1 >= series.length) {
      setSeries(buildSeries(questions, true));
      setPosition(0);
    } else {
      setPosition(position + 1);
    }
  }

  return (
    <div className="panel">
      <p className="mb-1 text-xs text-[var(--muted)]">
        Question {position + 1} / {series.length}
      </p>
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--tint)] p-4">
        <p className="eyebrow">{prompt}</p>
        <p className="mt-1 text-xl font-semibold text-[var(--ink)]">{round.question.fr}</p>
      </div>

      <div className="mt-4 grid gap-2">
        {round.choices.map((choice) => {
          const isRight = isAnswered && choice === round.question.answer;
          const isWrongPick = isAnswered && choice === chosen && !isRight;
          return (
            <button
              key={choice}
              type="button"
              onClick={() => choose(choice)}
              disabled={isAnswered}
              lang={choicesLang}
              className={`min-h-12 cursor-pointer rounded-xl border px-4 py-2.5 text-left ${choicesLang === "ja" ? "text-lg" : ""} text-[var(--ink)] transition disabled:cursor-default ${
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
        <div className="fade-in-up mt-4 flex flex-wrap items-center gap-3" role="status">
          <p className="font-bold text-[var(--ink)]">
            {chosen === round.question.answer ? "Bonne réponse !" : "Pas tout à fait : la bonne réponse est en vert."}
          </p>
          {choicesLang === "ja" ? <SpeakButton text={round.question.answer} label="Écouter la bonne réponse" size="sm" /> : null}
          <button type="button" onClick={next} className="primary-button ml-auto">
            Question suivante →
          </button>
        </div>
      ) : null}
    </div>
  );
}
