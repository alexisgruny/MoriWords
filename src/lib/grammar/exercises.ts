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
  // Ce que l'exercice fait travailler : un motif de grammaire, une forme,
  // un kanji ou un mot du deck (clé des statistiques par point).
  focus: string;
  // Indice affiché sous la question (lectures ou sens d'un kanji).
  hint?: string;
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

// Version actuelle de la consigne (voir GrammarExercise.generation).
export const CURRENT_EXERCISE_GENERATION = 2;

const LEVEL_ORDER: GrammarLevel[] = ["N5", "N4", "N3", "N2", "N1"];

// Ce qu'un élève de chaque niveau peut traduire : la version 1 de la consigne
// (« phrase courte ») donnait souvent des phrases trop dures en N5.
const LEVEL_GUIDELINES: Record<GrammarLevel, string> = {
  N5: "très courte (4 à 8 mots en français), une seule proposition, sans subordonnée, vocabulaire de débutant absolu (famille, école, nourriture, boissons, heures, jours, lieux et objets du quotidien), en japonais à la forme polie です/ます",
  N4: "courte (5 à 10 mots en français), au plus deux propositions simples, vocabulaire courant de niveau N5-N4",
  N3: "de longueur moyenne (au plus 14 mots en français), vocabulaire de niveau N3 ou plus facile",
  N2: "naturelle (au plus 18 mots en français), vocabulaire de niveau N2 ou plus facile",
  N1: "naturelle (au plus 20 mots en français), vocabulaire de niveau N1 ou plus facile",
};

// Longueur maximale de la phrase japonaise de référence (sans ponctuation).
const MAX_JAPANESE_LENGTH: Record<GrammarLevel, number> = { N5: 20, N4: 28, N3: 36, N2: 45, N1: 55 };

const KANJI_LEVELS = new Map(JLPT_KANJI.map((entry) => [entry.kanji, entry.level as GrammarLevel]));

// Contrôle objectif d'une phrase générée : pas trop longue, et chaque kanji
// au plus un niveau au-dessus du point (私 est N4 mais courant dès le N5) ;
// un kanji hors des listes JLPT est refusé.
export function fitsGrammarLevel(japanese: string, level: GrammarLevel): boolean {
  const text = japanese.replace(/[\s。、！？!?「」『』…・]/g, "");

  if (text.length > MAX_JAPANESE_LENGTH[level]) {
    return false;
  }

  const maxIndex = LEVEL_ORDER.indexOf(level) + 1;

  return [...text]
    .filter((char) => /\p{Script=Han}/u.test(char))
    .every((char) => {
      const kanjiLevel = KANJI_LEVELS.get(char);
      return kanjiLevel !== undefined && LEVEL_ORDER.indexOf(kanjiLevel) <= maxIndex;
    });
}

// Demande à Claude des phrases françaises variées (avec leur traduction
// japonaise de référence) qui obligent à utiliser le point de grammaire.
// Quelques phrases de plus que nécessaire : celles trop dures pour le niveau
// sont écartées (fitsGrammarLevel).
export async function generateGrammarExercises(
  point: GrammarPoint,
  count = GENERATED_EXERCISES_PER_POINT,
): Promise<Array<{ french: string; japanese: string }>> {
  const level = point.level as GrammarLevel;
  const kanjiLimit = LEVEL_ORDER[Math.min(LEVEL_ORDER.indexOf(level) + 1, LEVEL_ORDER.length - 1)];
  const payload = await generateJsonFromClaude({
    prompt: `Écris ${count + 4} phrases en français à faire traduire en japonais par un élève de niveau JLPT ${level}, pour s'entraîner sur ce point de grammaire : ${point.pattern} (${point.meaning}). Formation : ${point.formation}. Chaque phrase doit être ${LEVEL_GUIDELINES[level]}, se situer dans un contexte différent et nécessiter ce point de grammaire. Pour chacune, donne la traduction japonaise de référence, naturelle, utilisant ce point, où seuls les kanji de niveau ${level} ou ${kanjiLimit} sont utilisés (les autres mots en hiragana). Réponds uniquement en JSON avec la structure suivante : {"exercises":[{"french":"...","japanese":"..."}]}.`,
    schema: generatedExercisesSchema,
    maxTokens: 1800,
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

  return payload.exercises
    .map((exercise) => ({ french: exercise.french.trim(), japanese: exercise.japanese.trim() }))
    .filter((exercise) => fitsGrammarLevel(exercise.japanese, level))
    .slice(0, count);
}

type ExerciseGenerator = typeof generateGrammarExercises;

const STATIC_PREFIX = "static:";
const EXAMPLE_PREFIX = "ex:";
const CONJUGATION_PREFIX = "conj:";
export const KANJI_PREFIX = "kanji:";
// Kanji -> lecture (l'élève écrit une lecture en kana).
export const KANJI_READING_PREFIX = "kanji-yomi:";

export type KanjiMode = "meaning" | "reading";

const readingsOf = (entry: { onReadings: string[]; kunReadings: string[] }) =>
  [...entry.onReadings, ...entry.kunReadings].join("・");

type PoolEntry = { id: string; french: string };

// Toutes les phrases disponibles pour un point : les exemples déjà traduits du
// référentiel, plus celles générées par Claude et gardées en base. La première
// fois qu'un point est travaillé (aucune phrase en base), on en génère une
// dizaine ; si la génération échoue, on se rabat sur les exemples du référentiel.
async function getPointPool(point: GrammarPoint, generate: ExerciseGenerator): Promise<PoolEntry[]> {
  const current = { pointId: point.id, generation: CURRENT_EXERCISE_GENERATION };
  let stored = await prisma.grammarExercise.findMany({ where: current });

  if (stored.length === 0) {
    try {
      const generated = await generate(point);
      await prisma.grammarExercise.createMany({
        data: generated.map((exercise) => ({ ...current, level: point.level, ...exercise })),
      });
      stored = await prisma.grammarExercise.findMany({ where: current });
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
// un niveau donné (ou tous). Si focusIn est fourni, ne pioche que parmi les
// points listés (voir /exercices/revision, qui s'entraîne sur les points
// faibles remontés par les statistiques). Renvoie null quand tout a déjà
// été fait.
export async function pickGrammarExercise(
  level: GrammarLevel | "all",
  excludeIds: string[],
  generate: ExerciseGenerator = generateGrammarExercises,
  focusIn?: string[],
): Promise<Exercise | null> {
  const seen = new Set(excludeIds);
  const points = filterGrammarPoints(grammarPoints, level, "").filter(
    (point) => !focusIn || focusIn.includes(point.pattern),
  );

  for (const point of shuffle(points)) {
    const unseen = (await getPointPool(point, generate)).filter((entry) => !seen.has(entry.id));

    if (unseen.length > 0) {
      const entry = unseen[Math.floor(Math.random() * unseen.length)];
      return { id: entry.id, french: entry.french, level: point.level, focus: point.pattern };
    }
  }

  return null;
}

// Choisit au hasard une phrase d'exemple des mots sauvegardés dans les decks
// de l'utilisateur (déjà traduite), pour s'entraîner sur son propre vocabulaire. Le niveau du
// mot n'est pas stocké : il est recalculé ici, donc le filtre par niveau se
// fait en mémoire plutôt qu'en SQL (acceptable vu la taille d'un vocabulaire
// personnel). focusIn restreint aux lemmes listés (points faibles).
export async function pickExampleExercise(
  userId: string,
  level: GrammarLevel | "all",
  excludeIds: string[],
  focusIn?: string[],
): Promise<Exercise | null> {
  const excluded = excludeIds
    .filter((id) => id.startsWith(EXAMPLE_PREFIX))
    .map((id) => id.slice(EXAMPLE_PREFIX.length));

  const candidates = await prisma.cardExample.findMany({
    where: { id: { notIn: excluded }, card: { deck: { userId } } },
    include: { card: { select: { lemma: true } } },
  });

  const matching = candidates
    .map((candidate) => ({ candidate, level: classifyDifficulty(candidate.card.lemma, null, null) }))
    .filter((entry) => level === "all" || entry.level === level)
    .filter((entry) => !focusIn || focusIn.includes(entry.candidate.card.lemma));

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
// pas besoin d'appeler Claude pour en générer d'autres. focusIn restreint aux
// formes listées (points faibles).
export async function pickConjugationExercise(
  level: GrammarLevel | "all",
  excludeIds: string[],
  focusIn?: string[],
): Promise<Exercise | null> {
  const seen = new Set(excludeIds);

  const pool = conjugationForms
    .filter((form) => level === "all" || form.level === level)
    .filter((form) => !focusIn || focusIn.includes(form.name))
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
// (ou tous) : le kanji lui-même est montré (champ "french", réutilisé ici
// comme le texte de la question plutôt que du français), l'élève doit en
// donner le sens ; les lectures restent données comme indice (focus).
// focusIn restreint aux kanji dont les lectures (focus) sont listées
// (points faibles) : c'est la même valeur que celle enregistrée dans
// ExerciseAttempt, pas besoin de la retraduire vers un caractère précis.
export async function pickKanjiExercise(
  level: GrammarLevel | "all",
  excludeIds: string[],
  focusIn?: string[],
  mode: KanjiMode = "meaning",
): Promise<Exercise | null> {
  const seen = new Set(excludeIds);
  const prefix = mode === "reading" ? KANJI_READING_PREFIX : KANJI_PREFIX;

  const pool = JLPT_KANJI.filter((entry) => level === "all" || entry.level === level)
    // focusIn : le kanji, ou ses lectures (clé des tentatives d'avant).
    .filter((entry) => !focusIn || focusIn.includes(entry.kanji) || focusIn.includes(readingsOf(entry)))
    .map((entry) => ({
      id: `${prefix}${entry.kanji}`,
      french: entry.kanji,
      level: entry.level,
      focus: entry.kanji,
      hint: mode === "reading" ? `Sens : ${entry.meaning}` : `Lectures : ${readingsOf(entry)}`,
    }))
    .filter((entry) => !seen.has(entry.id));

  if (pool.length === 0) {
    return null;
  }

  return shuffle(pool)[0];
}

// Retrouve la phrase française et sa traduction japonaise de référence à
// partir de l'identifiant d'un exercice, avec son niveau JLPT (pour les
// statistiques de progression, voir logExerciseAttempt). userId limite les
// phrases d'exemple (issues des decks) à celles de l'utilisateur.
export async function resolveExercise(
  id: string,
  userId: string,
): Promise<{ french: string; japanese: string; focus: string; level: string | null } | null> {
  if (id.startsWith(STATIC_PREFIX)) {
    const [pointId, indexText] = id.slice(STATIC_PREFIX.length).split(":");
    const point = grammarPoints.find((candidate) => candidate.id === pointId);
    const example = point?.examples[Number(indexText)];

    return point && example
      ? { french: example.fr, japanese: example.ja, focus: point.pattern, level: point.level }
      : null;
  }

  if (id.startsWith(CONJUGATION_PREFIX)) {
    const [formId, indexText] = id.slice(CONJUGATION_PREFIX.length).split(":");
    const form = conjugationForms.find((candidate) => candidate.id === formId);
    const example = form?.examples[Number(indexText)];

    return form && example
      ? { french: example.meaning, japanese: example.conjugated, focus: form.name, level: form.level }
      : null;
  }

  if (id.startsWith(KANJI_PREFIX) || id.startsWith(KANJI_READING_PREFIX)) {
    const isReading = id.startsWith(KANJI_READING_PREFIX);
    const kanji = id.slice((isReading ? KANJI_READING_PREFIX : KANJI_PREFIX).length);
    const entry = JLPT_KANJI.find((candidate) => candidate.kanji === kanji);

    // "french"/"japanese" sont détournés : la question ("french") est le
    // kanji lui-même, la réponse attendue ("japanese") est son sens en
    // français, ou ses lectures en mode lecture.
    return entry
      ? {
          french: entry.kanji,
          japanese: isReading ? readingsOf(entry) : entry.meaning,
          focus: entry.kanji,
          level: entry.level,
        }
      : null;
  }

  if (id.startsWith(EXAMPLE_PREFIX)) {
    const example = await prisma.cardExample.findFirst({
      where: { id: id.slice(EXAMPLE_PREFIX.length), card: { deck: { userId } } },
      include: { card: { select: { lemma: true } } },
    });

    if (!example) {
      return null;
    }

    const level = classifyDifficulty(example.card.lemma, null, null);

    return {
      french: example.translation,
      japanese: example.japanese,
      focus: example.card.lemma,
      level: level === "unknown" ? null : level,
    };
  }

  const stored = await prisma.grammarExercise.findUnique({ where: { id } });

  if (!stored) {
    return null;
  }

  const point = grammarPoints.find((candidate) => candidate.id === stored.pointId);

  return { french: stored.french, japanese: stored.japanese, focus: point?.pattern ?? "", level: stored.level };
}

export type ExerciseSource =
  | "grammar"
  | "conjugation"
  | "kanji"
  | "kanji-reading"
  | "kanji-writing"
  | "examples"
  | "kana"
  | "kana-writing";

// Déduit le type d'exercice à partir de son identifiant (même logique que
// resolveExercise), pour l'enregistrer dans les statistiques de progression.
export function getExerciseSource(id: string): ExerciseSource {
  if (id.startsWith(KANJI_READING_PREFIX)) {
    return "kanji-reading";
  }

  if (id.startsWith(KANJI_PREFIX)) {
    return "kanji";
  }

  if (id.startsWith(CONJUGATION_PREFIX)) {
    return "conjugation";
  }

  if (id.startsWith(EXAMPLE_PREFIX)) {
    return "examples";
  }

  // static:... ou l'id cuid d'une ligne GrammarExercise stockée : les deux
  // sont des exercices de grammaire.
  return "grammar";
}

// Enregistre une tentative d'exercice (bonne ou mauvaise réponse) pour la
// page de statistiques /exercices/stats. N'échoue jamais la requête de
// correction : une écriture de log manquée n'est pas grave, juste un point
// de moins dans les statistiques.
export async function logExerciseAttempt(params: {
  userId: string;
  exerciseId: string;
  focus: string;
  level: string | null;
  correct: boolean;
}): Promise<void> {
  try {
    await prisma.exerciseAttempt.create({
      data: {
        userId: params.userId,
        source: getExerciseSource(params.exerciseId),
        focus: params.focus,
        level: params.level,
        correct: params.correct,
      },
    });
  } catch (error) {
    console.error("Failed to log exercise attempt:", error);
  }
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

// Un exercice de kanji se corrige contre un ensemble fixe de synonymes
// courts (le sens du kanji, voir scripts/generate-jlpt-kanji.mjs), pas
// contre une infinité de formulations comme une traduction libre : pas
// besoin d'appeler Claude, une comparaison locale suffit et ne coûte aucun
// token.
export function isKanjiExerciseId(id: string): boolean {
  return id.startsWith(KANJI_PREFIX);
}

export function isKanjiReadingExerciseId(id: string): boolean {
  return id.startsWith(KANJI_READING_PREFIX);
}

// Katakana -> hiragana (même décalage Unicode que toKatakana, en sens inverse).
function toHiragana(value: string): string {
  return value.replace(/[\u30a1-\u30f6]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0x60));
}

const normalizeReading = (value: string) => toHiragana(value.normalize("NFKC").replace(/[\s.\-・]/g, ""));

// Lecture d'un kanji : on (katakana) ou kun (hiragana, "." avant l'okurigana,
// "-" pour un préfixe/suffixe). Acceptées en hiragana ou katakana, en entier
// (かつ) ou seulement la partie lue par le kanji (か). Correction locale.
export function correctKanjiReadingAnswer(params: { reference: string; answer: string }): Correction {
  const readings = params.reference.split("・").filter(Boolean);
  const accepted = new Set(
    readings.flatMap((reading) => [normalizeReading(reading), normalizeReading(reading.split(".")[0])]),
  );
  const answer = normalizeReading(params.answer);

  if (answer && accepted.has(answer)) {
    return { verdict: "correct", corrected: params.reference, summary: "Bonne lecture !", errors: [] };
  }

  return {
    verdict: "incorrect",
    corrected: params.reference,
    summary: "Ce n'est pas une lecture de ce kanji.",
    errors: [
      {
        wrong: params.answer.trim(),
        right: params.reference,
        explanation: `Lectures possibles : ${params.reference} (en katakana : lectures on, en hiragana : lectures kun).`,
      },
    ],
  };
}

// Ignore accents, casse, ponctuation finale et article de tête (« un »,
// « la »...) pour comparer un sens sans être bloqué par une formulation
// différente mais équivalente ("un puits" doit matcher "puits").
const LEADING_FRENCH_DETERMINER = /^(un|une|des|le|la|les|du|de|d'|l')\s+/;

function normalizeMeaning(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[.!?]+$/g, "")
    .trim()
    .replace(LEADING_FRENCH_DETERMINER, "")
    .trim();
}

export function correctKanjiMeaningAnswer(params: { reference: string; answer: string }): Correction {
  const synonyms = params.reference
    .split(",")
    .map((part) => normalizeMeaning(part))
    .filter(Boolean);
  const isCorrect = synonyms.includes(normalizeMeaning(params.answer));

  if (isCorrect) {
    return { verdict: "correct", corrected: params.reference, summary: "Bonne réponse !", errors: [] };
  }

  return {
    verdict: "incorrect",
    corrected: params.reference,
    summary: "Ce n'est pas (tout à fait) le sens attendu.",
    errors: [
      {
        wrong: params.answer.trim(),
        right: params.reference,
        explanation: `Le sens attendu est : ${params.reference}.`,
      },
    ],
  };
}

// Clé de cache pour une réponse : pleine/demi-chasse (NFKC), espaces,
// ponctuation et guillemets ignorés partout (「です。」= 「です」= 「 です！」,
// 「はい、そうです」= 「はいそうです」) : autant de corrections Claude en moins.
// Le reste (kanji vs kana, particules...) est gardé tel quel car ça peut
// changer si la réponse est correcte.
export function normalizeAnswerKey(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/\s+/g, "")
    .replace(/[。.!?、,…「」『』"'“”‘’]+/g, "");
}

// Corrige la traduction de l'élève, en recyclant les corrections déjà
// obtenues de Claude pour éviter de le rappeler à chaque fois :
// 1. si la réponse correspond exactement à la traduction de référence, elle
//    est forcément correcte (aucun appel, aucun accès à la base) ;
// 2. sinon, si cette réponse a déjà été corrigée pour ce même exercice (le
//    pool d'exercices est fini : un point de grammaire ou une forme de
//    conjugaison ne propose toujours que les mêmes phrases), on rejoue la
//    correction stockée ;
// 3. seulement en dernier recours, on appelle Claude et on garde le
//    résultat pour la prochaine fois qu'une réponse identique arrivera.
export async function getTranslationCorrection(params: {
  exerciseId: string;
  french: string;
  reference: string;
  focus: string;
  answer: string;
}): Promise<Correction> {
  const answerKey = normalizeAnswerKey(params.answer);

  if (answerKey === normalizeAnswerKey(params.reference)) {
    return { verdict: "correct", corrected: params.reference, summary: "Bonne réponse !", errors: [] };
  }

  const cached = await prisma.exerciseCorrectionCache.findUnique({
    where: { exerciseId_answerKey: { exerciseId: params.exerciseId, answerKey } },
  });

  if (cached) {
    const parsed = correctionSchema.safeParse(cached.correction);
    if (parsed.success) {
      return parsed.data;
    }
  }

  const correction = await correctTranslation({
    french: params.french,
    reference: params.reference,
    focus: params.focus,
    answer: params.answer,
  });

  try {
    await prisma.exerciseCorrectionCache.create({
      data: { exerciseId: params.exerciseId, answerKey, correction },
    });
  } catch (error) {
    // Une réponse identique corrigée en parallèle (deux onglets, par ex.) peut
    // violer l'unicité : sans gravité, la correction a quand même été rendue.
    console.error("Failed to cache exercise correction:", error);
  }

  return correction;
}

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
