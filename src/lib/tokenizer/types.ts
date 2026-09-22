import type { JLPTLevel } from "@/lib/difficulty/classify";

// Un mot détecté dans un texte : sa forme telle qu'écrite, sa forme de
// dictionnaire, sa lecture, sa catégorie grammaticale, son niveau JLPT et sa
// position dans le texte d'origine. Ce type ne dépend d'aucune librairie de
// tokenisation précise, pour pouvoir en changer plus tard sans tout casser.
export type TokenResult = {
  surface: string;
  baseForm: string;
  reading?: string;
  partOfSpeech: string;
  difficulty: JLPTLevel;
  position: number;
};

// Interface générique qu'une implémentation de tokenizer doit respecter,
// pour pouvoir ajouter d'autres langues que le japonais plus tard.
export interface Tokenizer {
    readonly language: string;

    tokenize(text: string): Promise<TokenResult[]>;
}
