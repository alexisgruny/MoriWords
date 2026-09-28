// Vraie DB Postgres, mais generateJsonFromClaude est mocké : aucun appel réel à Anthropic.
// Les assertions évitent volontairement tout état global de la DB (pas de
// "aucune ligne n'existe"), car d'autres fichiers de test peuvent tourner en
// parallèle sur la même base (voir cards-examples.integration.test.ts).
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { generateJsonFromClaudeMock } = vi.hoisted(() => ({ generateJsonFromClaudeMock: vi.fn() }));

vi.mock("@/lib/feeds/claude-json-generator", () => ({
  generateJsonFromClaude: generateJsonFromClaudeMock,
}));

import { prisma } from "@/lib/db/prisma";
import { conjugationForms } from "@/lib/conjugation/forms";
import { JLPT_KANJI } from "@/lib/kanji/kanji";

import {
  correctKanjiMeaningAnswer,
  correctTranslation,
  getExerciseSource,
  getTranslationCorrection,
  isKanjiExerciseId,
  logExerciseAttempt,
  pickConjugationExercise,
  pickExampleExercise,
  pickGrammarExercise,
  pickKanjiExercise,
  resolveExercise,
} from "./exercises";
import { grammarPoints } from "./points";

const testPoint = grammarPoints.find((point) => point.id === "n5-wa-desu")!;
const deckIdsToCleanUp: string[] = [];

beforeEach(async () => {
  generateJsonFromClaudeMock.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
  await prisma.grammarExercise.deleteMany({ where: { pointId: testPoint.id } });
});

afterEach(async () => {
  await prisma.grammarExercise.deleteMany({
    where: { pointId: { in: grammarPoints.filter((point) => point.level === "N5").map((point) => point.id) } },
  });
});

afterAll(async () => {
  await prisma.deck.deleteMany({ where: { id: { in: deckIdsToCleanUp } } });
  await prisma.$disconnect();
});

describe("pickGrammarExercise", () => {
  it("generates and stores exercises for a point that has none yet, then reuses them", async () => {
    generateJsonFromClaudeMock.mockResolvedValue({
      exercises: [{ french: "Je suis japonais.", japanese: "私は日本人です。" }],
    });

    const staticIds = testPoint.examples.map((_, index) => `static:${testPoint.id}:${index}`);
    const otherN5Points = grammarPoints.filter((point) => point.level === "N5" && point.id !== testPoint.id);
    // getPointPool génère dès qu'un point n'a aucune ligne stockée, même si ses
    // exemples statiques sont exclus : pour forcer l'appel sur testPoint
    // spécifiquement, chaque autre point N5 reçoit d'avance une ligne factice
    // (pas de generate), et cette ligne + les exemples statiques sont exclus.
    await prisma.grammarExercise.deleteMany({ where: { pointId: { in: otherN5Points.map((p) => p.id) } } });
    await prisma.grammarExercise.createMany({
      data: otherN5Points.map((point) => ({
        pointId: point.id,
        level: point.level,
        french: "(placeholder de test, déjà vu)",
        japanese: "（プレースホルダー）",
      })),
    });
    const otherStored = await prisma.grammarExercise.findMany({
      where: { pointId: { in: otherN5Points.map((p) => p.id) } },
    });
    const excludeAllOtherN5 = [
      ...otherN5Points.flatMap((point) => point.examples.map((_, index) => `static:${point.id}:${index}`)),
      ...otherStored.map((row) => row.id),
    ];
    const exercise = await pickGrammarExercise("N5", [...staticIds, ...excludeAllOtherN5]);

    expect(exercise).not.toBeNull();
    expect(exercise!.focus).toBe(testPoint.pattern);
    expect(generateJsonFromClaudeMock).toHaveBeenCalledTimes(1);

    const stored = await prisma.grammarExercise.findMany({ where: { pointId: testPoint.id } });
    expect(stored).toHaveLength(1);
    expect(exercise!.id).toBe(stored[0].id);

    // Un second appel pour ce même point (tout le reste exclu) réutilise ce
    // qui est en base, sans regénérer.
    generateJsonFromClaudeMock.mockClear();
    const second = await pickGrammarExercise("N5", [...staticIds, ...excludeAllOtherN5]);
    expect(second?.id).toBe(exercise!.id);
    expect(generateJsonFromClaudeMock).not.toHaveBeenCalled();
  });

  it("falls back to the point's own static examples when generation fails", async () => {
    generateJsonFromClaudeMock.mockRejectedValue(new Error("boom"));

    // N'exclut que les phrases statiques d'un autre point donné, pour que le
    // point de test reste la seule source non vide (sa génération échoue mais
    // ses 2 exemples statiques restent disponibles).
    const otherPoint = grammarPoints.find((point) => point.level === "N5" && point.id !== testPoint.id)!;
    const otherStaticIds = otherPoint.examples.map((_, index) => `static:${otherPoint.id}:${index}`);
    await prisma.grammarExercise.deleteMany({ where: { pointId: otherPoint.id } });

    const excludeEverythingElse = grammarPoints
      .filter((point) => point.level === "N5" && point.id !== testPoint.id && point.id !== otherPoint.id)
      .flatMap((point) => point.examples.map((_, index) => `static:${point.id}:${index}`));
    const otherStored = await prisma.grammarExercise.findMany({
      where: {
        pointId: {
          in: grammarPoints.filter((p) => p.level === "N5" && p.id !== testPoint.id).map((p) => p.id),
        },
      },
    });

    const exercise = await pickGrammarExercise("N5", [
      ...otherStaticIds,
      ...excludeEverythingElse,
      ...otherStored.map((row) => row.id),
    ]);

    expect(exercise).not.toBeNull();
    expect(exercise!.id.startsWith(`static:${testPoint.id}:`)).toBe(true);
  });

  it("returns null once every phrase for a point has been excluded and generation fails", async () => {
    generateJsonFromClaudeMock.mockRejectedValue(new Error("boom"));

    const allN5StaticIds = grammarPoints
      .filter((point) => point.level === "N5")
      .flatMap((point) => point.examples.map((_, index) => `static:${point.id}:${index}`));
    const allN5Stored = await prisma.grammarExercise.findMany({
      where: { pointId: { in: grammarPoints.filter((p) => p.level === "N5").map((p) => p.id) } },
    });

    const exercise = await pickGrammarExercise("N5", [...allN5StaticIds, ...allN5Stored.map((row) => row.id)]);

    expect(exercise).toBeNull();
  });

  it("restricts to the points listed in focusIn", async () => {
    generateJsonFromClaudeMock.mockRejectedValue(new Error("boom"));

    const exercise = await pickGrammarExercise("all", [], undefined, [testPoint.pattern]);

    expect(exercise?.focus).toBe(testPoint.pattern);
  });
});

describe("resolveExercise", () => {
  it("resolves a static example by its point and index", async () => {
    const resolved = await resolveExercise(`static:${testPoint.id}:0`);

    expect(resolved).toEqual({
      french: testPoint.examples[0].fr,
      japanese: testPoint.examples[0].ja,
      focus: testPoint.pattern,
      level: testPoint.level,
    });
  });

  it("returns null for an unknown id", async () => {
    await expect(resolveExercise("static:unknown-point:0")).resolves.toBeNull();
  });
});

describe("pickExampleExercise and resolveExercise round-trip", () => {
  it("picks a freshly created card example and resolves it back, then excludes it", async () => {
    const deck = await prisma.deck.create({ data: { name: `Exercise test deck ${Date.now()}` } });
    deckIdsToCleanUp.push(deck.id);
    const card = await prisma.card.create({
      data: { deckId: deck.id, lemma: "食べる", meaning: "manger", sourceLanguage: "ja", targetLanguage: "fr" },
    });
    const example = await prisma.cardExample.create({
      data: { cardId: card.id, japanese: "何を食べますか。", translation: "Que manges-tu ?" },
    });
    const ownId = `ex:${example.id}`;

    // Exclut toutes les autres phrases d'exemple existantes (créées par
    // d'autres tests exécutés en parallèle) pour ne laisser que la nôtre.
    const others = (await prisma.cardExample.findMany({ where: { id: { not: example.id } } })).map(
      (row) => `ex:${row.id}`,
    );

    const exercise = await pickExampleExercise("all", others);
    expect(exercise?.id).toBe(ownId);
    expect(exercise?.focus).toBe("食べる");

    const resolved = await resolveExercise(ownId);
    expect(resolved).toEqual({
      french: "Que manges-tu ?",
      japanese: "何を食べますか。",
      focus: "食べる",
      level: "N5",
    });

    // Une fois exclue, elle ne peut plus être proposée à nouveau.
    const excludingOwn = await pickExampleExercise("all", [...others, ownId]);
    expect(excludingOwn?.id).not.toBe(ownId);
  });

  it("filters by JLPT level, computed from the card's lemma", async () => {
    const deck = await prisma.deck.create({ data: { name: `Exercise level test deck ${Date.now()}` } });
    deckIdsToCleanUp.push(deck.id);
    // 食べる est classé N5 par le référentiel JLPT local.
    const card = await prisma.card.create({
      data: { deckId: deck.id, lemma: "食べる", meaning: "manger", sourceLanguage: "ja", targetLanguage: "fr" },
    });
    const example = await prisma.cardExample.create({
      data: { cardId: card.id, japanese: "何を食べますか。", translation: "Que manges-tu ?" },
    });
    const ownId = `ex:${example.id}`;
    const others = (await prisma.cardExample.findMany({ where: { id: { not: example.id } } })).map(
      (row) => `ex:${row.id}`,
    );

    const matching = await pickExampleExercise("N5", others);
    expect(matching?.id).toBe(ownId);

    const nonMatching = await pickExampleExercise("N2", others);
    expect(nonMatching).toBeNull();
  });

  it("restricts to the lemmas listed in focusIn", async () => {
    const deck = await prisma.deck.create({ data: { name: `Exercise focusIn test deck ${Date.now()}` } });
    deckIdsToCleanUp.push(deck.id);
    const wantedCard = await prisma.card.create({
      data: { deckId: deck.id, lemma: "食べる", meaning: "manger", sourceLanguage: "ja", targetLanguage: "fr" },
    });
    const otherCard = await prisma.card.create({
      data: { deckId: deck.id, lemma: "飲む", meaning: "boire", sourceLanguage: "ja", targetLanguage: "fr" },
    });
    await prisma.cardExample.create({
      data: { cardId: wantedCard.id, japanese: "何を食べますか。", translation: "Que manges-tu ?" },
    });
    await prisma.cardExample.create({
      data: { cardId: otherCard.id, japanese: "何を飲みますか。", translation: "Que bois-tu ?" },
    });

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const exercise = await pickExampleExercise("all", [], ["食べる"]);
      expect(exercise?.focus).toBe("食べる");
    }
  });
});

describe("pickConjugationExercise and resolveExercise round-trip", () => {
  it("picks an unseen example and resolves it back to its form", async () => {
    const form = conjugationForms.find((candidate) => candidate.id === "n5-te-form")!;
    const otherIds = conjugationForms
      .filter((candidate) => candidate.id !== form.id)
      .flatMap((candidate) => candidate.examples.map((_, index) => `conj:${candidate.id}:${index}`));

    const exercise = await pickConjugationExercise("all", otherIds);

    expect(exercise?.id.startsWith(`conj:${form.id}:`)).toBe(true);
    expect(exercise?.focus).toBe(form.name);
    expect(exercise?.level).toBe("N5");

    const resolved = await resolveExercise(exercise!.id);
    const index = Number(exercise!.id.split(":")[2]);
    expect(resolved).toEqual({
      french: form.examples[index].meaning,
      japanese: form.examples[index].conjugated,
      focus: form.name,
      level: form.level,
    });
  });

  it("filters by JLPT level", async () => {
    const n4 = await pickConjugationExercise("N4", []);
    expect(n4).not.toBeNull();
    expect(n4?.level).toBe("N4");
  });

  it("returns null once every example has been excluded", async () => {
    const allIds = conjugationForms.flatMap((form) =>
      form.examples.map((_, index) => `conj:${form.id}:${index}`),
    );

    await expect(pickConjugationExercise("all", allIds)).resolves.toBeNull();
  });

  it("restricts to the form names listed in focusIn", async () => {
    const form = conjugationForms.find((candidate) => candidate.id === "n5-te-form")!;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const exercise = await pickConjugationExercise("all", [], [form.name]);
      expect(exercise?.focus).toBe(form.name);
    }
  });
});

describe("pickKanjiExercise and resolveExercise round-trip", () => {
  it("picks an unseen kanji and resolves it back", async () => {
    const entry = JLPT_KANJI.find((candidate) => candidate.kanji === "食")!;
    const otherIds = JLPT_KANJI.filter((candidate) => candidate.kanji !== entry.kanji).map(
      (candidate) => `kanji:${candidate.kanji}`,
    );

    const exercise = await pickKanjiExercise("all", otherIds);

    expect(exercise?.id).toBe(`kanji:${entry.kanji}`);
    expect(exercise?.french).toBe(entry.kanji);
    expect(exercise?.level).toBe(entry.level);

    const resolved = await resolveExercise(exercise!.id);
    expect(resolved).toEqual({
      french: entry.kanji,
      japanese: entry.meaning,
      focus: [...entry.onReadings, ...entry.kunReadings].join("・"),
      level: entry.level,
    });
  });

  it("filters by JLPT level", async () => {
    const n4 = await pickKanjiExercise("N4", []);
    expect(n4).not.toBeNull();
    expect(n4?.level).toBe("N4");
  });

  it("returns null once every kanji has been excluded", async () => {
    const allIds = JLPT_KANJI.map((entry) => `kanji:${entry.kanji}`);

    await expect(pickKanjiExercise("all", allIds)).resolves.toBeNull();
  });

  it("restricts to the readings listed in focusIn", async () => {
    const entry = JLPT_KANJI.find((candidate) => candidate.kanji === "食")!;
    const focus = [...entry.onReadings, ...entry.kunReadings].join("・");

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const exercise = await pickKanjiExercise("all", [], [focus]);
      expect(exercise?.focus).toBe(focus);
    }
  });
});

describe("correctKanjiMeaningAnswer", () => {
  it("marks an exact match as correct without calling Claude", () => {
    expect(generateJsonFromClaudeMock).not.toHaveBeenCalled();
    expect(correctKanjiMeaningAnswer({ reference: "manger, nourriture", answer: "manger" })).toEqual({
      verdict: "correct",
      corrected: "manger, nourriture",
      summary: "Bonne réponse !",
      errors: [],
    });
  });

  it("matches any of the comma-separated synonyms", () => {
    expect(correctKanjiMeaningAnswer({ reference: "manger, nourriture", answer: "nourriture" }).verdict).toBe(
      "correct",
    );
  });

  it("ignores accents, case and a leading article", () => {
    expect(correctKanjiMeaningAnswer({ reference: "puits, communauté", answer: "UN PUITS" }).verdict).toBe(
      "correct",
    );
    expect(correctKanjiMeaningAnswer({ reference: "âme, esprit", answer: "ame" }).verdict).toBe("correct");
  });

  it("marks an unrelated answer as incorrect and shows the expected meaning", () => {
    const correction = correctKanjiMeaningAnswer({ reference: "manger, nourriture", answer: "boire" });

    expect(correction.verdict).toBe("incorrect");
    expect(correction.corrected).toBe("manger, nourriture");
    expect(correction.errors).toEqual([
      { wrong: "boire", right: "manger, nourriture", explanation: "Le sens attendu est : manger, nourriture." },
    ]);
  });
});

describe("isKanjiExerciseId", () => {
  it("recognizes kanji exercise ids and rejects other sources", () => {
    expect(isKanjiExerciseId("kanji:食")).toBe(true);
    expect(isKanjiExerciseId("static:n5-wa-desu:0")).toBe(false);
    expect(isKanjiExerciseId("conj:n5-te-form:0")).toBe(false);
  });
});

describe("getExerciseSource", () => {
  it("identifies each exercise id prefix, defaulting unprefixed ids to grammar", () => {
    expect(getExerciseSource("kanji:食")).toBe("kanji");
    expect(getExerciseSource("conj:n5-te-form:0")).toBe("conjugation");
    expect(getExerciseSource("ex:some-card-example-id")).toBe("examples");
    expect(getExerciseSource("static:n5-wa-desu:0")).toBe("grammar");
    expect(getExerciseSource("cuid-style-grammar-exercise-row-id")).toBe("grammar");
  });
});

describe("logExerciseAttempt", () => {
  const exerciseId = `test-attempt-log:kanji:${Date.now()}`;

  afterEach(async () => {
    await prisma.exerciseAttempt.deleteMany({ where: { focus: exerciseId } });
  });

  it("records the attempt with the source derived from the exercise id", async () => {
    await logExerciseAttempt({ exerciseId, focus: exerciseId, level: "N5", correct: true });

    const rows = await prisma.exerciseAttempt.findMany({ where: { focus: exerciseId } });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ source: "grammar", focus: exerciseId, level: "N5", correct: true });
  });
});

describe("getTranslationCorrection", () => {
  const exerciseId = `test-correction-cache:${Date.now()}`;

  afterEach(async () => {
    await prisma.exerciseCorrectionCache.deleteMany({ where: { exerciseId: { startsWith: "test-correction-cache:" } } });
  });

  it("accepts an answer matching the reference exactly, without calling Claude", async () => {
    const correction = await getTranslationCorrection({
      exerciseId,
      french: "Je suis étudiant.",
      reference: "私は学生です。",
      focus: "AはBです",
      answer: "私は学生です。",
    });

    expect(correction).toEqual({
      verdict: "correct",
      corrected: "私は学生です。",
      summary: "Bonne réponse !",
      errors: [],
    });
    expect(generateJsonFromClaudeMock).not.toHaveBeenCalled();
  });

  it("ignores a trailing punctuation/whitespace difference from the reference", async () => {
    const correction = await getTranslationCorrection({
      exerciseId,
      french: "Je suis étudiant.",
      reference: "私は学生です。",
      focus: "AはBです",
      answer: "私は学生です",
    });

    expect(correction.verdict).toBe("correct");
    expect(generateJsonFromClaudeMock).not.toHaveBeenCalled();
  });

  it("calls Claude once for a new wrong answer, then reuses the cached correction", async () => {
    generateJsonFromClaudeMock.mockResolvedValue({
      verdict: "almost",
      corrected: "私は学生です。",
      summary: "Presque parfait !",
      errors: [{ wrong: "学生だ", right: "学生です", explanation: "Utilise la forme polie です." }],
    });

    const first = await getTranslationCorrection({
      exerciseId,
      french: "Je suis étudiant.",
      reference: "私は学生です。",
      focus: "AはBです",
      answer: "私は学生だ。",
    });

    expect(first.verdict).toBe("almost");
    expect(generateJsonFromClaudeMock).toHaveBeenCalledTimes(1);

    generateJsonFromClaudeMock.mockClear();

    const second = await getTranslationCorrection({
      exerciseId,
      french: "Je suis étudiant.",
      reference: "私は学生です。",
      focus: "AはBです",
      answer: "私は学生だ。",
    });

    expect(second).toEqual(first);
    expect(generateJsonFromClaudeMock).not.toHaveBeenCalled();
  });

  it("does not reuse a cached correction from a different exercise", async () => {
    generateJsonFromClaudeMock.mockResolvedValue({
      verdict: "incorrect",
      corrected: "私は学生です。",
      summary: "À revoir",
      errors: [],
    });

    await getTranslationCorrection({
      exerciseId,
      french: "Je suis étudiant.",
      reference: "私は学生です。",
      focus: "AはBです",
      answer: "違う答え",
    });

    generateJsonFromClaudeMock.mockClear();

    await getTranslationCorrection({
      exerciseId: `${exerciseId}-other`,
      french: "Je suis étudiant.",
      reference: "私は学生です。",
      focus: "AはBです",
      answer: "違う答え",
    });

    expect(generateJsonFromClaudeMock).toHaveBeenCalledTimes(1);
  });
});

describe("correctTranslation", () => {
  it("returns the parsed correction from Claude", async () => {
    generateJsonFromClaudeMock.mockResolvedValue({
      verdict: "almost",
      corrected: "私は学生です。",
      summary: "Presque parfait !",
      errors: [{ wrong: "学生だ", right: "学生です", explanation: "Utilise la forme polie です." }],
    });

    const correction = await correctTranslation({
      french: "Je suis étudiant.",
      reference: "私は学生です。",
      focus: "AはBです",
      answer: "私は学生だ。",
    });

    expect(correction.verdict).toBe("almost");
    expect(correction.errors).toHaveLength(1);
  });
});
