import { prisma } from "@/lib/db/prisma";

// Sert un fichier audio stocké en base, avec un cache navigateur longue
// durée puisque le contenu ne change jamais pour un même identifiant.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ cacheId: string }> },
) {
  const { cacheId } = await params;

  const audio = await prisma.audioCache.findUnique({
    where: { id: cacheId },
    select: { audioData: true, mimeType: true },
  });

  if (!audio) {
    return Response.json({ error: "Audio introuvable." }, { status: 404 });
  }

  return new Response(new Uint8Array(audio.audioData), {
    headers: {
      "Content-Type": audio.mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
