import path from "node:path";
import kuromoji from "kuromoji";
import type {
  IpadicFeatures,
  Tokenizer as KuromojiTokenizer,
} from "kuromoji";
import type { TokenResult, Tokenizer } from "./types";
import { classifyDifficulty } from "../difficulty/classify";

type JapaneseTokenData = Pick<
  IpadicFeatures,
  "surface_form" | "basic_form" | "reading" | "pos" | "word_position"
>;

export function toHiragana(reading: string): string {
  return reading.replace(/[\u30a1-\u30f6]/g, (character) => {
    const codePoint = character.codePointAt(0);

    return codePoint === undefined
      ? character
      : String.fromCodePoint(codePoint - 0x60);
  });
}

export function isNonLexicalToken(
  token: Pick<IpadicFeatures, "surface_form" | "pos">,
): boolean {
  return (
    token.pos === "記号" ||
    token.surface_form.trim().length === 0 ||
    /^[\p{P}\p{S}]$/u.test(token.surface_form)
  );
}

export function mapJapaneseToken(token: JapaneseTokenData): TokenResult {
  const baseForm =
    token.basic_form === "*" ? token.surface_form : token.basic_form;
  const reading =
    token.reading === undefined || token.reading === "*"
      ? undefined
      : toHiragana(token.reading);

  return {
    surface: token.surface_form,
    baseForm,
    reading,
    partOfSpeech: token.pos,
    difficulty: classifyDifficulty(baseForm, reading, token.pos),
    position: token.word_position,
  };
}

export class JapaneseTokenizer implements Tokenizer {
  readonly language = "ja";

  private readonly tokenizerPromise: Promise<KuromojiTokenizer<IpadicFeatures>>;

  constructor() {
    this.tokenizerPromise = new Promise((resolve, reject) => {
      const dictionaryPath = path.join(
        process.cwd(),
        "node_modules",
        "kuromoji",
        "dict",
      );

      const builder = kuromoji.builder;

      if (!builder || typeof builder !== "function") {
        reject(new Error("Kuromoji builder is not available."));
        return;
      }

      builder.call(kuromoji, { dicPath: dictionaryPath })
        .build((error: Error | null, tokenizer: KuromojiTokenizer<IpadicFeatures> | undefined) => {
          if (error || !tokenizer) {
            reject(error ?? new Error("Kuromoji tokenizer is unavailable."));
            return;
          }

          resolve(tokenizer);
        });
    });
  }

  async tokenize(text: string): Promise<TokenResult[]> {
    if (text.trim().length === 0) {
      return [];
    }

    const tokenizer = await this.tokenizerPromise;
    const tokens = tokenizer.tokenize(text);

    return tokens
      .filter((token) => !isNonLexicalToken(token))
      .map(mapJapaneseToken);
  }
}