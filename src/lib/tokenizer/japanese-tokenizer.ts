import path from "node:path";
import kuromoji from "kuromoji";
import type {
  IpadicFeatures,
  Tokenizer as KuromojiTokenizer,
} from "kuromoji";
import type { TokenResult, Tokenizer } from "./types";
import { classifyDifficulty } from "../difficulty/classify";

// Les champs de kuromoji dont on a besoin pour construire un TokenResult.
type JapaneseTokenData = Pick<
  IpadicFeatures,
  "surface_form" | "basic_form" | "reading" | "pos" | "word_position"
>;

// Convertit une lecture en katakana (format de kuromoji) en hiragana, plus
// naturel à lire pour un texte japonais courant.
export function toHiragana(reading: string): string {
  return reading.replace(/[ァ-ヶ]/g, (character) => {
    const codePoint = character.codePointAt(0);

    return codePoint === undefined
      ? character
      : String.fromCodePoint(codePoint - 0x60);
  });
}

// Repère les tokens qui ne sont pas de vrais mots (ponctuation, symboles,
// texte vide) pour pouvoir les filtrer de l'analyse.
export function isNonLexicalToken(
  token: Pick<IpadicFeatures, "surface_form" | "pos">,
): boolean {
  return (
    token.pos === "記号" ||
    token.surface_form.trim().length === 0 ||
    /^[\p{P}\p{S}]$/u.test(token.surface_form)
  );
}

// Transforme un token brut de kuromoji en TokenResult utilisable par le
// reste de l'application, en ajoutant le niveau JLPT.
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

// Implémentation du Tokenizer pour le japonais, basée sur kuromoji (analyse
// morphologique par dictionnaire).
export class JapaneseTokenizer implements Tokenizer {
  readonly language = "ja";

  // Le dictionnaire kuromoji met du temps à charger : on ne le charge
  // qu'une seule fois et on réutilise cette promesse pour tous les appels.
  private readonly tokenizerPromise: Promise<KuromojiTokenizer<IpadicFeatures>>;

  constructor() {
    this.tokenizerPromise = new Promise((resolve, reject) => {
      // Le dictionnaire est fourni par le paquet kuromoji lui-même.
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

      // Construit le tokenizer en chargeant le dictionnaire depuis le disque.
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

  // Découpe un texte japonais en mots, filtre la ponctuation et convertit
  // chaque token dans le format commun TokenResult.
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
