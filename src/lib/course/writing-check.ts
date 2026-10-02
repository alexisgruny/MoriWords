import { toHiragana } from "wanakana";

// Comparaison d'une réponse écrite : sans ponctuation ni espaces, katakana et
// hiragana confondus (コーヒー = こーひー), pour ne juger que la phrase.
export function normalizeWritten(text: string): string {
  return toHiragana(text.replace(/[\s。、．，,.！!？?「」『』（）()・〜～]/g, ""), { passRomaji: true });
}

export function isWrittenAnswerCorrect(input: string, answers: string[]): boolean {
  const given = normalizeWritten(input);
  return given.length > 0 && answers.some((answer) => normalizeWritten(answer) === given);
}
