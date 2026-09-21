export type CardPayload = {
  lemma: string;
  surface?: string | null;
  reading?: string | null;
  meaning?: string | null;
};

export function normalizeCardPayload(input: CardPayload) {
  const lemma = input.lemma.trim();

  return {
    lemma,
    surface: normalizeNullable(input.surface),
    reading: normalizeNullable(input.reading),
    meaning: normalizeNullable(input.meaning),
  };
}

function normalizeNullable(value: string | null | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : null;
}
