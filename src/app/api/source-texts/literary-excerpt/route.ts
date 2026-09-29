import { requireUser } from "@/lib/auth/session";
import { setClaudeContext } from "@/lib/security/claude-usage";
import { limitByIp } from "@/lib/security/rate-limit";
import { prisma } from "@/lib/db/prisma";
import { reuseSharedText } from "@/lib/feeds/shared-texts";
import { LiteraryExcerptServiceError, generateLiteraryExcerpt } from "@/lib/feeds/literary-excerpt";

// Génère un court extrait littéraire pastiche via Claude et l'enregistre
// comme nouveau texte source, prêt à être analysé comme n'importe quel
// autre texte.
export async function POST(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) {
    return user;
  }

  setClaudeContext({ userId: user.id, action: "literary-excerpt" });

  const limited = await limitByIp(request, "claude");
  if (limited) {
    return limited;
  }

  try {
    // Un texte déjà généré pour un autre compte et pas encore vu : aucun
    // appel à Claude (voir src/lib/feeds/shared-texts.ts).
    const shared = await reuseSharedText(user.id, "literary-excerpt");
    if (shared) {
      return Response.json({ sourceText: shared }, { status: 201 });
    }

    // Récupère les styles récents pour éviter que Claude se répète.
    const recentTexts = await prisma.sourceText.findMany({
      where: { origin: "literary-excerpt", userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: { title: true },
    });

    const excerpt = await generateLiteraryExcerpt(
      recentTexts.map((entry) => entry.title).filter((title): title is string => Boolean(title)),
    );

    const sourceText = await prisma.sourceText.create({
      data: {
        userId: user.id,
        content: excerpt.content,
        title: excerpt.styleReference,
        origin: "literary-excerpt",
        category: "literature",
        sourceLanguage: "ja",
        targetLanguage: "fr",
      },
    });

    return Response.json({ sourceText }, { status: 201 });
  } catch (error) {
    if (error instanceof LiteraryExcerptServiceError) {
      return Response.json({ error: error.message }, { status: 502 });
    }

    console.error("Failed to generate literary excerpt:", error);
    return Response.json(
      { error: "Impossible de générer un extrait pour le moment." },
      { status: 500 },
    );
  }
}
