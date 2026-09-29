// Lecture à voix haute du japonais avec la synthèse vocale du navigateur ou
// du téléphone (Web Speech API) : gratuite, sans service externe, rien
// n'est envoyé à un serveur de MoriWords.

// Un peu plus lent que la normale : on apprend, on n'écoute pas un anime.
const LEARNER_RATE = 0.85;

export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

// Voix japonaise installée (les listes se chargent parfois après coup).
export function findJapaneseVoice(): SpeechSynthesisVoice | undefined {
  if (!isSpeechSupported()) {
    return undefined;
  }
  const voices = window.speechSynthesis.getVoices();
  const japanese = voices.filter((voice) => voice.lang.replace("_", "-").toLowerCase().startsWith("ja"));
  // Les voix locales démarrent sans délai réseau ; sinon la première venue.
  return japanese.find((voice) => voice.localService) ?? japanese[0];
}

export function speakJapanese(text: string, rate = LEARNER_RATE) {
  if (!isSpeechSupported() || !text.trim()) {
    return;
  }
  const synthesis = window.speechSynthesis;
  // Un nouveau clic coupe la lecture en cours au lieu de s'y ajouter.
  synthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ja-JP";
  const voice = findJapaneseVoice();
  if (voice) {
    try {
      utterance.voice = voice;
    } catch {
      // Voix refusée par le navigateur : lang = ja-JP choisit sa voix japonaise par défaut.
    }
  }
  utterance.rate = rate;
  synthesis.speak(utterance);
}

// Texte à prononcer pour un kanji seul : ses lectures (la voix choisirait
// sinon une lecture au hasard), sans le point d'okurigana ni le tiret.
export function readingsToSpeak(readings: string[]): string {
  return readings.map((reading) => reading.replace(/[.-]/g, "")).join("、");
}
