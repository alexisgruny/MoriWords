import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { limitUserWrites } from "@/lib/security/rate-limit";
import { classifyDifficulty } from "@/lib/difficulty/classify";
import { parseTokenList } from "@/lib/security/token-payload";
import { buildVocabularySummary } from "@/lib/vocabulary/build-vocabulary";

// Renvoie les 20 mots les plus fréquents du vocabulaire de l'utilisateur.
export async function GET(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) {
    return user;
  }

  try {
    const entries = await prisma.vocabularyEntry.findMany({
      where: { userId: user.id },
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

// Regroupe une liste de tokens par mot et met à jour le vocabulaire de l'utilisateur :
// crée les mots nouveaux, incrémente le compteur des mots déjà connus.
export async function POST(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) {
    return user;
  }

  const writesLimited = await limitUserWrites(user.id);
  if (writesLimited) {
    return writesLimited;
  }

  try {
    const body: unknown = await request.json();
    const tokens = parseTokenList(typeof body === "object" && body !== null ? (body as Record<string, unknown>).tokens : null);

    if (!tokens) {
      return Response.json({ error: "tokens est requis." }, { status: 400 });
    }

    // Seule paire de langues du site : pas de valeur libre dans la clé unique.
    const sourceLanguage = "ja";
    const targetLanguage = "fr";
    const vocabulary = buildVocabularySummary(tokens);

    const saved = await Promise.all(
      vocabulary.map((entry) =>
        prisma.vocabularyEntry.upsert({
          where: {
            userId_lemma_sourceLanguage_targetLanguage: {
              userId: user.id,
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
            userId: user.id,
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
