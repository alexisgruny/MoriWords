import { toHiragana } from "wanakana";

import { conjugationForms } from "@/lib/conjugation/forms";
import { conjugationsOf } from "@/lib/conjugation/conjugate";
import { GAME_WORDS } from "@/lib/games/words";
import { GRAMMAR_LEVELS, grammarPoints, type GrammarLevel } from "@/lib/grammar/points";
import { JLPT_KANJI, type KanjiEntry } from "@/lib/kanji/kanji";
import type { CategoryResult, ExamCategory, ExamQuestion } from "@/lib/exams/types";

export type Exam = { questions: ExamQuestion[]; answers: number[] };

export const PASS_RATE = 0.75;
export const EXAM_LEVELS = GRAMMAR_LEVELS;

// Nombre de questions par catégorie. Le vocabulaire (mots avec leur sens en
// français) n'existe qu'en N5 : ailleurs, plus de kanji.
const PLAN: Record<"N5" | "other", Record<ExamCategory, number>> = {
  N5: { "kanji-sens": 10, "kanji-lecture": 6, vocabulaire: 8, grammaire: 10, conjugaison: 6 },
  other: { "kanji-sens": 14, "kanji-lecture": 8, vocabulaire: 0, grammaire: 12, conjugaison: 6 },
};

// Générateur pseudo-aléatoire déterministe (mulberry32) : la même graine
// redonne le même examen, ce qui permet de corriger côté serveur sans
// stocker les questions.
function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(items: T[], random: () => number): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy;
}

// Place la bonne réponse parmi 3 pièges distincts (null si pas assez de pièges).
function withChoices(
  base: Omit<ExamQuestion, "choices">,
  answer: string,
  candidates: string[],
  random: () => number,
): { question: ExamQuestion; answer: number } | null {
  const wrong = [...new Set(shuffled(candidates, random))].filter((candidate) => candidate !== answer).slice(0, 3);
  if (wrong.length < 3) {
    return null;
  }
  const choices = shuffled([answer, ...wrong], random);
  return { question: { ...base, choices }, answer: choices.indexOf(answer) };
}

// Lectures kun'yomi d'un kanji sous forme de mot : た.べる → 食べる / たべる.
// Les lectures à tiret (préfixes, suffixes) sont ignorées.
type KunWord = { written: string; stem: string; okurigana: string };
function kunWords(entry: KanjiEntry): KunWord[] {
  return entry.kunReadings
    .filter((reading) => !reading.includes("-"))
    .map((reading) => {
      const [stem, okurigana = ""] = reading.split(".");
      return { written: entry.kanji + okurigana, stem: toHiragana(stem), okurigana };
    })
    .filter((word) => word.stem.length > 0);
}
const allReadingsOf = (entry: KanjiEntry) =>
  new Set([...kunWords(entry).map((word) => word.stem + word.okurigana), ...entry.onReadings.map((reading) => toHiragana(reading.replace(/[-.]/g, "")))]);

type Built = { question: ExamQuestion; answer: number } | null;

function kanjiMeaningQuestions(kanji: KanjiEntry[], count: number, random: () => number): Built[] {
  return shuffled(kanji, random)
    .slice(0, count)
    .map((entry) =>
      withChoices(
        { category: "kanji-sens", prompt: "Que veut dire ce kanji ?", subject: entry.kanji, choicesLang: "fr" },
        entry.meaning,
        kanji.filter((other) => other.meaning !== entry.meaning).map((other) => other.meaning),
        random,
      ),
    );
}

// Lecture japonaise (kun'yomi) d'un mot écrit avec le kanji. Les pièges
// gardent les mêmes okurigana (…べる) : sinon la bonne réponse serait la
// seule à finir comme le mot affiché.
function kanjiReadingQuestions(kanji: KanjiEntry[], count: number, random: () => number): Built[] {
  const otherStems = (entry: KanjiEntry) =>
    kanji.filter((other) => other.kanji !== entry.kanji).flatMap((other) => kunWords(other).map((word) => word.stem));
  return shuffled(
    kanji.filter((entry) => kunWords(entry).length > 0),
    random,
  )
    .slice(0, count)
    .map((entry) => {
      const words = kunWords(entry);
      const word = words[Math.floor(random() * words.length)];
      const own = allReadingsOf(entry);
      const answer = word.stem + word.okurigana;
      const wrong = otherStems(entry)
        .map((stem) => stem + word.okurigana)
        .filter((reading) => !own.has(reading));
      return withChoices(
        {
          category: "kanji-lecture",
          prompt: "Comment se lit ce mot (lecture japonaise, kun'yomi) ?",
          subject: word.written,
          choicesLang: "ja",
        },
        answer,
        wrong,
        random,
      );
    });
}

function vocabularyQuestions(count: number, random: () => number): Built[] {
  return shuffled(GAME_WORDS, random)
    .slice(0, count)
    .map((word) =>
      withChoices(
        {
          category: "vocabulaire",
          prompt: word.written === word.kana ? "Que veut dire ce mot ?" : `Que veut dire ce mot (${word.kana}) ?`,
          subject: word.written,
          choicesLang: "fr",
        },
        word.fr,
        GAME_WORDS.filter((other) => other.fr !== word.fr).map((other) => other.fr),
        random,
      ),
    );
}

// Phrase française → la bonne phrase japonaise parmi d'autres exemples du niveau.
function grammarQuestions(level: GrammarLevel, count: number, random: () => number): Built[] {
  const examples = grammarPoints.filter((point) => point.level === level).flatMap((point) => point.examples);
  return shuffled(examples, random)
    .slice(0, count)
    .map((example) =>
      withChoices(
        { category: "grammaire", prompt: `Comment dit-on : « ${example.fr} » ?`, choicesLang: "ja" },
        example.ja,
        examples.filter((other) => other.ja !== example.ja).map((other) => other.ja),
        random,
      ),
    );
}

// Formes proposées à l'examen, décrites en français seulement : le nom de
// la forme (« Forme en ません ») donnerait la terminaison à repérer.
// avoid : pièges écartés car aussi justes (書けば et 書いたら = « si on écrit »).
// Les formes absentes (~たら, trop proche de ~ば sans sa terminaison) ne sont
// pas demandées.
const EXAM_FORMS: Record<string, { label: string; avoid?: RegExp }> = {
  "n5-masu": { label: "au présent poli" },
  "n5-masen": { label: "au présent poli négatif" },
  "n5-mashita": { label: "au passé poli" },
  "n5-te-form": { label: "à la forme de liaison (« … et … »)" },
  "n5-teiru": { label: "pour une action en cours ou un état" },
  "n5-nai-form": { label: "au présent négatif familier" },
  "n5-ta-form": { label: "au passé familier" },
  "n5-nakatta": { label: "au passé négatif familier" },
  "n5-i-adjective": { label: "(adjectif), en style familier" },
  "n5-na-adjective": { label: "(adjectif), en style familier" },
  "n5-tai": { label: "pour exprimer une envie" },
  "n5-mashou": { label: "pour proposer poliment (« faisons… »)" },
  "n4-volitional-plain": { label: "pour proposer entre amis (« faisons… »)" },
  "n4-conditional-ba": { label: "au conditionnel (« si… »)", avoid: /[ただ]ら$/ },
  "n4-potential": { label: "à la forme de capacité (« pouvoir… »)" },
  "n4-passive": { label: "à la voix passive" },
  "n4-nakereba": { label: "pour exprimer une obligation" },
  "n3-causative": { label: "pour faire faire ou laisser faire" },
  "n3-causative-passive": { label: "pour « être forcé de… »" },
  "n3-sou-looks-like": { label: "pour « avoir l'air de… »" },
  "n2-sonkeigo-regular": { label: "en langage honorifique" },
  "n2-kenjougo-regular": { label: "en langage humble" },
  "n2-sonkeigo-irregular": { label: "en langage honorifique" },
  "n2-kenjougo-irregular": { label: "en langage humble" },
  "n1-literary-negative": { label: "à la négation littéraire" },
  "n1-tsutsu-aru": { label: "pour une évolution en cours (style écrit)" },
};

// Mot à conjuguer + description française + sens voulu (le sens tranche
// entre affirmatif et négatif) ; pièges : autres formes du même mot.
function conjugationQuestions(level: GrammarLevel, count: number, random: () => number): Built[] {
  const levelIndex = GRAMMAR_LEVELS.indexOf(level);
  const forms = conjugationForms.filter((form) => form.id in EXAM_FORMS && GRAMMAR_LEVELS.indexOf(form.level) <= levelIndex);
  // Formes du niveau d'abord, puis des niveaux inférieurs si besoin.
  const pool = [
    ...shuffled(forms.filter((form) => form.level === level), random),
    ...shuffled(forms.filter((form) => form.level !== level), random),
  ].flatMap((form) => form.examples.map((example) => ({ form, example })));

  const built: Built[] = [];
  const usedBases = new Set<string>();
  for (const { form, example } of pool) {
    if (built.length >= count) break;
    const key = `${form.id}:${example.base}`;
    // « 書かせられる / 書かされる » : deux réponses possibles, pas pour un QCM.
    if (usedBases.has(key) || example.conjugated.includes("/")) continue;
    const { label, avoid } = EXAM_FORMS[form.id];
    const question = withChoices(
      {
        category: "conjugaison",
        prompt: `Conjugue ${example.base}${example.reading ? ` (${example.reading})` : ""} ${label}, pour dire « ${example.meaning} » :`,
        choicesLang: "ja",
      },
      example.conjugated,
      conjugationsOf(example.base, example.reading).filter((candidate) => !avoid?.test(candidate)),
      random,
    );
    if (question) {
      usedBases.add(key);
      built.push(question);
    }
  }
  return built;
}

export function buildExam(level: GrammarLevel, seed: number): Exam {
  const random = seededRandom(seed);
  const plan = PLAN[level === "N5" ? "N5" : "other"];
  const kanji = JLPT_KANJI.filter((entry) => entry.level === level);

  const built = [
    ...kanjiMeaningQuestions(kanji, plan["kanji-sens"], random),
    ...kanjiReadingQuestions(kanji, plan["kanji-lecture"], random),
    ...vocabularyQuestions(plan.vocabulaire, random),
    ...grammarQuestions(level, plan.grammaire, random),
    ...conjugationQuestions(level, plan.conjugaison, random),
  ].filter((item): item is NonNullable<Built> => item !== null);

  const ordered = shuffled(built, random);
  return { questions: ordered.map((item) => item.question), answers: ordered.map((item) => item.answer) };
}

// Correction : score global et réussite par catégorie (points faibles).
export function gradeExam(exam: Exam, given: number[]) {
  const byCategory: Partial<Record<ExamCategory, CategoryResult>> = {};
  let score = 0;
  exam.questions.forEach((question, index) => {
    const isCorrect = given[index] === exam.answers[index];
    const entry = (byCategory[question.category] ??= { correct: 0, total: 0 });
    entry.total += 1;
    if (isCorrect) {
      entry.correct += 1;
      score += 1;
    }
  });
  const total = exam.questions.length;
  return { score, total, passed: score >= Math.ceil(total * PASS_RATE), byCategory };
}
