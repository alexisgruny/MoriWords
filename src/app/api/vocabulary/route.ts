import { prisma } from "@/lib/db/prisma";
import { classifyDifficulty } from "@/lib/difficulty/classify";
import type { TokenResult } from "@/lib/tokenizer/types";
import { buildVocabularySummary } from "@/lib/vocabulary/build-vocabulary";

// Forme attendue du corps de la requête.
type SaveVocabularyBody = {
  tokens: TokenResult[];
  sourceLanguage?: string;
  targetLanguage?: string;
};

// Vérifie que le corps de la requête a bien une liste de tokens.
function isSaveVocabularyBody(value: unknown): value is SaveVocabularyBody {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return Array.isArray(candidate.tokens);
}

// Renvoie les 20 mots les plus fréquents du vocabulaire global.
export async function GET() {
  try {
    const entries = await prisma.vocabularyEntry.findMany({
      orderBy: {
        occurrenceCount: "desc",
      },
      take: 20,
    });

    // Calcule le niveau JLPT à la volée plutôt que de relire la colonne
    // enregistrée : les améliorations du dataset s'appliquent ainsi aussi aux
    // mots déjà sauvegardés.
    const normalizedEntries = entries.map((entry) => ({
      ...entry,
      difficulty: classifyDifficulty(entry.lemma, entry.reading, entry.partOfSpeech),
    }));

    return Response.json({ entries: normalizedEntries });
  } catch {
    return Response.json(
      { error: "Impossible de récupérer le vocabulaire." },
      { status: 500 },
    );
  }
}

// Regroupe une liste de tokens par mot et met à jour le vocabulaire global :
// crée les mots nouveaux, incrémente le compteur des mots déjà connus.
export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    if (!isSaveVocabularyBody(body) || body.tokens.length === 0) {
      return Response.json(
        { error: "tokens est requis." },
        { status: 400 },
      );
    }

    const sourceLanguage = body.sourceLanguage ?? "ja";
    const targetLanguage = body.targetLanguage ?? "fr";
    const vocabulary = buildVocabularySummary(body.tokens);

    const saved = await Promise.all(
      vocabulary.map((entry) =>
        prisma.vocabularyEntry.upsert({
          where: {
            lemma_sourceLanguage_targetLanguage: {
              lemma: entry.lemma,
              sourceLanguage,
              targetLanguage,
            },
          },
          update: {
            occurrenceCount: {
              increment: entry.count,
            },
            surface: entry.lemma,
            reading: entry.reading ?? null,
            partOfSpeech: entry.partOfSpeech,
            difficulty: entry.difficulty,
          },
          create: {
            lemma: entry.lemma,
            surface: entry.lemma,
            reading: entry.reading ?? null,
            partOfSpeech: entry.partOfSpeech,
            difficulty: entry.difficulty,
            sourceLanguage,
            targetLanguage,
            occurrenceCount: entry.count,
          },
        }),
      ),
    );

    return Response.json({ saved }, { status: 201 });
  } catch {
    return Response.json(
      { error: "Impossible de sauvegarder le vocabulaire." },
      { status: 500 },
    );
  }
}
