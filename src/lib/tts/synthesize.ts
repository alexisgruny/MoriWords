import { prisma } from "@/lib/db/prisma";

const ELEVENLABS_TIMEOUT_MS = 20_000;
const DEFAULT_JAPANESE_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

export type SpeechResult = {
  audioCacheId: string;
};

export class TtsServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TtsServiceError";
  }
}

function voiceIdFor(language: string): string {
  if (language === "ja") {
    return process.env.ELEVENLABS_JAPANESE_VOICE_ID ?? DEFAULT_JAPANESE_VOICE_ID;
  }

  return process.env.ELEVENLABS_VOICE_ID ?? DEFAULT_JAPANESE_VOICE_ID;
}

export async function synthesizeSpeech(
  text: string,
  language: string,
): Promise<SpeechResult | null> {
  const cleanedText = text.trim();

  if (!cleanedText) {
    return null;
  }

  const voice = voiceIdFor(language);

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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ELEVENLABS_TIMEOUT_MS);

  let response: Response;

  try {
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
    if (fetchError instanceof Error && fetchError.name === "AbortError") {
      throw new TtsServiceError("Le service audio met trop de temps à répondre.");
    }

    console.error("ElevenLabs request failed:", fetchError);
    throw new TtsServiceError("Le service audio est injoignable pour le moment.");
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errorPayload = await response.text();
    console.error(`ElevenLabs API error (${response.status}):`, errorPayload || response.statusText);
    throw new TtsServiceError("Le service audio est momentanément indisponible.");
  }

  const audioBuffer = Buffer.from(await response.arrayBuffer());

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
