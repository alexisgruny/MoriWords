import { prisma } from "@/lib/db/prisma";
import { conjugationForms } from "@/lib/conjugation/forms";
import { JLPT_KANJI } from "@/lib/kanji/kanji";
import { shuffle } from "@/lib/shuffle";

import {
  type Correction,
  KANJI_PREFIX,
  KANJI_READING_PREFIX,
  correctKanjiReadingAnswer,
  normalizeAnswerKey,
  resolveExercise,
} from "./exercises";
import { grammarPoints } from "./points";

// QCM : la bonne réponse et 3 leurres tirés des données du site (jamais de
// Claude). Les leurres ressemblent à la bonne réponse (même niveau, même
// verbe, même écriture, longueur proche) pour que le choix fasse réfléchir.
const DISTRACTOR_COUNT = 3;

const CONJUGATION_PREFIX = "conj:";
const EXAMPLE_PREFIX = "ex:";

// Lecture affichable : sans le point d'okurigana ni le tiret de préfixe.
const displayReading = (reading: string) => reading.replace(/[.-]/g, "");
const isKatakana = (value: string) => /^[゠-ヿ]+$/.test(value);

function pickDistractors(candidates: string[], answer: string, closeTo = answer): string[] {
  const unique = [...new Set(candidates)].filter((candidate) => normalizeAnswerKey(candidate) !== normalizeAnswerKey(answer));
  // Parmi les plus proches en longueur, un tirage au hasard.
  const closest = unique.sort((a, b) => Math.abs(a.length - closeTo.length) - Math.abs(b.length - closeTo.length));
  return shuffle(closest.slice(0, DISTRACTOR_COUNT * 3)).slice(0, DISTRACTOR_COUNT);
}

function grammarSentencesOfLevel(level: string | null, excludeFocus?: string): string[] {
  return grammarPoints
    .filter((point) => (!level || point.level === level) && point.pattern !== excludeFocus)
    .flatMap((point) => point.examples.map((example) => example.ja));
}

// Choix proposés pour un exercice (bonne réponse comprise, mélangés), ou null
// si l'exercice est introuvable.
export async function buildChoices(exerciseId: string, userId: string): Promise<string[] | null> {
  const exercise = await resolveExercise(exerciseId, userId);
  if (!exercise) {
    return null;
  }

  let answer = exercise.japanese;
  let distractors: string[];

  if (exerciseId.startsWith(KANJI_READING_PREFIX)) {
    // Une des lectures du kanji ; leurres : lectures d'autres kanji du même
    // niveau, dans la même écriture (on en katakana, kun en hiragana).
    const readings = exercise.japanese.split("・").map(displayReading);
    answer = shuffle(readings)[0];
    const sameScript = (reading: string) => isKatakana(reading) === isKatakana(answer);
    distractors = pickDistractors(
      JLPT_KANJI.filter((entry) => entry.level === exercise.level && entry.kanji !== exercise.focus)
        .flatMap((entry) => [...entry.onReadings, ...entry.kunReadings].map(displayReading))
        .filter((reading) => sameScript(reading) && !readings.includes(reading)),
      answer,
    );
  } else if (exerciseId.startsWith(KANJI_PREFIX)) {
    distractors = pickDistractors(
      JLPT_KANJI.filter((entry) => entry.level === exercise.level && entry.kanji !== exercise.focus).map((entry) => entry.meaning),
      answer,
    );
  } else if (exerciseId.startsWith(CONJUGATION_PREFIX)) {
    // Même verbe à d'autres formes d'abord (食べます / 食べました / 食べて).
    const base = conjugationForms.flatMap((form) => form.examples).find((example) => example.conjugated === answer)?.base;
    const sameVerb = conjugationForms.flatMap((form) => form.examples).filter((example) => example.base === base).map((example) => example.conjugated);
    const sameLevel = conjugationForms
      .filter((form) => form.level === exercise.level)
      .flatMap((form) => form.examples.map((example) => example.conjugated));
    distractors = pickDistractors(sameVerb, answer);
    if (distractors.length < DISTRACTOR_COUNT) {
      distractors = [...distractors, ...pickDistractors(sameLevel.filter((value) => !distractors.includes(value)), answer)].slice(0, DISTRACTOR_COUNT);
    }
  } else if (exerciseId.startsWith(EXAMPLE_PREFIX)) {
    // Autres phrases d'exemple des decks de l'utilisateur, sinon de grammaire.
    const own = await prisma.cardExample.findMany({
      where: { card: { deck: { userId } } },
      select: { japanese: true },
      take: 200,
    });
    distractors = pickDistractors(
      [...own.map((example) => example.japanese), ...grammarSentencesOfLevel(exercise.level)],
      answer,
    );
  } else {
    // Grammaire : phrases d'autres points du même niveau.
    distractors = pickDistractors(grammarSentencesOfLevel(exercise.level, exercise.focus), answer);
  }

  return shuffle([answer, ...distractors]);
}

// Correction d'un QCM : locale, sans Claude.
export function correctChoice(params: { exerciseId: string; reference: string; answer: string }): Correction {
  if (params.exerciseId.startsWith(KANJI_READING_PREFIX)) {
    return correctKanjiReadingAnswer({ reference: params.reference, answer: params.answer });
  }

  const isCorrect = normalizeAnswerKey(params.answer) === normalizeAnswerKey(params.reference);

  return isCorrect
    ? { verdict: "correct", corrected: params.reference, summary: "Bonne réponse !", errors: [] }
    : { verdict: "incorrect", corrected: params.reference, summary: "Ce n'est pas la bonne réponse.", errors: [] };
}
