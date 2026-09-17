import path from "node:path";
import * as kuromoji from "kuromoji";
import type {
    IpadicFeatures,
    Tokenizer as KuromojiTokenizer,
} from "kuromoji";
import type { TokenResult, Tokenizer } from "./types";

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

export function mapJapaneseToken(token: JapaneseTokenData): TokenResult {
  return {
    surface: token.surface_form,
    baseForm:
      token.basic_form === "*" ? token.surface_form : token.basic_form,
    reading:
      token.reading === undefined || token.reading === "*"
        ? undefined
        : toHiragana(token.reading),
    partOfSpeech: token.pos,
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

            kuromoji
                .builder({ dicPath: dictionaryPath })
                .build((error, tokenizer) => {
                    if (error) {
                        reject(error);
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

    return tokens.map(mapJapaneseToken);
  }
}