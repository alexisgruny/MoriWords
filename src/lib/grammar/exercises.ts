import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { classifyDifficulty } from "@/lib/difficulty/classify";
import { generateJsonFromClaude } from "@/lib/feeds/claude-json-generator";
import { shuffle } from "@/lib/shuffle";

import { conjugationForms } from "@/lib/conjugation/forms";
import { JLPT_KANJI } from "@/lib/kanji/kanji";

import { type GrammarLevel, type GrammarPoint, filterGrammarPoints, grammarPoints } from "./points";

// Nombre de phrases générées par Claude la première fois qu'un point de
// grammaire est travaillé ; elles sont ensuite réutilisées sans nouvel appel.
export const GENERATED_EXERCISES_PER_POINT = 10;

// Un exercice de traduction : une phrase française à écrire en japonais.
// La traduction de référence n'est jamais envoyée au client avant la correction.
export type Exercise = {
  id: string;
  french: string;
  level: string | null;
  // Ce que l'exercice fait travailler : un motif de grammaire ou un mot du deck.
  focus: string;
};

export class ExerciseServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExerciseServiceError";
  }
}

const generatedExercisesSchema = z.object({
  exercises: z
    .array(z.object({ french: z.string().min(1), japanese: z.string().min(1) }))
    .min(1),
});

// Demande à Claude des phrases françaises variées (avec leur traduction
// japonaise de référence) qui obligent à utiliser le point de grammaire.
export async function generateGrammarExercises(
  point: GrammarPoint,
  count = GENERATED_EXERCISES_PER_POINT,
): Promise<Array<{ french: string; japanese: string }>> {
  const payload = await generateJsonFromClaude({
    prompt: `Écris ${count} phrases en français à faire traduire en japonais pour s'entraîner sur ce point de grammaire japonaise : ${point.pattern} (${point.meaning}), niveau JLPT ${point.level}. Formation : ${point.formation}. Chaque phrase doit être courte, naturelle, avec un vocabulaire du niveau ${point.level} ou plus facile, se situer dans un contexte différent (vie quotidienne, école, voyage, famille, etc.) et nécessiter ce point de grammaire pour être traduite. Pour chacune, donne la traduction japonaise de référence (japonais naturel, poli, utilisant ce point). Réponds uniquement en JSON avec la structure suivante : {"exercises":[{"french":"...","japanese":"..."}]}.`,
    schema: generatedExercisesSchema,
    maxTokens: 1500,
    timeoutMs: 30_000,
    createError: (message) => new ExerciseServiceError(message),
    messages: {
      missingApiKey: "La clé API Anthropic n'est pas configurée.",
      timeout: "La génération d'exercices met trop de temps à répondre.",
      networkError: "Le service d'exercices est injoignable pour le moment.",
      httpError: "Le service d'exercices est momentanément indisponible.",
      empty: "Réponse d'exercices vide.",
      invalid: "Le service d'exercices n'a pas renvoyé de résultat exploitable.",
    },
  });

  return payload.exercises.slice(0, count).map((exercise) => ({
    french: exercise.french.trim(),
    japanese: exercise.japanese.trim(),
  }));
}

type ExerciseGenerator = typeof generateGrammarExercises;

const STATIC_PREFIX = "static:";
const EXAMPLE_PREFIX = "ex:";
const CONJUGATION_PREFIX = "conj:";
const KANJI_PREFIX = "kanji:";

type PoolEntry = { id: string; french: string };

// Toutes les phrases disponibles pour un point : les exemples déjà traduits du
// référentiel, plus celles générées par Claude et gardées en base. La première
// fois qu'un point est travaillé (aucune phrase en base), on en génère une
// dizaine ; si la génération échoue, on se rabat sur les exemples du référentiel.
async function getPointPool(point: GrammarPoint, generate: ExerciseGenerator): Promise<PoolEntry[]> {
  let stored = await prisma.grammarExercise.findMany({ where: { pointId: point.id } });

  if (stored.length === 0) {
    try {
      const generated = await generate(point);
      await prisma.grammarExercise.createMany({
        data: generated.map((exercise) => ({ pointId: point.id, level: point.level, ...exercise })),
      });
      stored = await prisma.grammarExercise.findMany({ where: { pointId: point.id } });
    } catch (error) {
      console.error("Grammar exercise generation failed:", error);
    }
  }

  return [
    ...point.examples.map((example, index) => ({
      id: `${STATIC_PREFIX}${point.id}:${index}`,
      french: example.fr,
    })),
    ...stored.map((exercise) => ({ id: exercise.id, french: exercise.french })),
  ];
}

// Choisit une phrase de grammaire au hasard parmi celles pas encore vues, pour
// un niveau donné (ou tous). Renvoie null quand tout a déjà été fait.
export async function pickGrammarExercise(
  level: GrammarLevel | "all",
  excludeIds: string[],
  generate: ExerciseGenerator = generateGrammarExercises,
): Promise<Exercise | null> {
  const seen = new Set(excludeIds);

  for (const point of shuffle(filterGrammarPoints(grammarPoints, level, ""))) {
    const unseen = (await getPointPool(point, generate)).filter((entry) => !seen.has(entry.id));

    if (unseen.length > 0) {
      const entry = unseen[Math.floor(Math.random() * unseen.length)];
      return { id: entry.id, french: entry.french, level: point.level, focus: point.pattern };
    }
  }

  return null;
}

// Choisit au hasard une phrase d'exemple des mots sauvegardés dans les decks
// (déjà traduite), pour s'entraîner sur son propre vocabulaire. Le niveau du
// mot n'est pas stocké : il est recalculé ici, donc le filtre par niveau se
// fait en mémoire plutôt qu'en SQL (acceptable vu la taille d'un vocabulaire
// personnel).
export async function pickExampleExercise(
  level: GrammarLevel | "all",
  excludeIds: string[],
): Promise<Exercise | null> {
  const excluded = excludeIds
    .filter((id) => id.startsWith(EXAMPLE_PREFIX))
    .map((id) => id.slice(EXAMPLE_PREFIX.length));

  const candidates = await prisma.cardExample.findMany({
    where: { id: { notIn: excluded } },
    include: { card: { select: { lemma: true } } },
  });

  const matching = candidates
    .map((candidate) => ({ candidate, level: classifyDifficulty(candidate.card.lemma, null, null) }))
    .filter((entry) => level === "all" || entry.level === level);

  if (matching.length === 0) {
    return null;
  }

  const { candidate, level: matchedLevel } = matching[Math.floor(Math.random() * matching.length)];

  return {
    id: `${EXAMPLE_PREFIX}${candidate.id}`,
    french: candidate.translation,
    level: matchedLevel === "unknown" ? null : matchedLevel,
    focus: candidate.card.lemma,
  };
}

// Choisit au hasard un exemple de conjugaison au hasard parmi ceux pas encore
// vus, pour un niveau donné (ou tous). Contrairement à la grammaire, chaque
// forme a déjà ses exemples écrits à la main (src/lib/conjugation/forms.ts) :
// pas besoin d'appeler Claude pour en générer d'autres.
export async function pickConjugationExercise(
  level: GrammarLevel | "all",
  excludeIds: string[],
): Promise<Exercise | null> {
  const seen = new Set(excludeIds);

  const pool = conjugationForms
    .filter((form) => level === "all" || form.level === level)
    .flatMap((form) =>
      form.examples.map((example, index) => ({
        id: `${CONJUGATION_PREFIX}${form.id}:${index}`,
        french: example.meaning,
        level: form.level,
        focus: form.name,
      })),
    )
    .filter((entry) => !seen.has(entry.id));

  if (pool.length === 0) {
    return null;
  }

  return shuffle(pool)[0];
}

// Choisit un kanji au hasard parmi ceux pas encore vus, pour un niveau donné
// (ou tous) : le sens sert de phrase à "traduire" (l'élève doit écrire le
// kanji lui-même), les lectures sont données comme indice (focus) pour que
// deviner le bon caractère parmi ~2200 reste possible.
export async function pickKanjiExercise(
  level: GrammarLevel | "all",
  excludeIds: string[],
): Promise<Exercise | null> {
  const seen = new Set(excludeIds);

  const pool = JLPT_KANJI.filter((entry) => level === "all" || entry.level === level)
    .map((entry) => ({
      id: `${KANJI_PREFIX}${entry.kanji}`,
      french: entry.meaning,
      level: entry.level,
      focus: [...entry.onReadings, ...entry.kunReadings].join("・"),
    }))
    .filter((entry) => !seen.has(entry.id));

  if (pool.length === 0) {
    return null;
  }

  return shuffle(pool)[0];
}

// Retrouve la phrase française et sa traduction japonaise de référence à
// partir de l'identifiant d'un exercice.
export async function resolveExercise(
  id: string,
): Promise<{ french: string; japanese: string; focus: string } | null> {
  if (id.startsWith(STATIC_PREFIX)) {
    const [pointId, indexText] = id.slice(STATIC_PREFIX.length).split(":");
    const point = grammarPoints.find((candidate) => candidate.id === pointId);
    const example = point?.examples[Number(indexText)];

    return point && example ? { french: example.fr, japanese: example.ja, focus: point.pattern } : null;
  }

  if (id.startsWith(CONJUGATION_PREFIX)) {
    const [formId, indexText] = id.slice(CONJUGATION_PREFIX.length).split(":");
    const form = conjugationForms.find((candidate) => candidate.id === formId);
    const example = form?.examples[Number(indexText)];

    return form && example
      ? { french: example.meaning, japanese: example.conjugated, focus: form.name }
      : null;
  }

  if (id.startsWith(KANJI_PREFIX)) {
    const kanji = id.slice(KANJI_PREFIX.length);
    const entry = JLPT_KANJI.find((candidate) => candidate.kanji === kanji);

    return entry
      ? { french: entry.meaning, japanese: entry.kanji, focus: [...entry.onReadings, ...entry.kunReadings].join("・") }
      : null;
  }

  if (id.startsWith(EXAMPLE_PREFIX)) {
    const example = await prisma.cardExample.findUnique({
      where: { id: id.slice(EXAMPLE_PREFIX.length) },
      include: { card: { select: { lemma: true } } },
    });

    return example
      ? { french: example.translation, japanese: example.japanese, focus: example.card.lemma }
      : null;
  }

  const stored = await prisma.grammarExercise.findUnique({ where: { id } });

  if (!stored) {
    return null;
  }

  const point = grammarPoints.find((candidate) => candidate.id === stored.pointId);

  return { french: stored.french, japanese: stored.japanese, focus: point?.pattern ?? "" };
}

export const MAX_ANSWER_LENGTH = 500;

const correctionSchema = z.object({
  verdict: z.enum(["correct", "almost", "incorrect"]),
  corrected: z.string().min(1),
  summary: z.string().min(1),
  errors: z
    .array(
      z.object({
        wrong: z.string(),
        right: z.string(),
        explanation: z.string().min(1),
      }),
    )
    .default([]),
});

export type Correction = z.infer<typeof correctionSchema>;

// Fait corriger la traduction de l'élève par Claude : il compare avec la
// référence (sans pénaliser une autre traduction valide), explique chaque
// erreur en français simple et montre comment la corriger.
export async function correctTranslation(params: {
  french: string;
  reference: string;
  focus: string;
  answer: string;
}): Promise<Correction> {
  const focusLine = params.focus ? `Point travaillé : ${params.focus}.\n` : "";

  return generateJsonFromClaude({
    prompt: `Tu es un professeur de japonais bienveillant pour un élève francophone débutant. L'élève devait traduire une phrase française en japonais.
${focusLine}Phrase française : ${params.french}
Traduction de référence : ${params.reference}
Réponse de l'élève : ${params.answer}

Corrige la réponse de l'élève. Une traduction différente de la référence mais correcte (sens, grammaire, naturel) est valide : ne la compte pas comme fausse. Explique en français simple, sans jargon inutile, chaque erreur (grammaire, particule, conjugaison, vocabulaire, orthographe, registre de politesse) et comment la corriger.
Réponds uniquement en JSON avec la structure suivante :
{"verdict":"correct" | "almost" | "incorrect","corrected":"la phrase de l'élève corrigée en japonais (ou la phrase de référence si la réponse est trop éloignée)","summary":"une phrase d'encouragement ou de bilan","errors":[{"wrong":"extrait fautif de la réponse de l'élève","right":"la forme correcte","explanation":"pourquoi c'est faux et comment corriger"}]}
Si la réponse est entièrement correcte, "errors" est un tableau vide. "almost" signifie de petites fautes qui ne gênent pas la compréhension.`,
    schema: correctionSchema,
    maxTokens: 1000,
    timeoutMs: 30_000,
    createError: (message) => new ExerciseServiceError(message),
    messages: {
      missingApiKey: "La clé API Anthropic n'est pas configurée.",
      timeout: "La correction met trop de temps à répondre. Réessaie dans un instant.",
      networkError: "Le service de correction est injoignable pour le moment.",
      httpError: "Le service de correction est momentanément indisponible.",
      empty: "Réponse de correction vide.",
      invalid: "Le service de correction n'a pas renvoyé de résultat exploitable.",
    },
  });
}
