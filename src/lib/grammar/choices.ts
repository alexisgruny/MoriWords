import { prisma } from "@/lib/db/prisma";
import { conjugationsOf } from "@/lib/conjugation/conjugate";
import { conjugationForms } from "@/lib/conjugation/forms";
import { JLPT_KANJI } from "@/lib/kanji/kanji";
import { shuffle } from "@/lib/shuffle";

import {
  type Correction,
  CURRENT_EXERCISE_GENERATION,
  fitsGrammarLevel,
  KANJI_PREFIX,
  KANJI_READING_PREFIX,
  correctKanjiReadingAnswer,
  normalizeAnswerKey,
  resolveExercise,
} from "./exercises";
import { type GrammarLevel, grammarPoints } from "./points";

// QCM : la bonne réponse et 3 leurres tirés des données du site (jamais de
// Claude). Les leurres ressemblent à la bonne réponse (même niveau, même
// verbe, même écriture, longueur proche) pour que le choix fasse réfléchir.
const DISTRACTOR_COUNT = 3;

const CONJUGATION_PREFIX = "conj:";
const IRREGULAR_POLITE_FORMS = new Set(["n2-sonkeigo-irregular", "n2-kenjougo-irregular"]);
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

// Phrases de grammaire d'un niveau (exemples du référentiel et phrases
// générées), seulement celles qui passent le contrôle de niveau : un leurre
// plein de mots inconnus serait éliminé d'office.
async function grammarSentencesOfLevel(level: string | null, excludeFocus?: string): Promise<string[]> {
  const points = grammarPoints.filter((point) => (!level || point.level === level) && point.pattern !== excludeFocus);
  const generated = await prisma.grammarExercise.findMany({
    where: { pointId: { in: points.map((point) => point.id) }, generation: CURRENT_EXERCISE_GENERATION },
    select: { japanese: true },
    take: 200,
  });
  const sentences = [...points.flatMap((point) => point.examples.map((example) => example.ja)), ...generated.map((row) => row.japanese)];
  if (!level) {
    return sentences;
  }
  const fits = await Promise.all(sentences.map((sentence) => fitsGrammarLevel(sentence, level as GrammarLevel)));
  return sentences.filter((_, index) => fits[index]);
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
    // Uniquement le même mot à d'autres formes (食べます / 食べない / 食べて) :
    // avec 4 verbes différents, le sens du verbe suffirait à répondre. Formes
    // du référentiel, complétées par le conjugueur local.
    // Les verbes honorifiques ou humbles irréguliers (食べる → 召し上がる,
    // 行く → 参る) sont d'autres mots à l'œil : jamais en leurre.
    const examples = conjugationForms
      .filter((form) => !IRREGULAR_POLITE_FORMS.has(form.id))
      .flatMap((form) => form.examples);
    const example = conjugationForms.flatMap((form) => form.examples).find((candidate) => candidate.conjugated === answer);
    const sameWord = example
      ? [
          ...examples.filter((candidate) => candidate.base === example.base).map((candidate) => candidate.conjugated),
          ...conjugationsOf(example.base, example.reading),
        ]
      : [];
    distractors = shuffle([...new Set(sameWord)].filter((value) => value !== answer)).slice(0, DISTRACTOR_COUNT);
  } else if (exerciseId.startsWith(EXAMPLE_PREFIX)) {
    // Autres phrases d'exemple des decks de l'utilisateur, sinon de grammaire.
    const own = await prisma.cardExample.findMany({
      where: { card: { deck: { userId } } },
      select: { japanese: true },
      take: 200,
    });
    distractors = pickDistractors(
      [...own.map((example) => example.japanese), ...(await grammarSentencesOfLevel(exercise.level))],
      answer,
    );
  } else {
    // Grammaire : phrases d'autres points du même niveau.
    distractors = pickDistractors(await grammarSentencesOfLevel(exercise.level, exercise.focus), answer);
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
