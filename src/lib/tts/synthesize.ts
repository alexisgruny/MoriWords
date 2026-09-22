import { prisma } from "@/lib/db/prisma";

// Délai maximum d'attente de la réponse d'ElevenLabs avant d'abandonner.
const ELEVENLABS_TIMEOUT_MS = 20_000;
// Voix par défaut utilisée si aucune voix spécifique n'est configurée.
const DEFAULT_JAPANESE_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

// Le résultat d'une synthèse vocale : l'identifiant du fichier audio en base
// (pas l'audio lui-même, pour ne pas alourdir les réponses de l'API).
export type SpeechResult = {
  audioCacheId: string;
};

// Erreur levée quand la génération audio échoue, avec un message
// compréhensible pour l'utilisateur (jamais le détail technique brut).
export class TtsServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TtsServiceError";
  }
}

// Choisit quelle voix ElevenLabs utiliser selon la langue du texte.
function voiceIdFor(language: string): string {
  if (language === "ja") {
    return process.env.ELEVENLABS_JAPANESE_VOICE_ID ?? DEFAULT_JAPANESE_VOICE_ID;
  }

  return process.env.ELEVENLABS_VOICE_ID ?? DEFAULT_JAPANESE_VOICE_ID;
}

// Génère un fichier audio pour un texte donné. Vérifie d'abord le cache pour
// ne pas regénérer deux fois le même son ; renvoie null si aucune clé API
// n'est configurée, sans jamais bloquer l'utilisation de la carte.
export async function synthesizeSpeech(
  text: string,
  language: string,
): Promise<SpeechResult | null> {
  const cleanedText = text.trim();

  if (!cleanedText) {
    return null;
  }

  const voice = voiceIdFor(language);

  // Réutilise un audio déjà généré pour ce même texte, langue et voix.
  const cached = await prisma.audioCache.findUnique({
    where: {
      text_language_voice: {
        text: cleanedText,
        language,
        voice,
      },
    },
    select: { id: true },
  });

  if (cached) {
    return { audioCacheId: cached.id };
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey || apiKey.trim().length === 0) {
    return null;
  }

  // Prépare l'annulation automatique si la requête prend trop de temps.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ELEVENLABS_TIMEOUT_MS);

  let response: Response;

  try {
    // Demande à ElevenLabs de générer l'audio pour ce texte.
    response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: cleanedText,
        model_id: "eleven_multilingual_v2",
      }),
      signal: controller.signal,
    });
  } catch (fetchError) {
    // Distingue un simple délai dépassé d'une vraie panne réseau.
    if (fetchError instanceof Error && fetchError.name === "AbortError") {
      throw new TtsServiceError("Le service audio met trop de temps à répondre.");
    }

    console.error("ElevenLabs request failed:", fetchError);
    throw new TtsServiceError("Le service audio est injoignable pour le moment.");
  } finally {
    clearTimeout(timeoutId);
  }

  // Si ElevenLabs répond avec une erreur, on logue le détail côté serveur et
  // on renvoie un message générique côté client (jamais le détail brut).
  if (!response.ok) {
    const errorPayload = await response.text();
    console.error(`ElevenLabs API error (${response.status}):`, errorPayload || response.statusText);
    throw new TtsServiceError("Le service audio est momentanément indisponible.");
  }

  // Récupère les octets de l'audio généré.
  const audioBuffer = Buffer.from(await response.arrayBuffer());

  // Enregistre le fichier audio en base pour ne pas le regénérer plus tard.
  const audioCache = await prisma.audioCache.upsert({
    where: {
      text_language_voice: {
        text: cleanedText,
        language,
        voice,
      },
    },
    update: {},
    create: {
      text: cleanedText,
      language,
      voice,
      audioData: audioBuffer,
      mimeType: "audio/mpeg",
    },
    select: { id: true },
  });

  return { audioCacheId: audioCache.id };
}
