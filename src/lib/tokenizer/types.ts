import type { JLPTLevel } from "@/lib/difficulty/classify";

export type TokenResult = {
  surface: string;
  baseForm: string;
  reading?: string;
  partOfSpeech: string;
  difficulty: JLPTLevel;
  position: number;
};

export interface Tokenizer {
    readonly language: string;

    tokenize(text: string): Promise<TokenResult[]>;
}