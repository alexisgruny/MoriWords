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
import {
  correctTranslation,
  pickExampleExercise,
  pickGrammarExercise,
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
});

describe("resolveExercise", () => {
  it("resolves a static example by its point and index", async () => {
    const resolved = await resolveExercise(`static:${testPoint.id}:0`);

    expect(resolved).toEqual({
      french: testPoint.examples[0].fr,
      japanese: testPoint.examples[0].ja,
      focus: testPoint.pattern,
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

    const exercise = await pickExampleExercise(others);
    expect(exercise?.id).toBe(ownId);
    expect(exercise?.focus).toBe("食べる");

    const resolved = await resolveExercise(ownId);
    expect(resolved).toEqual({ french: "Que manges-tu ?", japanese: "何を食べますか。", focus: "食べる" });

    // Une fois exclue, elle ne peut plus être proposée à nouveau.
    const excludingOwn = await pickExampleExercise([...others, ownId]);
    expect(excludingOwn?.id).not.toBe(ownId);
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
